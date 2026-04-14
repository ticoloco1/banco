-- Classificados (carros, motos, barcos etc.) — seção separada de imóveis, com fotos por item
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS show_classifieds boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.classified_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'outros' CHECK (category IN ('carros', 'motos', 'barcos', 'outros')),
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  image_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.classified_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classifieds readable by all" ON public.classified_listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users manage own classifieds" ON public.classified_listings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
