-- Table notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,  -- destinataire
  actor_id uuid references auth.users(id) on delete set null,          -- qui a agi
  actor_name text,                                                      -- nom cached
  type text not null check (type in ('like', 'comment')),
  publication_id uuid references public.publications(id) on delete cascade,
  publication_preview text,                                             -- début du contenu
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Index
create index if not exists notifications_user_id_idx on public.notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications(user_id, read) where read = false;

-- RLS
alter table public.notifications enable row level security;

-- Lecture : chaque membre voit uniquement ses notifications
drop policy if exists "Membres voient leurs notifications" on public.notifications;
create policy "Membres voient leurs notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

-- Mise à jour : chaque membre peut marquer ses notifications comme lues
drop policy if exists "Membres marquent leurs notifications lues" on public.notifications;
create policy "Membres marquent leurs notifications lues"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Suppression : chaque membre peut supprimer ses propres notifications
drop policy if exists "Membres suppriment leurs notifications" on public.notifications;
create policy "Membres suppriment leurs notifications"
  on public.notifications for delete
  to authenticated
  using (auth.uid() = user_id);

-- INSERT : via service role uniquement (pas de policy insert public)
-- Les insertions se font depuis le serveur Next.js avec la clé service_role
