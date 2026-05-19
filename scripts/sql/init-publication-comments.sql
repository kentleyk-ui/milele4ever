-- Table commentaires des publications
create table if not exists public.publication_comments (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) > 0 and char_length(content) <= 1000),
  created_at timestamptz not null default now()
);

-- Index pour les requêtes par publication
create index if not exists publication_comments_publication_id_idx
  on public.publication_comments(publication_id, created_at desc);

-- RLS
alter table public.publication_comments enable row level security;

-- Lecture : tous les membres connectés peuvent lire les commentaires
create policy "Membres peuvent lire les commentaires"
  on public.publication_comments for select
  to authenticated
  using (true);

-- Insertion : un membre connecté peut commenter
create policy "Membres peuvent commenter"
  on public.publication_comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Suppression : un membre peut supprimer ses propres commentaires
create policy "Membres peuvent supprimer leurs commentaires"
  on public.publication_comments for delete
  to authenticated
  using (auth.uid() = user_id);
