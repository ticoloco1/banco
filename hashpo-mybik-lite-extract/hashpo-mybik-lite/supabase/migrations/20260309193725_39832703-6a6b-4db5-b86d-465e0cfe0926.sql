ALTER TABLE public.mini_sites 
  ADD COLUMN IF NOT EXISTS monthly_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS blocked boolean NOT NULL DEFAULT false;