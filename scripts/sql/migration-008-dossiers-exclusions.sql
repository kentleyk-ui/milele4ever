-- ============================================================
-- MILELE — Migration 008 : Exclusions de consultation dossier
-- ============================================================

ALTER TABLE IF EXISTS public.dossiers
  ADD COLUMN IF NOT EXISTS excluded_member_ids UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_dossiers_excluded_member_ids
  ON public.dossiers
  USING GIN (excluded_member_ids);
