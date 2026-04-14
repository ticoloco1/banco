
-- =============================================
-- 1) BROKERAGE FEE COLUMNS on platform_settings
-- =============================================
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS brokerage_fee_pct numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS brokerage_to_treasury_pct numeric NOT NULL DEFAULT 70,
  ADD COLUMN IF NOT EXISTS brokerage_to_buyback_pct numeric NOT NULL DEFAULT 30;

-- =============================================
-- 2) TRANSACTIONS: add fee breakdown columns
-- =============================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS gross_amount numeric,
  ADD COLUMN IF NOT EXISTS brokerage_fee_amount numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount numeric,
  ADD COLUMN IF NOT EXISTS fee_to_treasury numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_to_buyback numeric DEFAULT 0;

-- =============================================
-- 3) INDEX SETTINGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.index_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  symbol text NOT NULL DEFAULT 'HPI',
  base_value numeric NOT NULL DEFAULT 1000,
  divisor numeric NOT NULL DEFAULT 1,
  update_interval_seconds integer NOT NULL DEFAULT 300,
  min_age_days integer NOT NULL DEFAULT 30,
  min_avg_monthly_revenue numeric NOT NULL DEFAULT 50,
  min_trading_volume_30d numeric NOT NULL DEFAULT 500,
  weight_market_cap numeric NOT NULL DEFAULT 50,
  weight_revenue numeric NOT NULL DEFAULT 30,
  weight_volume numeric NOT NULL DEFAULT 10,
  weight_engagement numeric NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.index_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Index settings readable by all" ON public.index_settings FOR SELECT USING (true);
CREATE POLICY "Admins update index settings" ON public.index_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Seed default row
INSERT INTO public.index_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4) INDEX HISTORY (time series)
-- =============================================
CREATE TABLE IF NOT EXISTS public.index_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hpi_value numeric NOT NULL,
  change_24h numeric DEFAULT 0,
  change_7d numeric DEFAULT 0,
  constituents_up integer DEFAULT 0,
  constituents_down integer DEFAULT 0,
  total_market_cap numeric DEFAULT 0,
  total_volume_24h numeric DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.index_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Index history readable by all" ON public.index_history FOR SELECT USING (true);

-- =============================================
-- 5) INDEX CONSTITUENTS (current snapshot)
-- =============================================
CREATE TABLE IF NOT EXISTS public.index_constituents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  weight_pct numeric NOT NULL DEFAULT 0,
  market_cap numeric DEFAULT 0,
  revenue_30d numeric DEFAULT 0,
  volume_30d numeric DEFAULT 0,
  engagement_score numeric DEFAULT 0,
  normalized_score numeric DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(video_id)
);
ALTER TABLE public.index_constituents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Constituents readable by all" ON public.index_constituents FOR SELECT USING (true);

-- =============================================
-- 6) FUTURES CONTRACTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.futures_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL,
  expiry_date timestamptz NOT NULL,
  contract_multiplier numeric NOT NULL DEFAULT 1.0,
  initial_margin_pct numeric NOT NULL DEFAULT 10,
  maintenance_margin_pct numeric NOT NULL DEFAULT 6,
  fee_open_pct numeric NOT NULL DEFAULT 0.1,
  fee_close_pct numeric NOT NULL DEFAULT 0.1,
  max_leverage integer NOT NULL DEFAULT 2,
  enabled boolean NOT NULL DEFAULT true,
  short_enabled boolean NOT NULL DEFAULT false,
  last_price numeric DEFAULT 0,
  open_interest numeric DEFAULT 0,
  volume_24h numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.futures_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Futures contracts readable by all" ON public.futures_contracts FOR SELECT USING (true);
CREATE POLICY "Admins manage futures contracts" ON public.futures_contracts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 7) FUTURES ORDERBOOK ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.futures_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.futures_contracts(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('long','short')),
  order_type text NOT NULL CHECK (order_type IN ('market','limit')),
  price numeric,
  quantity numeric NOT NULL,
  filled_qty numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','partial','filled','cancelled')),
  margin_locked numeric NOT NULL DEFAULT 0,
  fee_paid numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.futures_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own futures orders" ON public.futures_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own futures orders" ON public.futures_orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own futures orders" ON public.futures_orders FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 8) FUTURES TRADES
-- =============================================
CREATE TABLE IF NOT EXISTS public.futures_trades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.futures_contracts(id) ON DELETE CASCADE,
  maker_order_id uuid REFERENCES public.futures_orders(id),
  taker_order_id uuid REFERENCES public.futures_orders(id),
  maker_id uuid NOT NULL,
  taker_id uuid NOT NULL,
  price numeric NOT NULL,
  quantity numeric NOT NULL,
  maker_fee numeric NOT NULL DEFAULT 0,
  taker_fee numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.futures_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own futures trades" ON public.futures_trades FOR SELECT USING (auth.uid() = maker_id OR auth.uid() = taker_id);
CREATE POLICY "Futures trades readable by all" ON public.futures_trades FOR SELECT USING (true);

-- =============================================
-- 9) FUTURES POSITIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.futures_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_id uuid NOT NULL REFERENCES public.futures_contracts(id) ON DELETE CASCADE,
  side text NOT NULL CHECK (side IN ('long','short')),
  quantity numeric NOT NULL DEFAULT 0,
  entry_price numeric NOT NULL,
  margin_locked numeric NOT NULL DEFAULT 0,
  leverage integer NOT NULL DEFAULT 1,
  unrealized_pnl numeric NOT NULL DEFAULT 0,
  liquidation_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, contract_id, side)
);
ALTER TABLE public.futures_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own positions" ON public.futures_positions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own positions" ON public.futures_positions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own positions" ON public.futures_positions FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 10) RISK LIMITS (admin-configurable)
-- =============================================
CREATE TABLE IF NOT EXISTS public.futures_risk_limits (
  id integer PRIMARY KEY DEFAULT 1,
  max_position_per_user numeric NOT NULL DEFAULT 10000,
  global_exposure_limit numeric NOT NULL DEFAULT 1000000,
  circuit_breaker_pct numeric NOT NULL DEFAULT 10,
  circuit_breaker_window_minutes integer NOT NULL DEFAULT 5,
  trading_paused boolean NOT NULL DEFAULT false,
  mock_mode boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.futures_risk_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Risk limits readable by all" ON public.futures_risk_limits FOR SELECT USING (true);
CREATE POLICY "Admins update risk limits" ON public.futures_risk_limits FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.futures_risk_limits (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11) LEDGER TRANSACTIONS (all fee/margin movements)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ledger_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tx_type text NOT NULL,
  amount numeric NOT NULL,
  balance_after numeric,
  reference_id uuid,
  reference_type text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own ledger" ON public.ledger_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own ledger" ON public.ledger_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_index_settings_updated_at BEFORE UPDATE ON public.index_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_futures_contracts_updated_at BEFORE UPDATE ON public.futures_contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_futures_orders_updated_at BEFORE UPDATE ON public.futures_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_futures_positions_updated_at BEFORE UPDATE ON public.futures_positions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_futures_risk_limits_updated_at BEFORE UPDATE ON public.futures_risk_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
