
-- Add global trading pause (sanctions kill-switch) to platform_settings
ALTER TABLE public.platform_settings 
ADD COLUMN IF NOT EXISTS trading_paused boolean NOT NULL DEFAULT false;

-- Add DEX mode column to videos (when true, shares trade via DEX instead of platform exchange)
ALTER TABLE public.videos
ADD COLUMN IF NOT EXISTS dex_mode boolean NOT NULL DEFAULT false;
