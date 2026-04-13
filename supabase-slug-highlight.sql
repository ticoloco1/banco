-- Slug marketplace highlight (paid boost for listing visibility)
-- Price policy in app: US$120 for 30 days.

alter table if exists slug_registrations
  add column if not exists highlight_until timestamptz;

alter table if exists slug_registrations
  add column if not exists highlight_color text;

comment on column slug_registrations.highlight_until is
  'If future date, slug is highlighted in marketplace and sorted first.';

comment on column slug_registrations.highlight_color is
  'Hex color for highlighted listing card/badge.';
