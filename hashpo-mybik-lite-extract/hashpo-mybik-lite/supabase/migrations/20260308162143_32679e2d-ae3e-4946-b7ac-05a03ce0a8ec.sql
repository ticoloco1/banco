
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS boost_total_spent numeric NOT NULL DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS boost_rank integer NOT NULL DEFAULT 999999;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS boost_home_at timestamptz;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS boost_home_expires_at timestamptz;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS boost_maintenance_paid_at timestamptz;

INSERT INTO storage.buckets (id, name, public) VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read platform assets" ON storage.objects FOR SELECT USING (bucket_id = 'platform-assets');
CREATE POLICY "Admins upload platform assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete platform assets" ON storage.objects FOR DELETE USING (bucket_id = 'platform-assets' AND public.has_role(auth.uid(), 'admin'));
