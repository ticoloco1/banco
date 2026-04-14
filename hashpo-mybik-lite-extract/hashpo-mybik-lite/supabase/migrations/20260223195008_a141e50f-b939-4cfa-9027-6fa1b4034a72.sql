
-- Table to track paywall unlocks
CREATE TABLE public.paywall_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id),
  amount_paid numeric NOT NULL,
  platform_fee numeric NOT NULL,
  net_to_holders numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

ALTER TABLE public.paywall_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own unlocks" ON public.paywall_unlocks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Insert via service role only" ON public.paywall_unlocks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Table to track per-holder dividend payouts (the ledger)
CREATE TABLE public.dividend_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id),
  dividend_id uuid REFERENCES public.dividends(id),
  source text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  shares_held integer NOT NULL DEFAULT 0,
  polygon_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dividend_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Holders see own payouts" ON public.dividend_payouts
  FOR SELECT TO authenticated USING (auth.uid() = holder_id);

-- User wallet/balance tracking
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own wallet" ON public.wallets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own wallet" ON public.wallets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own wallet" ON public.wallets
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger for wallet updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for dividend_payouts so dashboard updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.dividend_payouts;
