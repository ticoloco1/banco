
-- Subdomain auctions table
CREATE TABLE public.subdomain_auctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  slug_length integer NOT NULL DEFAULT 1,
  min_price numeric NOT NULL DEFAULT 500,
  current_bid numeric DEFAULT 0,
  current_bidder_id uuid,
  winner_id uuid,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subdomain_auctions ENABLE ROW LEVEL SECURITY;

-- Everyone can read active auctions
CREATE POLICY "Auctions readable by all" ON public.subdomain_auctions
  FOR SELECT USING (true);

-- Admins manage auctions
CREATE POLICY "Admins manage auctions" ON public.subdomain_auctions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Subdomain bids table
CREATE TABLE public.subdomain_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES public.subdomain_auctions(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.subdomain_bids ENABLE ROW LEVEL SECURITY;

-- All can read bids
CREATE POLICY "Bids readable by all" ON public.subdomain_bids
  FOR SELECT USING (true);

-- Authenticated users place bids
CREATE POLICY "Users place bids" ON public.subdomain_bids
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = bidder_id);

-- Users see own bids
CREATE POLICY "Users see own bids" ON public.subdomain_bids
  FOR SELECT TO authenticated
  USING (auth.uid() = bidder_id);

-- Add boost_rank and boost_expires to mini_sites for directory boost
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS boost_rank integer NOT NULL DEFAULT 0;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS boost_expires_at timestamp with time zone;
