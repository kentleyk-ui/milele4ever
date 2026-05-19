-- ══════════════════════════════════════════════════════════════
-- MILELE — Migration 010 : Ajouter feedback_resolved au type notifications
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Supprimer l'ancienne contrainte CHECK
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Recréer la contrainte avec les nouveaux types
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('like', 'comment', 'feedback_resolved'));

-- 3. Ajouter la politique INSERT manquante (service role bypass RLS, mais par sécurité)
-- Les APIs admin utilisent service_role_key donc bypass RLS automatiquement
-- Rien à ajouter ici si service_role_key est utilisé côté API.
