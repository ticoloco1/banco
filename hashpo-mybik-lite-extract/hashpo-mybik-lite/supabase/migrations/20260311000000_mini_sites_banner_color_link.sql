-- Banner: foto (banner_url) ou cor (banner_color); link opcional (banner_link)
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS banner_color text;
ALTER TABLE public.mini_sites ADD COLUMN IF NOT EXISTS banner_link text;
