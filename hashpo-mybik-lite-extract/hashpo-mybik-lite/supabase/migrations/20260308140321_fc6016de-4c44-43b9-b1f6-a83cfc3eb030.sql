-- CV unlock feature: companies pay $20 to see creator contact info (50/50 split)
CREATE TABLE public.cv_unlocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  amount_paid numeric NOT NULL DEFAULT 20,
  creator_share numeric NOT NULL DEFAULT 10,
  platform_share numeric NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cv_unlocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see own unlocks" ON public.cv_unlocks FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Creators see own unlocks" ON public.cv_unlocks FOR SELECT USING (auth.uid() = creator_id);
CREATE POLICY "Authenticated users buy" ON public.cv_unlocks FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Add contact fields to mini_sites
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS contact_price numeric NOT NULL DEFAULT 20;