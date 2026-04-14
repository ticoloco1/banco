
-- Roles enum and user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  kyc_verified BOOLEAN NOT NULL DEFAULT false,
  kyc_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Platform settings table (singleton)
CREATE TABLE public.platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  listing_fee_internal NUMERIC NOT NULL DEFAULT 20,
  listing_fee_gateway NUMERIC NOT NULL DEFAULT 80,
  commission_paywall NUMERIC NOT NULL DEFAULT 30,
  commission_ads NUMERIC NOT NULL DEFAULT 35,
  commission_shares NUMERIC NOT NULL DEFAULT 5,
  valuation_multiplier NUMERIC NOT NULL DEFAULT 50,
  annual_plan_price NUMERIC NOT NULL DEFAULT 80,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings readable by all" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins update settings" ON public.platform_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.platform_settings (id) VALUES (1);

-- Videos table
CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  ticker TEXT NOT NULL UNIQUE,
  paywall_price NUMERIC NOT NULL DEFAULT 0,
  share_price NUMERIC NOT NULL DEFAULT 1.00,
  total_shares INTEGER NOT NULL DEFAULT 1000,
  revenue NUMERIC NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  blocked BOOLEAN NOT NULL DEFAULT false,
  exchange_active BOOLEAN NOT NULL DEFAULT true,
  shares_issued BOOLEAN NOT NULL DEFAULT false,
  polygon_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Videos readable by all" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Creators insert own videos" ON public.videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators update own unlocked videos" ON public.videos FOR UPDATE TO authenticated
  USING (
    (auth.uid() = creator_id AND shares_issued = false)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Admins delete videos" ON public.videos FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Shares ownership table
CREATE TABLE public.share_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  holder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (video_id, holder_id)
);
ALTER TABLE public.share_holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Holdings readable by holder" ON public.share_holdings FOR SELECT TO authenticated USING (auth.uid() = holder_id);
CREATE POLICY "Holdings insert" ON public.share_holdings FOR INSERT TO authenticated WITH CHECK (auth.uid() = holder_id);
CREATE POLICY "Holdings update own" ON public.share_holdings FOR UPDATE TO authenticated USING (auth.uid() = holder_id);

-- Dividend distributions
CREATE TABLE public.dividends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  total_amount NUMERIC NOT NULL,
  per_share_amount NUMERIC NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('paywall', 'ads')),
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Dividends readable" ON public.dividends FOR SELECT USING (true);

-- Transactions log
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID REFERENCES auth.users(id),
  shares_qty INTEGER NOT NULL,
  price_per_share NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('buy', 'sell', 'sell_all', 'dividend')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own transactions" ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.platform_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.videos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_settings;
