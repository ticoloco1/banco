
-- Allow admins to manage all mini-sites
CREATE POLICY "Admins manage all mini sites" ON public.mini_sites FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all mini-sites (including unpublished)
CREATE POLICY "Admins read all mini sites" ON public.mini_sites FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
