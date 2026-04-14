-- Espaços extras (imóveis e classificados): US$ 1 por espaço por mês. Expira em 30 dias.
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_property_spaces integer NOT NULL DEFAULT 0;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_property_spaces_expires_at timestamptz;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_classified_spaces integer NOT NULL DEFAULT 0;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS extra_classified_spaces_expires_at timestamptz;
