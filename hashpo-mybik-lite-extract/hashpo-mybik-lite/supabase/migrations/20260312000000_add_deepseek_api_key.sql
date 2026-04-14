-- Serviço DeepSeek para "Criar design com IA" na página Impressão sob demanda.
-- Admin > API Keys: edite "DeepSeek API Key" e salve sua chave.
INSERT INTO public.platform_api_keys (service_name, service_label)
VALUES ('deepseek_api_key', 'DeepSeek API Key')
ON CONFLICT (service_name) DO NOTHING;
