-- Formaliza configuracoes de fusao Hashpo + ZicoBank em colunas proprias.
alter table public.mini_sites
  add column if not exists content_language text not null default 'en',
  add column if not exists blog_enabled boolean not null default true,
  add column if not exists feed_mode text not null default 'hybrid',
  add column if not exists wallet_login_enabled boolean not null default true,
  add column if not exists avatar_video_url text,
  add column if not exists avatar_video_muted boolean not null default true,
  add column if not exists blog_pages jsonb not null default '[]'::jsonb,
  add column if not exists seo_title text,
  add column if not exists seo_description text,
  add column if not exists seo_image_url text;

alter table public.mini_sites
  drop constraint if exists mini_sites_feed_mode_check;

alter table public.mini_sites
  add constraint mini_sites_feed_mode_check
  check (feed_mode in ('hybrid', '7d', '365d', 'dual'));
