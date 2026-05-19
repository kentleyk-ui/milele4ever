-- ══════════════════════════════════════════════
-- MILELE — Migration 002 : Table dossiers
-- Colle ce script dans Supabase SQL Editor
-- ══════════════════════════════════════════════

-- TABLE DOSSIERS (dossier de deuil par utilisateur)
CREATE TABLE IF NOT EXISTS public.dossiers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  defunt      jsonb NOT NULL DEFAULT '{}',
  checklist   jsonb NOT NULL DEFAULT '[]',
  documents   jsonb NOT NULL DEFAULT '[]',
  contacts    jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.dossiers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Voir son dossier" ON public.dossiers;
DROP POLICY IF EXISTS "Créer son dossier" ON public.dossiers;
DROP POLICY IF EXISTS "Modifier son dossier" ON public.dossiers;
DROP POLICY IF EXISTS "Supprimer son dossier" ON public.dossiers;

CREATE POLICY "Voir son dossier"    ON public.dossiers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Créer son dossier"   ON public.dossiers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modifier son dossier" ON public.dossiers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Supprimer son dossier" ON public.dossiers FOR DELETE USING (auth.uid() = user_id);
