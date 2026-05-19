-- ═══════════════════════════════════════════════════════════════
-- MILELE — Schéma Supabase complet
-- À exécuter dans l'éditeur SQL du dashboard Supabase
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Extension UUID ──────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ══════════════════════════════════════════════════════════════
-- TABLE : profiles
-- Créé automatiquement à l'inscription via trigger
-- ══════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id            uuid        primary key references auth.users(id) on delete cascade,
  display_name  text        not null default '',
  avatar_url    text,
  email         text,
  visibility    text        not null default 'public' check (visibility in ('public', 'private')),
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Index pour la recherche par nom/email
create index if not exists profiles_display_name_idx on public.profiles using gin (to_tsvector('simple', display_name));
create index if not exists profiles_email_idx on public.profiles (email);

-- RLS
alter table public.profiles enable row level security;

-- Lecture publique des profils visibles
create policy "Profils publics visibles par tous"
  on public.profiles for select
  using (visibility = 'public' or auth.uid() = id);

-- Chaque utilisateur peut modifier son propre profil
create policy "Modifier son propre profil"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger : créer un profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════════════════════
-- TABLE : connections
-- Gestion des liens famille / amis / connaissances
-- ══════════════════════════════════════════════════════════════
create table if not exists public.connections (
  id                uuid        primary key default gen_random_uuid(),
  requester_id      uuid        not null references public.profiles(id) on delete cascade,
  target_id         uuid        references public.profiles(id) on delete cascade,
  category          text        not null check (category in ('famille', 'amis', 'connaissances')),
  status            text        not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'invited')),
  message           text,
  invitation_token  text        unique,
  invitation_email  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Pas de doublon requester→target
  unique (requester_id, target_id)
);

-- Index
create index if not exists connections_requester_idx on public.connections (requester_id);
create index if not exists connections_target_idx on public.connections (target_id);
create index if not exists connections_token_idx on public.connections (invitation_token);

-- RLS
alter table public.connections enable row level security;

-- Voir ses propres connexions (en tant que requester ou target)
create policy "Voir ses connexions"
  on public.connections for select
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Créer une connexion (requester = soi-même)
create policy "Créer une demande de connexion"
  on public.connections for insert
  with check (auth.uid() = requester_id);

-- Mettre à jour (accepter/refuser) si on est la cible
create policy "Répondre à une demande"
  on public.connections for update
  using (auth.uid() = target_id or auth.uid() = requester_id);

-- Supprimer sa propre connexion
create policy "Supprimer sa connexion"
  on public.connections for delete
  using (auth.uid() = requester_id or auth.uid() = target_id);

-- Trigger : updated_at automatique
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists connections_updated_at on public.connections;
create trigger connections_updated_at
  before update on public.connections
  for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- TABLE : dossiers (persistance optionnelle — complémente localStorage)
-- ══════════════════════════════════════════════════════════════
create table if not exists public.dossiers (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  data          jsonb       not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (user_id)
);

alter table public.dossiers enable row level security;

create policy "Accès à son propre dossier"
  on public.dossiers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists dossiers_updated_at on public.dossiers;
create trigger dossiers_updated_at
  before update on public.dossiers
  for each row execute procedure public.set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- VUE : connexions avec profils joints (usage facile côté app)
-- ══════════════════════════════════════════════════════════════
create or replace view public.connections_with_profiles as
select
  c.id,
  c.category,
  c.status,
  c.message,
  c.created_at,
  c.requester_id,
  rp.display_name  as requester_name,
  rp.avatar_url    as requester_avatar,
  c.target_id,
  tp.display_name  as target_name,
  tp.avatar_url    as target_avatar
from public.connections c
left join public.profiles rp on rp.id = c.requester_id
left join public.profiles tp on tp.id = c.target_id;
