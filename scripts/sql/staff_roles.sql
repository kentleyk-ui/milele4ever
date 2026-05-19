-- Staff roles table for Milele admin access.
-- Run in Supabase SQL Editor.

create table if not exists public.staff_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'editor')),
  area text not null default 'staff' check (area in ('staff', 'suggestions')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, area)
);

create index if not exists idx_staff_roles_email on public.staff_roles (lower(email));
create index if not exists idx_staff_roles_active on public.staff_roles (active);

alter table public.staff_roles enable row level security;

-- Users can read only their own rows.
create policy if not exists "staff_roles_select_own"
  on public.staff_roles
  for select
  using (auth.uid() = user_id);

-- No direct client write by default.
-- Admin writes should be done with service role.

-- Bootstrap owner example (replace UUID and email):
-- insert into public.staff_roles (user_id, email, role, area)
-- values ('00000000-0000-0000-0000-000000000000', 'kentleyk@gmail.com', 'owner', 'staff')
-- on conflict (user_id, area) do update set role = excluded.role, active = true, updated_at = now();
