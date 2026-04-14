-- Boost/destaque para slug_listings: 1 posição $1.50, home categoria $1000/7d, manutenção $450/dia (se parar, cai 150 posições)
ALTER TABLE public.slug_listings
ADD COLUMN IF NOT EXISTS boost_rank integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS boost_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS boost_home_at timestamptz,
ADD COLUMN IF NOT EXISTS boost_home_expires_at timestamptz,
ADD COLUMN IF NOT EXISTS boost_maintenance_paid_at timestamptz;

COMMENT ON COLUMN public.slug_listings.boost_rank IS 'Ordenação: menor = mais no topo. $1.50 sobe 1 posição; $1000 vai para 1 (home 7d); ao parar $450/dia cai +150.';
COMMENT ON COLUMN public.slug_listings.boost_expires_at IS 'Para boost 1 posição: expira em 24h.';
COMMENT ON COLUMN public.slug_listings.boost_home_at IS 'Quando comprou home da categoria ($1000).';
COMMENT ON COLUMN public.slug_listings.boost_home_expires_at IS 'Fim dos 7 dias na home. Depois: $450/dia para continuar.';
COMMENT ON COLUMN public.slug_listings.boost_maintenance_paid_at IS 'Último pagamento de $450/dia para permanecer na home após os 7 dias.';
