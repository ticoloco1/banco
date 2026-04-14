
-- Slug direct transfers table
CREATE TABLE public.slug_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  to_email TEXT,
  site_id UUID REFERENCES public.mini_sites(id),
  registration_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  transfer_type TEXT NOT NULL DEFAULT 'direct',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.slug_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own transfers" ON public.slug_transfers
  FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users create transfers" ON public.slug_transfers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Recipients accept transfers" ON public.slug_transfers
  FOR UPDATE TO authenticated
  USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);

-- Add length-based pricing columns to premium_slugs for admin control
ALTER TABLE public.premium_slugs ADD COLUMN IF NOT EXISTS letter_count INTEGER GENERATED ALWAYS AS (length(slug)) STORED;
