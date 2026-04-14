
-- Reports table for video flagging
CREATE TABLE public.video_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed boolean NOT NULL DEFAULT false,
  reviewed_at timestamptz,
  reviewed_by uuid
);

ALTER TABLE public.video_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own reports" ON public.video_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see own reports" ON public.video_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins see all reports" ON public.video_reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update reports" ON public.video_reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Add report_count to videos for auto-flagging
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS under_review boolean NOT NULL DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

-- Add hosting_type to videos (embed, upload, upload_preview)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS hosting_type text NOT NULL DEFAULT 'embed';
