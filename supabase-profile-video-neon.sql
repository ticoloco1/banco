-- Opções do vídeo de perfil no mini-site público: borda neon pulsante e cor (visitante pode silenciar no UI).
alter table public.mini_sites
  add column if not exists profile_video_neon_enabled boolean default true;

alter table public.mini_sites
  add column if not exists profile_video_neon_color text null;

comment on column public.mini_sites.profile_video_neon_enabled is
  'When true (default), profile loop video shows animated neon border on public mini-site.';

comment on column public.mini_sites.profile_video_neon_color is
  'Hex neon accent; null = use mini-site accent_color.';
