-- Leads de campanhas (email + wallet) e configuração de campanha fixada no mini-site.
-- Executar no SQL Editor do Supabase.

create table if not exists public.leads_marketing (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.mini_sites (id) on delete cascade,
  campaign_id text null,
  email text not null,
  wallet_address text not null,
  meta jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists leads_marketing_site_id_idx on public.leads_marketing (site_id);
create index if not exists leads_marketing_created_at_idx on public.leads_marketing (created_at desc);

comment on table public.leads_marketing is
  'Leads capturados em mini-sites (campanha fixada); webhook opcional para NFT Factory / Polygon.';

alter table public.mini_sites
  add column if not exists pinned_campaign jsonb null;

comment on column public.mini_sites.pinned_campaign is
  'JSON: { enabled, title, subtitle, brandName, ctaLabel, campaignId } para secção de captura NFT/leads.';

alter table public.leads_marketing enable row level security;
