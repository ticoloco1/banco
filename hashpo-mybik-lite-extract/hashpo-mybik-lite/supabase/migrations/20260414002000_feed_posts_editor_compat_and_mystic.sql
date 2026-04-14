-- Keep feed/editor compatible with current UI payload.
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS photo_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS video_embed_url text,
  ADD COLUMN IF NOT EXISTS highlight_color text;

-- Production error reported by editor save payload.
ALTER TABLE public.mini_sites
  ADD COLUMN IF NOT EXISTS mystic_lottery_premium_price_usd numeric;
