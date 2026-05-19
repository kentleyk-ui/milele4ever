-- ══════════════════════════════════════════════
-- MILELE — Migration 003 : Table feedbacks
-- Colle ce script dans Supabase SQL Editor
-- ══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feedbacks (
  id          bigserial PRIMARY KEY,
  name        text NOT NULL DEFAULT 'Anonyme',
  type        text NOT NULL CHECK (type IN ('bug','typo','suggestion','design','autre')),
  type_label  text NOT NULL DEFAULT '',
  message     text NOT NULL,
  status      text NOT NULL DEFAULT 'new' CHECK (status IN ('new','in-progress','done')),
  note        text,
  url         text,
  user_agent  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Insertion publique" ON public.feedbacks;
DROP POLICY IF EXISTS "Lecture admin seulement" ON public.feedbacks;

-- Tout le monde peut soumettre un feedback (anonyme)
CREATE POLICY "Insertion publique" ON public.feedbacks FOR INSERT WITH CHECK (true);

-- Seul le service role (admin) peut lire et modifier
-- (les APIs admin utilisent la service_role_key, qui bypass RLS)
CREATE POLICY "Lecture admin seulement" ON public.feedbacks FOR SELECT USING (false);
