-- TrustBank: sessões de tráfego (plataforma + mini-sites), cliques (heatmap) e coluna region em site_visits.
-- Executar no Supabase SQL Editor. Escritas via service role (API); leitura dono do mini-site ou API admin.

alter table if exists site_visits add column if not exists region text;
alter table if exists site_link_clicks add column if not exists region text;
alter table if exists feed_post_views add column if not exists region text;
alter table if exists site_page_views add column if not exists region text;

create table if not exists traffic_sessions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references mini_sites (id) on delete cascade,
  scope text not null default 'minisite' check (scope in ('platform', 'minisite')),
  visitor_id text not null,
  entry_path text,
  exit_path text,
  duration_seconds integer not null default 0,
  opened_checkout boolean not null default false,
  city text,
  region text,
  country text,
  user_agent text,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists traffic_sessions_site_started_idx on traffic_sessions (site_id, started_at desc);
create index if not exists traffic_sessions_scope_started_idx on traffic_sessions (scope, started_at desc);
create index if not exists traffic_sessions_visitor_idx on traffic_sessions (visitor_id, started_at desc);

create table if not exists traffic_clicks (
  id uuid primary key default gen_random_uuid(),
  site_id uuid references mini_sites (id) on delete cascade,
  session_id uuid references traffic_sessions (id) on delete cascade,
  click_key text not null,
  page_path text,
  created_at timestamptz not null default now()
);

create index if not exists traffic_clicks_site_created_idx on traffic_clicks (site_id, created_at desc);
create index if not exists traffic_clicks_session_idx on traffic_clicks (session_id);

alter table traffic_sessions enable row level security;
alter table traffic_clicks enable row level security;

drop policy if exists "traffic_sessions_owner_select" on traffic_sessions;
create policy "traffic_sessions_owner_select" on traffic_sessions for select using (
  site_id is not null
  and exists (select 1 from mini_sites m where m.id = traffic_sessions.site_id and m.user_id = auth.uid())
);

drop policy if exists "traffic_clicks_owner_select" on traffic_clicks;
create policy "traffic_clicks_owner_select" on traffic_clicks for select using (
  site_id is not null
  and exists (select 1 from mini_sites m where m.id = traffic_clicks.site_id and m.user_id = auth.uid())
);

-- Sem políticas INSERT/UPDATE/DELETE para anon/auth: apenas service role (API).

comment on table traffic_sessions is 'Sessões: entrada/saída, tempo, geo (headers Vercel/CF), checkout aberto.';
comment on table traffic_clicks is 'Cliques com data-tb-analytics ou captura delegada (Planos, Paywall, etc.).';
