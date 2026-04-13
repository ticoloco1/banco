-- Campanhas de drop NFT por marca (lead-only ou full-access).
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'NFT Campaign',
  type text not null check (type in ('Lead_Only', 'Full_Access')),
  target_account_type text null default 'all',
  placement_type text null default 'targeted',
  ad_link_url text null,
  ad_video_url text null,
  price_per_lead numeric(10,2) not null check (price_per_lead >= 0),
  setup_fee numeric(10,2) not null check (setup_fee >= 0),
  total_budget numeric(12,2) not null default 0 check (total_budget >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_campaigns
  add column if not exists target_account_type text null default 'all';
alter table public.marketing_campaigns
  add column if not exists placement_type text null default 'targeted';
alter table public.marketing_campaigns
  add column if not exists ad_link_url text null;
alter table public.marketing_campaigns
  add column if not exists ad_video_url text null;

alter table public.marketing_campaigns enable row level security;

drop policy if exists marketing_campaigns_select_owner on public.marketing_campaigns;
create policy marketing_campaigns_select_owner
  on public.marketing_campaigns for select
  using (auth.uid() = brand_id);

drop policy if exists marketing_campaigns_insert_owner on public.marketing_campaigns;
create policy marketing_campaigns_insert_owner
  on public.marketing_campaigns for insert
  with check (auth.uid() = brand_id);

drop policy if exists marketing_campaigns_update_owner on public.marketing_campaigns;
create policy marketing_campaigns_update_owner
  on public.marketing_campaigns for update
  using (auth.uid() = brand_id)
  with check (auth.uid() = brand_id);

create table if not exists public.campaign_leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  has_kyc boolean not null default false,
  data_payload jsonb not null default '{}'::jsonb,
  wallet_address text null,
  delivery_status text not null default 'pending',
  delivery_tx_hash text null,
  delivered_at timestamptz null,
  delivery_error text null,
  created_at timestamptz not null default now(),
  unique(user_id, campaign_id)
);

create index if not exists campaign_leads_campaign_idx on public.campaign_leads(campaign_id, created_at desc);
create index if not exists campaign_leads_delivery_idx on public.campaign_leads(delivery_status, created_at desc);

alter table public.campaign_leads add column if not exists delivery_status text not null default 'pending';
alter table public.campaign_leads add column if not exists delivery_tx_hash text null;
alter table public.campaign_leads add column if not exists delivered_at timestamptz null;
alter table public.campaign_leads add column if not exists delivery_error text null;

alter table public.campaign_leads enable row level security;

-- Marca dona da campanha pode ver os leads da campanha.
drop policy if exists campaign_leads_select_brand on public.campaign_leads;
create policy campaign_leads_select_brand
  on public.campaign_leads for select
  using (
    exists (
      select 1
      from public.marketing_campaigns mc
      where mc.id = campaign_id
        and mc.brand_id = auth.uid()
    )
  );

-- Utilizador pode criar o próprio claim (API valida regras de KYC e orçamento).
drop policy if exists campaign_leads_insert_self on public.campaign_leads;
create policy campaign_leads_insert_self
  on public.campaign_leads for insert
  with check (auth.uid() = user_id);

-- Flag KYC por utilizador (para bloquear botão de claim).
create table if not exists public.user_kyc_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kyc_verified boolean not null default false,
  full_name text null,
  city text null,
  email text null,
  wallet_address text null,
  consent_nft_ads boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.company_profiles
  add column if not exists target_account_type text null;
alter table public.company_profiles
  add column if not exists campaign_category text null;

-- Pagamentos USDC Polygon para campanhas (principal).
create table if not exists public.marketing_campaign_usdc_intents (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  brand_id uuid not null references auth.users(id) on delete cascade,
  payer_wallet text not null,
  amount_usd numeric(12,2) not null,
  amount_units text not null,
  treasury_wallet text not null,
  tx_hash text null,
  status text not null default 'pending',
  paid_at timestamptz null,
  created_at timestamptz not null default now()
);
create index if not exists marketing_campaign_usdc_intents_campaign_idx
  on public.marketing_campaign_usdc_intents(campaign_id, created_at desc);

-- Jobs de envio NFT automático (worker/admin).
create table if not exists public.marketing_nft_delivery_jobs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.marketing_campaigns(id) on delete cascade,
  lead_id uuid not null references public.campaign_leads(id) on delete cascade,
  wallet_address text not null,
  status text not null default 'queued',
  tx_hash text null,
  error text null,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(campaign_id, lead_id)
);
create index if not exists marketing_nft_delivery_jobs_status_idx
  on public.marketing_nft_delivery_jobs(status, created_at desc);

-- Cashback Pro interno (saque USDC).
create table if not exists public.user_usdc_rewards_balance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_usd numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);
create table if not exists public.user_usdc_rewards_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  source_id text null,
  amount_usd numeric(12,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists user_usdc_rewards_ledger_user_idx
  on public.user_usdc_rewards_ledger(user_id, created_at desc);

create table if not exists public.user_usdc_rewards_withdraw_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wallet_address text not null,
  amount_usd numeric(12,2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
create index if not exists user_usdc_rewards_withdraw_user_idx
  on public.user_usdc_rewards_withdraw_requests(user_id, created_at desc);

-- Marketplace secundário NFT (colecionáveis).
create table if not exists public.nft_secondary_listings (
  id uuid primary key default gen_random_uuid(),
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  seller_wallet text not null,
  contract_address text not null,
  token_id text not null,
  chain_id int not null default 137,
  price_usdc numeric(12,2) not null,
  currency text not null default 'USDC',
  nft_name text null,
  nft_image text null,
  nft_metadata jsonb not null default '{}'::jsonb,
  original_ad_link_url text null,
  original_ad_video_url text null,
  status text not null default 'listed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists nft_secondary_listings_status_idx
  on public.nft_secondary_listings(status, created_at desc);

alter table public.user_kyc_status enable row level security;

drop policy if exists user_kyc_select_self on public.user_kyc_status;
create policy user_kyc_select_self
  on public.user_kyc_status for select
  using (auth.uid() = user_id);

drop policy if exists user_kyc_upsert_self on public.user_kyc_status;
create policy user_kyc_upsert_self
  on public.user_kyc_status for insert
  with check (auth.uid() = user_id);

drop policy if exists user_kyc_update_self on public.user_kyc_status;
create policy user_kyc_update_self
  on public.user_kyc_status for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
