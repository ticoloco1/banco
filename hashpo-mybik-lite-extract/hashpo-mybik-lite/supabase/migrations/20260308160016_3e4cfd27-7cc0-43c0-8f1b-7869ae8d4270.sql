
-- Feed posts table
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  site_id uuid REFERENCES public.mini_sites(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  image_url text,
  pinned boolean NOT NULL DEFAULT false,
  pinned_until timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feed posts readable by all" ON public.feed_posts FOR SELECT USING (true);
CREATE POLICY "Users manage own feed posts" ON public.feed_posts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all feed posts" ON public.feed_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- CV structured fields on mini_sites
ALTER TABLE public.mini_sites
  ADD COLUMN cv_headline text,
  ADD COLUMN cv_experience jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN cv_skills text[] DEFAULT '{}',
  ADD COLUMN cv_education jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN cv_portfolio jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN cv_location text;
