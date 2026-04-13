-- Widget FeaturedAssets + prova de visualização para marcas
alter table public.mini_sites add column if not exists featured_partner_assets_order jsonb null;
alter table public.campaign_leads add column if not exists nft_viewed_at timestamptz null;

comment on column public.mini_sites.featured_partner_assets_order is
  'Array JSON de chaves "lead:<uuid>" | "nft:<uuid>" — ordem no showcase (Pro); null = ordem por data.';
comment on column public.campaign_leads.nft_viewed_at is
  'Quando o mini-site público do utilizador mostrou o widget de NFTs parceiros (ack).';
