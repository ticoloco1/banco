
-- Mini-sites table
CREATE TABLE public.mini_sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  site_name text,
  bio text,
  avatar_url text,
  banner_url text,
  layout_columns integer NOT NULL DEFAULT 2,
  theme text NOT NULL DEFAULT 'dark',
  show_cv boolean NOT NULL DEFAULT false,
  cv_content text,
  custom_css text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mini sites readable by all" ON public.mini_sites FOR SELECT USING (published = true);
CREATE POLICY "Users manage own mini site" ON public.mini_sites FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mini-site links (social links, custom links)
CREATE TABLE public.mini_site_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  icon text DEFAULT 'link',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_site_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Links readable via public site" ON public.mini_site_links FOR SELECT USING (true);
CREATE POLICY "Users manage own links" ON public.mini_site_links FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mini-site videos (YouTube embeds)
CREATE TABLE public.mini_site_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  youtube_video_id text NOT NULL,
  title text NOT NULL,
  thumbnail_url text,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  -- NFT settings
  nft_enabled boolean NOT NULL DEFAULT false,
  nft_price numeric NOT NULL DEFAULT 0,
  nft_max_views integer NOT NULL DEFAULT 1,
  nft_max_editions integer,
  nft_editions_sold integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mini_site_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site videos readable by all" ON public.mini_site_videos FOR SELECT USING (true);
CREATE POLICY "Users manage own site videos" ON public.mini_site_videos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NFT purchases
CREATE TABLE public.nft_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.mini_site_videos(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  price_paid numeric NOT NULL,
  views_allowed integer NOT NULL DEFAULT 1,
  views_used integer NOT NULL DEFAULT 0,
  polygon_hash text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.nft_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see own NFTs" ON public.nft_purchases FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers see own sales" ON public.nft_purchases FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Authenticated users buy NFTs" ON public.nft_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers update own NFT views" ON public.nft_purchases FOR UPDATE USING (auth.uid() = buyer_id);
