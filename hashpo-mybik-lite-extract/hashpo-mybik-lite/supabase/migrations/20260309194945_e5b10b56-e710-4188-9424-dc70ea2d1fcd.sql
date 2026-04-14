CREATE TABLE public.premium_slugs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  category text NOT NULL DEFAULT 'general',
  price numeric NOT NULL DEFAULT 100,
  sold boolean NOT NULL DEFAULT false,
  buyer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_slugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Premium slugs readable by all" ON public.premium_slugs
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage premium slugs" ON public.premium_slugs
  FOR ALL TO public USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users buy premium slugs" ON public.premium_slugs
  FOR UPDATE TO authenticated USING (sold = false)
  WITH CHECK (sold = true AND buyer_id = auth.uid());

-- Seed some hot words
INSERT INTO public.premium_slugs (slug, category, price) VALUES
  ('doctor', 'profession', 500),
  ('lawyer', 'profession', 500),
  ('crypto', 'tech', 1000),
  ('bitcoin', 'tech', 1500),
  ('music', 'entertainment', 800),
  ('gaming', 'entertainment', 800),
  ('fitness', 'lifestyle', 600),
  ('fashion', 'lifestyle', 600),
  ('travel', 'lifestyle', 600),
  ('chef', 'profession', 400),
  ('artist', 'creative', 500),
  ('design', 'creative', 500),
  ('photo', 'creative', 400),
  ('film', 'creative', 600),
  ('news', 'media', 1000),
  ('sport', 'entertainment', 800),
  ('coach', 'profession', 400),
  ('trader', 'finance', 800),
  ('invest', 'finance', 800),
  ('money', 'finance', 1000),
  ('tech', 'tech', 800),
  ('code', 'tech', 600),
  ('ai', 'tech', 2000),
  ('nft', 'tech', 1500),
  ('yoga', 'lifestyle', 400),
  ('beauty', 'lifestyle', 600),
  ('model', 'creative', 800),
  ('singer', 'entertainment', 600),
  ('dj', 'entertainment', 800),
  ('rock', 'entertainment', 500);