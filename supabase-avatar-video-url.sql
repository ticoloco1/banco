-- Vídeo curto em loop no perfil do mini-site (alternativa à foto estática).
-- Executar no SQL Editor do Supabase.

alter table public.mini_sites
  add column if not exists avatar_video_url text null;

comment on column public.mini_sites.avatar_video_url is 'URL pública (Storage) de vídeo WebM/MP4 em loop no avatar; opcional.';
