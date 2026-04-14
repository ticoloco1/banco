
-- NFT Collections table
CREATE TABLE public.nft_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  site_id uuid REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  video_id uuid REFERENCES public.mini_site_videos(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  max_editions integer DEFAULT 1000000,
  editions_minted integer DEFAULT 0,
  price_per_nft numeric NOT NULL DEFAULT 0.10,
  view_tier integer DEFAULT 1,
  recharge_enabled boolean DEFAULT false,
  recharge_price numeric DEFAULT 0,
  launch_fee_paid numeric DEFAULT 300,
  creator_pct numeric DEFAULT 70,
  platform_pct numeric DEFAULT 30,
  polygon_hash text,
  arweave_hash text,
  status text DEFAULT 'active',
  launched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.nft_collections ENABLE ROW LEVEL SECURITY;

-- Everyone can read active collections
CREATE POLICY "Collections readable by all" ON public.nft_collections
  FOR SELECT USING (true);

-- Creators manage own collections
CREATE POLICY "Creators manage own collections" ON public.nft_collections
  FOR ALL USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Admins manage all collections
CREATE POLICY "Admins manage all collections" ON public.nft_collections
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Collection purchase records (mass mint tracking)
CREATE TABLE public.collection_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid REFERENCES public.nft_collections(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid NOT NULL,
  quantity integer DEFAULT 1,
  price_per_unit numeric NOT NULL,
  total_paid numeric NOT NULL,
  creator_share numeric NOT NULL,
  platform_share numeric NOT NULL,
  polygon_hash text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.collection_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see own collection purchases" ON public.collection_purchases
  FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Insert own collection purchases" ON public.collection_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Enable realtime for collections
ALTER PUBLICATION supabase_realtime ADD TABLE public.nft_collections;
