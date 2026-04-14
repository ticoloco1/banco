-- Expande configuracoes de monetizacao e branding multi-dominio no painel admin.
alter table public.platform_settings
  add column if not exists slug_marketplace_fee_pct numeric not null default 10,
  add column if not exists classified_listing_monthly_usd numeric not null default 2,
  add column if not exists cv_directory_monthly_usd numeric not null default 199,
  add column if not exists cv_directory_monthly_opens integer not null default 15,
  add column if not exists platform_monthly_subscription_usd numeric not null default 26.90,
  add column if not exists brand_hashpo_name text not null default 'HASHPO',
  add column if not exists brand_hashpo_color text not null default '51 100% 50%',
  add column if not exists brand_mybik_name text not null default 'MYBIK',
  add column if not exists brand_mybik_color text not null default '210 90% 56%',
  add column if not exists brand_trustbank_name text not null default 'TrustBank',
  add column if not exists brand_trustbank_color text not null default '155 70% 43%';

-- Defaults comerciais solicitados para o inicio da operacao.
update public.platform_settings
set
  paywall_creator_pct = coalesce(paywall_creator_pct, 75),
  paywall_platform_pct = coalesce(paywall_platform_pct, 25),
  cv_creator_pct = coalesce(cv_creator_pct, 50),
  cv_platform_pct = coalesce(cv_platform_pct, 50),
  slug_marketplace_fee_pct = coalesce(slug_marketplace_fee_pct, 10),
  classified_listing_monthly_usd = coalesce(classified_listing_monthly_usd, 2),
  cv_directory_monthly_usd = coalesce(cv_directory_monthly_usd, 199),
  cv_directory_monthly_opens = coalesce(cv_directory_monthly_opens, 15),
  platform_monthly_subscription_usd = coalesce(platform_monthly_subscription_usd, 26.90)
where id = 1;
