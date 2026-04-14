-- Add paywall columns for video-only paywall (separate from NFT)
ALTER TABLE public.mini_site_videos 
  ADD COLUMN IF NOT EXISTS paywall_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS paywall_price numeric DEFAULT 0.15;

-- Table for video paywall unlocks (not NFT, just watch access)
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

ALTER TABLE public.video_paywall_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own video paywall unlocks" ON public.video_paywall_unlocks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see own video paywall unlocks" ON public.video_paywall_unlocks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Creators see unlocks on their videos" ON public.video_paywall_unlocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mini_site_videos v WHERE v.id = video_id AND v.user_id = auth.uid()
    )
  );