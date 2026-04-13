-- Add-on: gravação longa do vídeo em loop no Identity Lab (US$5/mês via checkout).
-- Grátis: até ~20 s. Com data futura aqui: até ~2 min.
alter table mini_sites
  add column if not exists profile_loop_video_extended_until timestamptz;

comment on column mini_sites.profile_loop_video_extended_until is
  'Se > now(), o dono pode gravar o loop do perfil até ~2 min; caso contrário ~20 s grátis.';
