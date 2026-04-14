
-- Add visual/theme control columns to platform_settings
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS primary_color text NOT NULL DEFAULT '222 100% 20%',
  ADD COLUMN IF NOT EXISTS accent_color text NOT NULL DEFAULT '51 100% 50%',
  ADD COLUMN IF NOT EXISTS grid_columns integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS ticker_speed integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS hero_text text NOT NULL DEFAULT 'Content Exchange Board',
  ADD COLUMN IF NOT EXISTS footer_text text NOT NULL DEFAULT 'HASHPO IS A TECH PLATFORM. CONTENT IS CREATOR RESPONSIBILITY. HIGH RISK ASSET.';
