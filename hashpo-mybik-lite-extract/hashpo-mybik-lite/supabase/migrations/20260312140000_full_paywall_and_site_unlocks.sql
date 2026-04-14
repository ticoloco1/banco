-- Paywall inteiro: só banner, nome, foto, endereço e bio livres. Resto pago. Comissão 70/30 (criador/platform).
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS full_paywall boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS full_paywall_price numeric(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.mini_sites.full_paywall IS 'Se true, todo o conteúdo do mini site fica atrás de paywall; só banner, nome, foto, endereço e bio ficam livres.';
COMMENT ON COLUMN public.mini_sites.full_paywall_price IS 'Preço em USD para desbloquear o site inteiro. Comissão 70% criador / 30% plataforma.';

CREATE TABLE IF NOT EXISTS public.site_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paid numeric(10,2) NOT NULL,
  creator_share numeric(10,2) NOT NULL,
  platform_share numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS site_unlocks_site_buyer ON public.site_unlocks(site_id, buyer_id);
ALTER TABLE public.site_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own site_unlocks" ON public.site_unlocks
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = creator_id);
CREATE POLICY "Service role full access site_unlocks" ON public.site_unlocks
  FOR ALL USING (auth.role() = 'service_role');
