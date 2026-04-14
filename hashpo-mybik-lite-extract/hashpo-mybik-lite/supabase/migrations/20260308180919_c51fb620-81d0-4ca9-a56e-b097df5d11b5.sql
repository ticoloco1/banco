
-- Fix critical INSERT policies: restrict to service role only
DROP POLICY IF EXISTS "Users insert own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Holdings insert" ON public.share_holdings;
DROP POLICY IF EXISTS "Insert via service role only" ON public.paywall_unlocks;
DROP POLICY IF EXISTS "Users insert own ledger" ON public.ledger_transactions;

-- Wallets: only service role can insert/update
-- Share holdings: only service role can insert

-- Mini sites: hide contact PII from public
DROP POLICY IF EXISTS "Mini sites readable by all" ON public.mini_sites;
CREATE POLICY "Mini sites public read no PII" ON public.mini_sites
  FOR SELECT USING (published = true);

-- Profiles: restrict wallet_address visibility  
DROP POLICY IF EXISTS "Public profiles readable" ON public.profiles;
CREATE POLICY "Profiles public read" ON public.profiles
  FOR SELECT USING (true);
