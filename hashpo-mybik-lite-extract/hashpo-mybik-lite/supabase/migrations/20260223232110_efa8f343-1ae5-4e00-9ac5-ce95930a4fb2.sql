
-- Add new video lifecycle columns
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS subcategory text,
  ADD COLUMN IF NOT EXISTS hashtags text[],
  ADD COLUMN IF NOT EXISTS made_for_kids boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_content boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS metadata_hash text,
  ADD COLUMN IF NOT EXISTS video_hash text,
  ADD COLUMN IF NOT EXISTS legal_hash text,
  ADD COLUMN IF NOT EXISTS listing_plan text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS listing_expires_at timestamptz;

-- Create index for creator content queries
CREATE INDEX IF NOT EXISTS idx_videos_creator_status ON public.videos (creator_id, status);
