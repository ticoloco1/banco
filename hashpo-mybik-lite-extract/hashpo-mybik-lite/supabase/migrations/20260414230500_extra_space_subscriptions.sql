-- Assinaturas mensais para espaços extras de classificados/imóveis.
create table if not exists public.extra_space_subscriptions (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.mini_sites(id) on delete cascade,
  user_id uuid not null,
  extra_type text not null check (extra_type in ('classified', 'property')),
  stripe_subscription_id text not null unique,
  stripe_checkout_session_id text,
  status text not null default 'active',
  amount_usd numeric not null default 0,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_extra_space_subscriptions_site_type
  on public.extra_space_subscriptions(site_id, extra_type, status);

create index if not exists idx_extra_space_subscriptions_user
  on public.extra_space_subscriptions(user_id);
