
-- Add expiry tracking to video paywall unlocks
ALTER TABLE public.video_paywall_unlocks 
  ADD COLUMN IF NOT EXISTS expires_at timestamptz DEFAULT (now() + interval '12 hours');

-- Add paywall pricing config to platform_settings
ALTER TABLE public.platform_settings 
  ADD COLUMN IF NOT EXISTS paywall_expires_hours integer DEFAULT 12,
  ADD COLUMN IF NOT EXISTS paywall_min_embed numeric DEFAULT 0.10,
  ADD COLUMN IF NOT EXISTS paywall_min_bunny numeric DEFAULT 0.60;
