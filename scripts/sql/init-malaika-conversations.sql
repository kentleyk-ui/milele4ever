-- Table conversations Malaïka (persistance entre sessions)
create table if not exists public.malaika_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,       -- user ID Supabase ou public-uid localStorage
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Index pour requêtes par utilisateur
create index if not exists malaika_conversations_user_id_idx
  on public.malaika_conversations(user_id, created_at asc);

-- RLS désactivé : accès via service_role uniquement (API Next.js)
alter table public.malaika_conversations disable row level security;

-- Nettoyage automatique : garder seulement les 100 derniers messages par user
-- (à lancer manuellement ou via cron si besoin)
-- delete from malaika_conversations where id in (
--   select id from (
--     select id, row_number() over (partition by user_id order by created_at desc) as rn
--     from malaika_conversations
--   ) t where rn > 100
-- );
