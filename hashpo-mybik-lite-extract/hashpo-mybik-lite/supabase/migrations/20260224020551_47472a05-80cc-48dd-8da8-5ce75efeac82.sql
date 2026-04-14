
-- Add wallet_address to profiles for Polygon wallet
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wallet_address text;

-- Categories table (dynamic, admin-managed)
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  avatar_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories readable by all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Seed default categories
INSERT INTO public.categories (id, name, sort_order) VALUES
  ('filmmaker', 'Filmmaker', 1),
  ('singer', 'Singer', 2),
  ('musician', 'Musician', 3),
  ('podcaster', 'Podcaster', 4),
  ('streamer', 'Streamer', 5),
  ('gamer', 'Gamer', 6),
  ('influencer', 'Influencer', 7),
  ('digital-artist', 'Digital Artist', 8),
  ('designer', 'Designer', 9),
  ('journalist', 'Journalist', 10);

-- Follows table
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own follows" ON public.follows FOR SELECT USING (auth.uid() = follower_id);
CREATE POLICY "Users insert own follows" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users delete own follows" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Likes table
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes readable by all" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users insert own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Add like_count and boost_count to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS like_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS boost_count integer NOT NULL DEFAULT 0;

-- Boosts table (each boost = 1 credit = $0.50 USDC)
CREATE TABLE public.boosts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0.50,
  to_pool numeric NOT NULL DEFAULT 0.175,
  to_creator numeric NOT NULL DEFAULT 0.075,
  to_platform numeric NOT NULL DEFAULT 0.25,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Boosts readable by all" ON public.boosts FOR SELECT USING (true);
CREATE POLICY "Users insert own boosts" ON public.boosts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Jackpot pool (single row)
CREATE TABLE public.jackpot_pool (
  id integer PRIMARY KEY DEFAULT 1,
  total_amount numeric NOT NULL DEFAULT 0,
  last_winner_id uuid,
  last_winner_amount numeric DEFAULT 0,
  last_drawn_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.jackpot_pool ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pool readable by all" ON public.jackpot_pool FOR SELECT USING (true);
CREATE POLICY "Admins update pool" ON public.jackpot_pool FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Seed jackpot pool
INSERT INTO public.jackpot_pool (id, total_amount) VALUES (1, 0);

-- Boost tickets (for jackpot draw)
CREATE TABLE public.boost_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  boost_id uuid NOT NULL REFERENCES public.boosts(id),
  video_id uuid NOT NULL REFERENCES public.videos(id),
  drawn boolean NOT NULL DEFAULT false,
  won boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.boost_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tickets readable by all" ON public.boost_tickets FOR SELECT USING (true);
CREATE POLICY "Users insert own tickets" ON public.boost_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for jackpot pool
ALTER PUBLICATION supabase_realtime ADD TABLE public.jackpot_pool;
ALTER PUBLICATION supabase_realtime ADD TABLE public.boosts;
