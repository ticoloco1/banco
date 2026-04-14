-- Agenda para advogados, médicos, professores: IA explica e visitante pode solicitar agendamento. Comissão 10% em cobranças.
ALTER TABLE public.mini_sites
ADD COLUMN IF NOT EXISTS agenda_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS appointment_price numeric(10,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.mini_sites.agenda_enabled IS 'Se true, a IA atua como agenda: explica o que o dono oferece e o visitante pode solicitar agendamento.';
COMMENT ON COLUMN public.mini_sites.appointment_price IS 'Preço opcional em USD para confirmar agendamento (cobrança no site). Comissão 10% plataforma.';

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.mini_sites(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name text,
  guest_email text NOT NULL,
  preferred_datetime text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'paid')),
  amount_cents integer,
  platform_share_cents integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appointment_requests_site ON public.appointment_requests(site_id);
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site owner sees own appointment_requests" ON public.appointment_requests
  FOR SELECT USING (
    site_id IN (SELECT id FROM public.mini_sites WHERE user_id = auth.uid())
  );
CREATE POLICY "Authenticated users insert appointment_requests" ON public.appointment_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Service role full access appointment_requests" ON public.appointment_requests
  FOR ALL USING (auth.role() = 'service_role');
