-- Performance: consulta pública por slug + published
CREATE INDEX IF NOT EXISTS idx_mini_sites_slug_published
  ON public.mini_sites (slug)
  WHERE published = true;

-- Verificação de posse do vídeo (código em /verify/{code})
ALTER TABLE public.mini_site_videos
  ADD COLUMN IF NOT EXISTS youtube_verification_code text;

CREATE UNIQUE INDEX IF NOT EXISTS mini_site_videos_youtube_verification_code_key
  ON public.mini_site_videos (youtube_verification_code)
  WHERE youtube_verification_code IS NOT NULL AND youtube_verification_code != '';

ALTER TABLE public.mini_site_videos
  ADD COLUMN IF NOT EXISTS youtube_verified_at timestamptz;

-- Tabela de desbloqueios do paywall por vídeo (mini site) — cria se ainda não existir
CREATE TABLE IF NOT EXISTS public.video_paywall_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.mini_site_videos(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 0,
  creator_share numeric NOT NULL DEFAULT 0,
  platform_share numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.video_paywall_unlocks
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '12 hours');

ALTER TABLE public.video_paywall_unlocks
  ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'stripe';

ALTER TABLE public.video_paywall_unlocks
  ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;

ALTER TABLE public.video_paywall_unlocks ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (idempotente); INSERT direto pelo cliente fica desativado no final
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'video_paywall_unlocks'
      AND policyname = 'Users see own video paywall unlocks'
  ) THEN
    CREATE POLICY "Users see own video paywall unlocks" ON public.video_paywall_unlocks
      FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Dono do vídeo = dono do mini site (via site_id → mini_sites.user_id).
  -- Não usa mini_site_videos.user_id: alguns bancos só têm site_id no vídeo.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'mini_site_videos' AND column_name = 'site_id'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'video_paywall_unlocks'
        AND policyname = 'Creators see unlocks on their videos'
    ) THEN
      DROP POLICY "Creators see unlocks on their videos" ON public.video_paywall_unlocks;
    END IF;
    CREATE POLICY "Creators see unlocks on their videos" ON public.video_paywall_unlocks
      FOR SELECT USING (
        EXISTS (
          SELECT 1
          FROM public.mini_site_videos v
          INNER JOIN public.mini_sites s ON s.id = v.site_id
          WHERE v.id = video_id AND s.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Desbloqueio só após pagamento confirmado (edge function com service role)
DROP POLICY IF EXISTS "Users insert own video paywall unlocks" ON public.video_paywall_unlocks;
