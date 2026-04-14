
-- AI Brain Control settings
CREATE TABLE IF NOT EXISTS public.ai_brain_settings (
  id integer PRIMARY KEY DEFAULT 1,
  deepseek_enabled boolean NOT NULL DEFAULT false,
  claude_enabled boolean NOT NULL DEFAULT false,
  chatgpt_enabled boolean NOT NULL DEFAULT false,
  gemini_enabled boolean NOT NULL DEFAULT true,
  moderation_active boolean NOT NULL DEFAULT true,
  sentiment_analysis boolean NOT NULL DEFAULT false,
  auto_flag_threshold numeric NOT NULL DEFAULT 0.8,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.ai_brain_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.ai_brain_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI settings readable by all"
ON public.ai_brain_settings FOR SELECT USING (true);

CREATE POLICY "Admins update AI settings"
ON public.ai_brain_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
