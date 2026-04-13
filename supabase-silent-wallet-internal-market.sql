-- Wallet silenciosa (WaaS / custodial servidor) + NFTs internos + mercado escrow em saldo interno USDC

-- ─── Wallet silenciosa ─────────────────────────────────────────────────────
create table if not exists public.user_silent_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  wallet_address text not null,
  provider text not null check (provider in ('privy', 'custodial_viem')),
  privy_user_id text null,
  encrypted_private_key text null,
  enc_iv text null,
  enc_auth_tag text null,
  enc_salt text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_silent_wallets_address_chk check (wallet_address ~* '^0x[a-f0-9]{40}$')
);

create unique index if not exists user_silent_wallets_address_uidx on public.user_silent_wallets (lower(wallet_address));

alter table public.user_silent_wallets enable row level security;

-- Sem policies: acesso só service role / APIs servidor.

-- ─── NFT interno (espelho off-chain; opcionalmente liga a contrato on-chain) ─
create table if not exists public.internal_nft_positions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'TrustBank NFT',
  description text null,
  metadata_uri text null,
  image_url text null,
  animation_url text null,
  attributes jsonb not null default '[]'::jsonb,
  chain_contract text null,
  chain_token_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_nft_positions_owner_idx on public.internal_nft_positions(owner_user_id, created_at desc);

alter table public.internal_nft_positions enable row level security;

-- ─── Saldo interno USDC (créditos no site — sem gás Polygon) ────────────────
create table if not exists public.user_internal_usdc_balance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance_usdc numeric(14,2) not null default 0 check (balance_usdc >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_internal_usdc_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_usdc numeric(14,2) not null,
  kind text not null,
  ref_id uuid null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_internal_usdc_ledger_user_idx on public.user_internal_usdc_ledger(user_id, created_at desc);

alter table public.user_internal_usdc_balance enable row level security;
alter table public.user_internal_usdc_ledger enable row level security;

-- Pool de taxas do mercado interno (10% admin)
insert into public.platform_settings (key, value, updated_at)
values ('internal_market_admin_pool_usdc', '0', now())
on conflict (key) do nothing;

-- ─── Mercado interno (escrow lógico: listagem + compra atómica na API) ─────
create table if not exists public.internal_marketplace (
  id uuid primary key default gen_random_uuid(),
  internal_nft_id uuid not null references public.internal_nft_positions(id) on delete cascade,
  seller_user_id uuid not null references auth.users(id) on delete cascade,
  buyer_user_id uuid references auth.users(id) on delete set null,
  price_usdc numeric(12,2) not null check (price_usdc > 0),
  admin_fee_pct numeric(5,2) not null default 10 check (admin_fee_pct >= 0 and admin_fee_pct <= 100),
  status text not null default 'listed' check (status in ('listed', 'sold', 'cancelled')),
  created_at timestamptz not null default now(),
  sold_at timestamptz null
);

create index if not exists internal_marketplace_status_idx on public.internal_marketplace(status, created_at desc);
create index if not exists internal_marketplace_seller_idx on public.internal_marketplace(seller_user_id, status);

alter table public.internal_marketplace enable row level security;
