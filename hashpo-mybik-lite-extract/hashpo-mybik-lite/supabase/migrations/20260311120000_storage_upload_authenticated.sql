-- Usuários autenticados podem fazer upload em platform-assets em pastas com seu user_id (imóveis, classificados, banner, avatar)
DROP POLICY IF EXISTS "Users upload own folder platform assets" ON storage.objects;
CREATE POLICY "Users upload own folder platform assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users update own folder platform assets" ON storage.objects;
CREATE POLICY "Users update own folder platform assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users delete own folder platform assets" ON storage.objects;
CREATE POLICY "Users delete own folder platform assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'platform-assets' AND (storage.foldername(name))[1] = auth.uid()::text);
