
-- Photos gallery table for mini sites
CREATE TABLE public.mini_site_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  url text NOT NULL,
  caption text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_site_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos readable by all" ON public.mini_site_photos
  FOR SELECT USING (true);

CREATE POLICY "Users manage own photos" ON public.mini_site_photos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Add address field to mini_sites
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS show_domains boolean NOT NULL DEFAULT false;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS show_properties boolean NOT NULL DEFAULT false;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS show_photos boolean NOT NULL DEFAULT false;
