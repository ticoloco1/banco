
-- Ad Network tables
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id uuid NOT NULL,
  title text NOT NULL,
  slot_type text NOT NULL DEFAULT 'sidebar',
  image_url text,
  link_url text,
  budget numeric NOT NULL DEFAULT 0,
  spent numeric NOT NULL DEFAULT 0,
  cpm numeric NOT NULL DEFAULT 5.00,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ads readable by all" ON public.ad_campaigns FOR SELECT USING (true);
CREATE POLICY "Advertisers insert own ads" ON public.ad_campaigns FOR INSERT WITH CHECK (auth.uid() = advertiser_id);
CREATE POLICY "Advertisers update own ads" ON public.ad_campaigns FOR UPDATE USING (auth.uid() = advertiser_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete ads" ON public.ad_campaigns FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
