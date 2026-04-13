-- Overlays decorativos do topo do mini-site (flags, arte), com posição no template.
-- Executar no SQL Editor do Supabase.

alter table public.mini_sites
  add column if not exists template_overlays jsonb not null default '[]'::jsonb;

comment on column public.mini_sites.template_overlays is
  'JSON array of overlay items (id, asset key, position) for template header decoration.';
