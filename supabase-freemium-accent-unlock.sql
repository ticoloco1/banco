-- Desbloqueio pago (freemium): personalizar cor de destaque / picker fora dos temas base.
alter table public.mini_sites
  add column if not exists freemium_custom_accent_unlocked boolean not null default false;

comment on column public.mini_sites.freemium_custom_accent_unlocked is
  'True após compra do add-on de cor (freemium); Pro ignora e tem picker completo.';
