-- Sub-accounts (child / pet) minimal schema
-- Compatible with current structure: owner remains main profile/user.

create table if not exists public.sub_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  account_type text not null check (account_type in ('child','pet')),
  display_name text not null,
  visibility text not null default 'public' check (visibility in ('public','private')),
  allow_minor_publish boolean not null default false,
  allow_minor_comment boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sub_accounts_owner on public.sub_accounts(owner_user_id);

alter table public.sub_accounts enable row level security;

-- Owner can read and manage only own sub-accounts.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sub_accounts' and policyname = 'sub_accounts_select_own'
  ) then
    create policy sub_accounts_select_own
      on public.sub_accounts
      for select
      using (auth.uid() = owner_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sub_accounts' and policyname = 'sub_accounts_insert_own'
  ) then
    create policy sub_accounts_insert_own
      on public.sub_accounts
      for insert
      with check (auth.uid() = owner_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sub_accounts' and policyname = 'sub_accounts_update_own'
  ) then
    create policy sub_accounts_update_own
      on public.sub_accounts
      for update
      using (auth.uid() = owner_user_id)
      with check (auth.uid() = owner_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sub_accounts' and policyname = 'sub_accounts_delete_own'
  ) then
    create policy sub_accounts_delete_own
      on public.sub_accounts
      for delete
      using (auth.uid() = owner_user_id);
  end if;
end $$;
