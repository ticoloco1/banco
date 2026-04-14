
-- 1. Create private table to store actual video URLs (YouTube IDs)
CREATE TABLE public.private_video_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.mini_site_videos(id) ON DELETE CASCADE,
  youtube_video_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(video_id)
);

-- 2. RLS: only service role (edge functions) can read this table
ALTER TABLE public.private_video_urls ENABLE ROW LEVEL SECURITY;

-- No public SELECT policy = nobody can read via client SDK
-- Only owners can manage their own entries
CREATE POLICY "Owners manage own private urls"
  ON public.private_video_urls
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.mini_site_videos msv
      WHERE msv.id = private_video_urls.video_id
        AND msv.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mini_site_videos msv
      WHERE msv.id = private_video_urls.video_id
        AND msv.user_id = auth.uid()
    )
  );

-- 3. Migrate existing youtube_video_ids to private table
INSERT INTO public.private_video_urls (video_id, youtube_video_id)
SELECT id, youtube_video_id FROM public.mini_site_videos
WHERE youtube_video_id IS NOT NULL AND youtube_video_id != '';

-- 4. Add hosting plan columns to platform_settings
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS hosting_plan_bunny_price numeric NOT NULL DEFAULT 19.90,
  ADD COLUMN IF NOT EXISTS hosting_plan_youtube_price numeric NOT NULL DEFAULT 5.99,
  ADD COLUMN IF NOT EXISTS paywall_min_price numeric NOT NULL DEFAULT 0.60;
