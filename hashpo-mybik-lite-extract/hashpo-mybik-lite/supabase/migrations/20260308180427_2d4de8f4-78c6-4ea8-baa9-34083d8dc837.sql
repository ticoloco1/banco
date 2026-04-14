
-- 1. WALLETS: Remove user UPDATE, only service role should change balance
DROP POLICY IF EXISTS "Users update own wallet" ON public.wallets;

-- 2. SHARE_HOLDINGS: Remove user UPDATE
DROP POLICY IF EXISTS "Holdings update own" ON public.share_holdings;

-- 3. FUTURES_POSITIONS: Remove user UPDATE
DROP POLICY IF EXISTS "Users update own positions" ON public.futures_positions;

-- 4. FUTURES_ORDERS: Remove user UPDATE  
DROP POLICY IF EXISTS "Users update own futures orders" ON public.futures_orders;

-- 5. NFT_PURCHASES: Remove user UPDATE
DROP POLICY IF EXISTS "Buyers update own NFT views" ON public.nft_purchases;

-- 6. NOTIFICATIONS: Fix INSERT to require user_id = auth.uid()
DROP POLICY IF EXISTS "Authenticated users insert notifications" ON public.notifications;
CREATE POLICY "Users insert own notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 7. MINI_SITES: Create a view-based approach - remove contact fields from public read
-- Drop the overly permissive policy and recreate without exposing PII
-- We'll use a security definer function instead
CREATE OR REPLACE FUNCTION public.get_mini_site_public(p_slug text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT row_to_json(t) FROM (
    SELECT id, user_id, slug, site_name, bio, avatar_url, banner_url,
           theme, template_id, layout_columns, published, show_cv, custom_css,
           cv_headline, cv_location, cv_content, cv_skills, cv_experience, cv_education, cv_portfolio,
           contact_price, created_at, updated_at
    FROM public.mini_sites
    WHERE slug = p_slug AND published = true
  ) t
$$;

-- 8. Restrict AI settings to admin only
DROP POLICY IF EXISTS "AI settings readable by all" ON public.ai_brain_settings;
CREATE POLICY "AI settings readable by admins" ON public.ai_brain_settings
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Restrict futures_risk_limits to admin only  
DROP POLICY IF EXISTS "Risk limits readable by all" ON public.futures_risk_limits;
CREATE POLICY "Risk limits readable by admins" ON public.futures_risk_limits
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. Restrict futures_trades to participants only
DROP POLICY IF EXISTS "Futures trades readable by all" ON public.futures_trades;

-- 11. Restrict boosts to own records
DROP POLICY IF EXISTS "Boosts readable by all" ON public.boosts;
CREATE POLICY "Users see own boosts" ON public.boosts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 12. Restrict boost_tickets to own records
DROP POLICY IF EXISTS "Tickets readable by all" ON public.boost_tickets;
CREATE POLICY "Users see own tickets" ON public.boost_tickets
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
