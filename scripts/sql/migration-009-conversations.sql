-- Conversations utilisateur (chat)
-- Idempotent migration

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  role varchar(20) not null check (role in ('user', 'assistant')),
  files jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  archived_at timestamptz,
  is_archived boolean not null default false
);

create index if not exists idx_conversations_user_id
  on public.conversations(user_id);

create index if not exists idx_conversations_created_at
  on public.conversations(created_at desc);

create index if not exists idx_conversations_archived
  on public.conversations(is_archived, created_at desc);

alter table public.conversations enable row level security;

drop policy if exists "Users can view own conversations" on public.conversations;
create policy "Users can view own conversations"
  on public.conversations
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own conversations" on public.conversations;
create policy "Users can insert own conversations"
  on public.conversations
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own conversations" on public.conversations;
create policy "Users can update own conversations"
  on public.conversations
  for update
  using (auth.uid() = user_id);

create or replace function public.archive_old_conversations()
returns void
language plpgsql
as $$
begin
  update public.conversations
  set is_archived = true,
      archived_at = now()
  where created_at < now() - interval '30 days'
    and is_archived = false;
end;
$$;

-- Optional pg_cron schedule (if extension is enabled on your Supabase project)
-- select cron.schedule(
--   'archive-old-conversations-daily',
--   '15 2 * * *',
--   $$select public.archive_old_conversations();$$
-- );
