-- Migration 006 — Compatibilite colonne legacy role sur staff_profiles
-- But: eviter les erreurs "null value in column role violates not-null constraint"

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'staff_profiles'
      AND column_name = 'role'
  ) THEN
    -- Backfill si des lignes legacy ont role NULL
    UPDATE public.staff_profiles
    SET role = COALESCE(role_id, 'member')
    WHERE role IS NULL;

    -- Default defensif pour les futurs inserts
    ALTER TABLE public.staff_profiles
      ALTER COLUMN role SET DEFAULT 'member';
  END IF;
END $$;
