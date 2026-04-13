-- Marquee de marcas, anúncios no feed, sorteios USDC e identificação NFT da campanha

alter table public.marketing_campaigns add column if not exists brand_logo_url text null;
alter table public.marketing_campaigns add column if not exists raffle_nft_contract text null;
alter table public.marketing_campaigns add column if not exists raffle_nft_token_id text null;

comment on column public.marketing_campaigns.brand_logo_url is 'URL da logo no ticker público (campanhas active).';
comment on column public.marketing_campaigns.raffle_nft_contract is 'Opcional: contrato Polygon para elegíveis do sorteio (com token_id).';
comment on column public.marketing_campaigns.raffle_nft_token_id is 'Opcional: tokenId ERC721 para elegíveis; senão usa campaign_leads entregues.';

-- Anúncios patrocinados ligados a campanhas (feed do mini-site)
create table if not exists public.campaign_ads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  title text not null default '',
  body text null,
  image_url text null,
  cta_label text null,
  cta_url text null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_ads_campaign_active_idx
  on public.campaign_ads(campaign_id, active, sort_order);

alter table public.campaign_ads enable row level security;

-- Sem policies = só service role / dashboard; leitura pública via API Next.

-- Pool USDC administrativo para prémios de sorteio (valor em texto decimal)
insert into public.platform_settings (key, value, updated_at)
values ('admin_raffle_usdc_pool', '0', now())
on conflict (key) do nothing;
