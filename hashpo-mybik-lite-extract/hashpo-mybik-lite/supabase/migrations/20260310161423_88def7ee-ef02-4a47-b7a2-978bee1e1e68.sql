
-- Verification badges table
CREATE TABLE public.verification_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_type text NOT NULL DEFAULT 'personal',
  plan_type text NOT NULL DEFAULT 'monthly',
  status text NOT NULL DEFAULT 'pending',
  monthly_price numeric NOT NULL DEFAULT 8.00,
  annual_price numeric NOT NULL DEFAULT 86.40,
  paid_amount numeric NOT NULL DEFAULT 0,
  company_name text,
  kyc_data jsonb DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.verification_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own badge" ON public.verification_badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own badge" ON public.verification_badges FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public read active badges" ON public.verification_badges FOR SELECT USING (status = 'active');

-- Company subscriptions table
CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text NOT NULL,
  company_email text,
  plan_price numeric NOT NULL DEFAULT 399,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own subs" ON public.company_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own subs" ON public.company_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Domain listings table
CREATE TABLE public.domain_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  domain_name text NOT NULL,
  domain_url text,
  domain_type text NOT NULL DEFAULT 'web2',
  tld text DEFAULT '',
  description text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USDC',
  accept_crypto boolean NOT NULL DEFAULT true,
  accept_stripe boolean NOT NULL DEFAULT false,
  registrar text,
  category text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.domain_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Domain listings readable by all" ON public.domain_listings FOR SELECT USING (true);
CREATE POLICY "Users manage own domain listings" ON public.domain_listings FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Domain escrows table
CREATE TABLE public.domain_escrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.domain_listings(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  domain_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USDC',
  payment_method text NOT NULL DEFAULT 'crypto',
  status text NOT NULL DEFAULT 'pending',
  platform_fee_pct numeric NOT NULL DEFAULT 5,
  platform_fee_amount numeric NOT NULL DEFAULT 0,
  net_to_seller numeric NOT NULL DEFAULT 0,
  buyer_confirmed boolean NOT NULL DEFAULT false,
  seller_confirmed boolean NOT NULL DEFAULT false,
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.domain_escrows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyers see own escrows" ON public.domain_escrows FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers see own escrows" ON public.domain_escrows FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers insert escrows" ON public.domain_escrows FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Participants update escrows" ON public.domain_escrows FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Slug listings table
CREATE TABLE public.slug_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  site_id uuid REFERENCES public.mini_sites(id),
  slug text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  buyer_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.slug_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slug listings readable by all" ON public.slug_listings FOR SELECT USING (true);
CREATE POLICY "Users manage own slug listings" ON public.slug_listings FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Slug auctions table
CREATE TABLE public.slug_auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid,
  keyword text NOT NULL,
  starting_price numeric NOT NULL DEFAULT 100,
  current_bid numeric,
  current_bidder_id uuid,
  min_increment numeric NOT NULL DEFAULT 10,
  status text NOT NULL DEFAULT 'active',
  ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.slug_auctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slug auctions readable by all" ON public.slug_auctions FOR SELECT USING (true);
CREATE POLICY "Users manage own slug auctions" ON public.slug_auctions FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Slug auction bids table
CREATE TABLE public.slug_auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid REFERENCES public.slug_auctions(id) NOT NULL,
  bidder_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.slug_auction_bids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bids readable by all" ON public.slug_auction_bids FOR SELECT USING (true);
CREATE POLICY "Users insert own bids" ON public.slug_auction_bids FOR INSERT WITH CHECK (auth.uid() = bidder_id);

-- Slug transactions table
CREATE TABLE public.slug_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.slug_listings(id),
  auction_id uuid REFERENCES public.slug_auctions(id),
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  slug text NOT NULL,
  amount numeric NOT NULL,
  platform_fee_pct numeric NOT NULL DEFAULT 5,
  platform_fee_amount numeric NOT NULL DEFAULT 0,
  net_to_seller numeric NOT NULL DEFAULT 0,
  tx_type text NOT NULL DEFAULT 'sale',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.slug_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own slug txs" ON public.slug_transactions FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users insert own slug txs" ON public.slug_transactions FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Slug registrations table
CREATE TABLE public.slug_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text NOT NULL UNIQUE,
  registration_fee numeric NOT NULL DEFAULT 12.00,
  renewal_fee numeric NOT NULL DEFAULT 12.00,
  slug_type text NOT NULL DEFAULT 'standard',
  is_free_with_plan boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  renewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.slug_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own registrations" ON public.slug_registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own registrations" ON public.slug_registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own registrations" ON public.slug_registrations FOR UPDATE USING (auth.uid() = user_id);

-- Add new columns to premium_slugs for the marketplace
ALTER TABLE public.premium_slugs ADD COLUMN IF NOT EXISTS keyword text;
ALTER TABLE public.premium_slugs ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
ALTER TABLE public.premium_slugs ADD COLUMN IF NOT EXISTS sold_to uuid;
ALTER TABLE public.premium_slugs ADD COLUMN IF NOT EXISTS sold_at timestamptz;

-- Update existing premium_slugs: set keyword = slug where null
UPDATE public.premium_slugs SET keyword = slug WHERE keyword IS NULL;
