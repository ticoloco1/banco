
ALTER TABLE public.platform_settings
  ADD COLUMN polygon_contract_address text DEFAULT '',
  ADD COLUMN polygon_receiver_address text DEFAULT '';
