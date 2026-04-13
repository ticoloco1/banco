-- TrustBank: ad proposal slots + AI processed copy
-- Run this in Supabase SQL editor before deploying related app changes.

alter table if exists ad_proposal_targets
  add column if not exists ad_slots jsonb not null default '[]'::jsonb;

alter table if exists ad_proposal_targets
  add column if not exists owner_ai_script text;

comment on column ad_proposal_targets.ad_slots is
  'Selected placements for this target. Example: ["feed_pinned","avatar_ai","ticker_header"]';

comment on column ad_proposal_targets.owner_ai_script is
  'Polished AI script generated when creator accepts proposal.';
