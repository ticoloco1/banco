-- Opção para mostrar assistente IA no mini site (janela com robô). Default true = todos podem ter.
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS show_ai_chat boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.mini_sites.show_ai_chat IS 'Mostrar widget do assistente IA (chat com robô) no mini site.';
