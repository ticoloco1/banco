
-- AI chat messages for mini site assistants
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.mini_sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own chat messages" ON public.ai_chat_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own chat messages" ON public.ai_chat_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- AI usage tracking per user
CREATE TABLE public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  interactions_used INTEGER NOT NULL DEFAULT 0,
  interactions_paid INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own usage" ON public.ai_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own usage" ON public.ai_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own usage" ON public.ai_usage
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Job listings for corporate directory
CREATE TABLE public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  site_id UUID REFERENCES public.mini_sites(id),
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  salary_range TEXT,
  job_type TEXT NOT NULL DEFAULT 'full-time',
  category TEXT NOT NULL DEFAULT 'general',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs readable by all" ON public.job_listings
  FOR SELECT USING (active = true);

CREATE POLICY "Companies manage own jobs" ON public.job_listings
  FOR ALL TO authenticated USING (auth.uid() = company_id) WITH CHECK (auth.uid() = company_id);

-- Property listings for real estate mini sites
CREATE TABLE public.property_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.mini_sites(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  property_type TEXT NOT NULL DEFAULT 'apartment',
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  area_sqm NUMERIC DEFAULT 0,
  location TEXT,
  image_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Properties readable by all" ON public.property_listings
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users manage own properties" ON public.property_listings
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
