
-- New revenue split and branding columns for platform_settings
ALTER TABLE public.platform_settings 
  ADD COLUMN IF NOT EXISTS nft_launch_fee numeric NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS nft_creator_pct numeric NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS nft_platform_pct numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS paywall_creator_pct numeric NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS paywall_platform_pct numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS recharge_creator_pct numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS recharge_platform_pct numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS marketplace_fee_pct numeric NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS marketplace_creator_pct numeric NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS marketplace_platform_pct numeric NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS cv_unlock_price numeric NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cv_creator_pct numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS cv_platform_pct numeric NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS platform_name text NOT NULL DEFAULT 'HASHPO',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS font_heading text NOT NULL DEFAULT 'Inter',
  ADD COLUMN IF NOT EXISTS font_body text NOT NULL DEFAULT 'Inter';
