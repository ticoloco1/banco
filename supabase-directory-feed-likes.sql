-- Diretório global: likes nos posts do feed + passe pago para activar feed no mini-site.
-- Executar no SQL Editor do Supabase.

alter table public.mini_sites
  add column if not exists feed_paid_until timestamptz null;

comment on column public.mini_sites.feed_paid_until is
  'Enquanto > now(), o dono pode publicar no feed do mini-site (passe 7d ou 365d).';

create table if not exists public.feed_post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists feed_post_likes_post_id_idx on public.feed_post_likes (post_id);
create index if not exists feed_post_likes_user_id_idx on public.feed_post_likes (user_id);

alter table public.feed_post_likes enable row level security;

drop policy if exists "fpl_select" on public.feed_post_likes;
drop policy if exists "fpl_ins" on public.feed_post_likes;
drop policy if exists "fpl_del" on public.feed_post_likes;

create policy "fpl_select" on public.feed_post_likes for select using (true);
create policy "fpl_ins" on public.feed_post_likes for insert with check (auth.uid() = user_id);
create policy "fpl_del" on public.feed_post_likes for delete using (auth.uid() = user_id);
