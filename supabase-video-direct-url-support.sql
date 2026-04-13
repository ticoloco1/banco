-- Support direct hosted videos (mp4/hls) in mini_site_videos.

alter table if exists public.mini_site_videos
  add column if not exists video_url text;

