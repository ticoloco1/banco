
-- Add preview_url and recharge_price to mini_site_videos
ALTER TABLE public.mini_site_videos 
  ADD COLUMN IF NOT EXISTS preview_url text,
  ADD COLUMN IF NOT EXISTS recharge_price numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recharge_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_tier integer DEFAULT 1;

-- NFT marketplace listings for resale
CREATE TABLE public.nft_listings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nft_purchase_id uuid REFERENCES public.nft_purchases(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid NOT NULL,
  video_id uuid REFERENCES public.mini_site_videos(id) ON DELETE CASCADE NOT NULL,
  price numeric NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.nft_listings ENABLE ROW LEVEL SECURITY;

-- Everyone can see active listings
CREATE POLICY "Listings readable by all" ON public.nft_listings
  FOR SELECT USING (true);

-- Sellers manage own listings
CREATE POLICY "Sellers manage own listings" ON public.nft_listings
  FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Add resale tracking to nft_purchases
ALTER TABLE public.nft_purchases 
  ADD COLUMN IF NOT EXISTS original_buyer_id uuid,
  ADD COLUMN IF NOT EXISTS is_resale boolean DEFAULT false;

-- Create storage bucket for video previews
INSERT INTO storage.buckets (id, name, public) VALUES ('video-previews', 'video-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload previews
CREATE POLICY "Auth users upload previews" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'video-previews');

-- Public read access for previews
CREATE POLICY "Public read previews" ON storage.objects
  FOR SELECT USING (bucket_id = 'video-previews');

-- Users delete own previews
CREATE POLICY "Users delete own previews" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'video-previews' AND (storage.foldername(name))[1] = auth.uid()::text);
