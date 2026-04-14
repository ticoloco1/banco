-- ============================================================
-- Cole e execute TUDO de uma vez no SQL Editor do Lovable
-- (ou no Supabase: Project → SQL Editor → New query → Run)
-- ============================================================

-- 1) Banner: foto (banner_url) ou cor (banner_color); link opcional (banner_link)
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS banner_color text;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS banner_link text;

-- 2) Classificados (carros, motos, barcos) — coluna no mini_sites
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS show_classifieds boolean NOT NULL DEFAULT false;

-- 3) Tabela de itens de classificados
CREATE TABLE IF NOT EXISTS public.classified_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'outros' CHECK (category IN ('carros', 'motos', 'barcos', 'outros')),
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  image_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classified_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Classifieds readable by all" ON public.classified_listings;
CREATE POLICY "Classifieds readable by all" ON public.classified_listings
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Users manage own classifieds" ON public.classified_listings;
CREATE POLICY "Users manage own classifieds" ON public.classified_listings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4) Storage: usuários podem fazer upload em pastas com seu user_id (fotos de imóveis, classificados, banner, avatar)
DROP POLICY IF EXISTS "Users upload own folder platform assets" ON storage.objects;
CREATE POLICY "Users upload own folder platform assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own folder platform assets" ON storage.objects;
CREATE POLICY "Users update own folder platform assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own folder platform assets" ON storage.objects;
CREATE POLICY "Users delete own folder platform assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 5) Exibir slugs à venda no mini site (opcional)
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS show_slugs_for_sale boolean NOT NULL DEFAULT false;

-- 5b) Destaque no diretório de slugs à venda (boost por listagem)
ALTER TABLE public.slug_listings ADD COLUMN IF NOT EXISTS boost_rank integer NOT NULL DEFAULT 0;
ALTER TABLE public.slug_listings ADD COLUMN IF NOT EXISTS boost_expires_at timestamptz;

-- 6) Espaços extras: US$ 1 por espaço por mês (imóveis e classificados), expira em 30 dias
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_property_spaces integer NOT NULL DEFAULT 0;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_property_spaces_expires_at timestamptz;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_classified_spaces integer NOT NULL DEFAULT 0;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_classified_spaces_expires_at timestamptz;
