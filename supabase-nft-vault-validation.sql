-- Vault NFT: metadados de marca + QR dinâmico de desconto + modo lojista
--
-- A tabela nft_secondary_listings é definida em supabase-marketing-campaigns.sql.
-- Se ainda não existir, criamos a base aqui para este script poder correr sozinho.

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

alter table public.nft_secondary_listings
  add column if not exists buyer_user_id uuid null references auth.users(id) on delete set null;
alter table public.nft_secondary_listings
  add column if not exists buyer_wallet text null;
alter table public.nft_secondary_listings
  add column if not exists brand_logo_url text null;
alter table public.nft_secondary_listings
  add column if not exists serial_number text null;
alter table public.nft_secondary_listings
  add column if not exists rarity text null;
alter table public.nft_secondary_listings
  add column if not exists redeem_link_url text null;
alter table public.nft_secondary_listings
  add column if not exists usage_rules text null;
alter table public.nft_secondary_listings
  add column if not exists discount_percent numeric(6,2) null;
alter table public.nft_secondary_listings
  add column if not exists campaign_secret text null;

create index if not exists nft_secondary_listings_buyer_idx
  on public.nft_secondary_listings(buyer_user_id, updated_at desc);

create table if not exists public.nft_discount_qr_sessions (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  token_hash text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.nft_secondary_listings(id) on delete cascade,
  wallet_id text not null,
  discount_percent numeric(6,2) not null default 0,
  payload jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null,
  used_at timestamptz null,
  used_by text null,
  created_at timestamptz not null default now()
);

create index if not exists nft_discount_qr_sessions_lookup_idx
  on public.nft_discount_qr_sessions(token, expires_at desc);

alter table public.nft_discount_qr_sessions enable row level security;

drop policy if exists nft_discount_qr_sessions_select_own on public.nft_discount_qr_sessions;
create policy nft_discount_qr_sessions_select_own
  on public.nft_discount_qr_sessions for select
  using (auth.uid() = user_id);

drop policy if exists nft_discount_qr_sessions_insert_own on public.nft_discount_qr_sessions;
create policy nft_discount_qr_sessions_insert_own
  on public.nft_discount_qr_sessions for insert
  with check (auth.uid() = user_id);
