-- BYOK video generation jobs (Kling/Luma) + publish metadata.

create table if not exists public.byok_video_jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  site_id          uuid not null references public.mini_sites (id) on delete cascade,
  provider         text not null, -- kling | luma
  title            text,
  prompt           text not null,
  paywall_enabled  boolean not null default true,
  paywall_price    numeric not null default 4.99,
  status           text not null default 'queued', -- queued | processing | completed | failed
  external_job_id  text,
  result_url       text,
  error_message    text,
  raw_response     jsonb,
  published_video_id uuid references public.mini_site_videos (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_byok_video_jobs_user on public.byok_video_jobs (user_id, created_at desc);
create index if not exists idx_byok_video_jobs_site on public.byok_video_jobs (site_id, created_at desc);
create index if not exists idx_byok_video_jobs_status on public.byok_video_jobs (status, updated_at desc);

alter table public.byok_video_jobs enable row level security;
drop policy if exists "bvj_own_select" on public.byok_video_jobs;
create policy "bvj_own_select" on public.byok_video_jobs
  for select using (auth.uid() = user_id);

