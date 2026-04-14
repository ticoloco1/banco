ALTER TABLE public.mini_sites 
  ADD COLUMN IF NOT EXISTS bg_style text NOT NULL DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS font_size text NOT NULL DEFAULT 'md',
  ADD COLUMN IF NOT EXISTS photo_shape text NOT NULL DEFAULT 'round',
  ADD COLUMN IF NOT EXISTS photo_size text NOT NULL DEFAULT 'md';