-- Google-only auth profile metadata + TOTP security profile

create table if not exists public.user_auth_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'google',
  google_id text,
  email_verified boolean not null default false,
  profile_picture text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_auth_profiles enable row level security;

drop policy if exists user_auth_profiles_select_own on public.user_auth_profiles;
create policy user_auth_profiles_select_own
  on public.user_auth_profiles for select
  using (auth.uid() = user_id);

drop policy if exists user_auth_profiles_upsert_own on public.user_auth_profiles;
create policy user_auth_profiles_upsert_own
  on public.user_auth_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists user_auth_profiles_update_own on public.user_auth_profiles;
create policy user_auth_profiles_update_own
  on public.user_auth_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.user_security_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  totp_enabled boolean not null default false,
  totp_secret text,
  totp_pending_secret text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_security_profiles enable row level security;

drop policy if exists user_security_profiles_select_own on public.user_security_profiles;
create policy user_security_profiles_select_own
  on public.user_security_profiles for select
  using (auth.uid() = user_id);

drop policy if exists user_security_profiles_insert_own on public.user_security_profiles;
create policy user_security_profiles_insert_own
  on public.user_security_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists user_security_profiles_update_own on public.user_security_profiles;
create policy user_security_profiles_update_own
  on public.user_security_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
