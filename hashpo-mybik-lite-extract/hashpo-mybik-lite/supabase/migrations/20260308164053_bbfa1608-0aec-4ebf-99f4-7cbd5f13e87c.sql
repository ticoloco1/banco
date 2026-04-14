
CREATE TABLE public.platform_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  service_label text NOT NULL,
  api_key text NOT NULL DEFAULT '',
  extra_fields jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read api keys" ON public.platform_api_keys
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update api keys" ON public.platform_api_keys
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert api keys" ON public.platform_api_keys
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete api keys" ON public.platform_api_keys
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default service entries
INSERT INTO public.platform_api_keys (service_name, service_label) VALUES
  ('bunny_api_key', 'Bunny.net API Key'),
  ('bunny_storage_key', 'Bunny.net Storage Key'),
  ('bunny_cdn_hostname', 'Bunny.net CDN Hostname'),
  ('bunny_library_id', 'Bunny.net Library ID'),
  ('arweave_wallet_key', 'Arweave Wallet Key'),
  ('arweave_gateway_url', 'Arweave Gateway URL'),
  ('cloudflare_api_token', 'Cloudflare API Token'),
  ('cloudflare_zone_id', 'Cloudflare Zone ID'),
  ('cloudflare_account_id', 'Cloudflare Account ID'),
  ('cdn_custom_domain', 'Custom CDN Domain'),
  ('polygon_rpc_url', 'Polygon RPC URL'),
  ('polygon_private_key', 'Polygon Private Key'),
  ('walletconnect_project_id', 'WalletConnect Project ID'),
  ('smtp_host', 'SMTP Host'),
  ('smtp_port', 'SMTP Port'),
  ('smtp_user', 'SMTP Username'),
  ('smtp_pass', 'SMTP Password');
