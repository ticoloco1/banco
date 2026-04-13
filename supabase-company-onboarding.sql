-- TrustBank: company onboarding profile
-- Run in Supabase SQL editor.

create table if not exists public.company_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null,
  industry text,
  team_size text,
  website text,
  hiring_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_profiles enable row level security;

drop policy if exists "cp_read_own" on public.company_profiles;
drop policy if exists "cp_insert_own" on public.company_profiles;
drop policy if exists "cp_update_own" on public.company_profiles;

create policy "cp_read_own"
on public.company_profiles
for select
using (auth.uid() = user_id);

create policy "cp_insert_own"
on public.company_profiles
for insert
with check (auth.uid() = user_id);

create policy "cp_update_own"
on public.company_profiles
for update
using (auth.uid() = user_id);
