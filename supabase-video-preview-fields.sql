-- Marketing preview fields for paywalled videos.

alter table if exists public.mini_site_videos
  add column if not exists preview_image_url text;

alter table if exists public.mini_site_videos
  add column if not exists preview_embed_url text;

