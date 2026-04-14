-- Cole no SQL Editor do Lovable e execute (fotos em classificados e imóveis)

-- 1) Imóveis: garantir coluna de fotos
ALTER TABLE public.property_listings ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- 2) Classificados: garantir coluna de fotos (se a tabela já existia sem ela)
ALTER TABLE public.classified_listings ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- 3) Storage: bucket público para as fotos carregarem no site
INSERT INTO storage.buckets (id, name, public) VALUES ('platform-assets', 'platform-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4) Leitura pública das fotos (senão a URL fica inacessível e a imagem não aparece)
DROP POLICY IF EXISTS "Public read platform assets" ON storage.objects;
CREATE POLICY "Public read platform assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'platform-assets');

-- 5) Upload/edição/exclusão: usuário autenticado só na pasta do próprio user_id (imóveis, classificados, banner, avatar)
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
