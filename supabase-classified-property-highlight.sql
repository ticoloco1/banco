-- Paid directory highlight for property listings (classified_listings.type = 'imovel')
-- App price: US$35 for 30 days — see PLATFORM_USD.propertyDirectoryHighlight30d

alter table if exists classified_listings
  add column if not exists highlight_until timestamptz;

alter table if exists classified_listings
  add column if not exists highlight_color text;

comment on column classified_listings.highlight_until is
  'If future date, listing is visually highlighted and sorted first in /imoveis.';

comment on column classified_listings.highlight_color is
  'Hex color for highlighted card border/badge in property directory.';
