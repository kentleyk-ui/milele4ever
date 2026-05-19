-- ══════════════════════════════════════════════════════════════
-- Migration 005 — Fix: infinite recursion in staff_profiles RLS
-- Pré-requis: migration-004-staff-aeternum.sql déjà appliquée
-- ══════════════════════════════════════════════════════════════
-- Cause: les policies lisaient staff_profiles dans USING/WITH CHECK,
-- ce qui réévaluait la même policy et causait une récursion infinie.
--
-- Fix: fonctions SECURITY DEFINER + policies réécrites.
-- ══════════════════════════════════════════════════════════════

-- 1) Fonctions helper (bypass RLS) avec search_path verrouillé
CREATE OR REPLACE FUNCTION public.is_staff_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles
    WHERE user_id = auth.uid()
      AND role_id = 'admin-supreme'
      AND status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_staff()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_profiles
    WHERE user_id = auth.uid()
      AND status = 'approved'
  );
$$;

-- 2) Permissions minimales d'exécution des fonctions helper
REVOKE ALL ON FUNCTION public.is_staff_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_approved_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_approved_staff() TO authenticated, service_role;

-- 3) staff_profiles policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'staff_profiles'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admin reads all staff profiles" ON public.staff_profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admin updates all staff profiles" ON public.staff_profiles';

    EXECUTE 'CREATE POLICY "Admin reads all staff profiles" ON public.staff_profiles FOR SELECT USING (public.is_staff_admin())';
    EXECUTE 'CREATE POLICY "Admin updates all staff profiles" ON public.staff_profiles FOR UPDATE USING (public.is_staff_admin()) WITH CHECK (public.is_staff_admin())';
  END IF;
END
$$;

-- 4) staff_messages policies
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'staff_messages'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Approved staff can read messages" ON public.staff_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Approved staff can insert messages" ON public.staff_messages';

    EXECUTE 'CREATE POLICY "Approved staff can read messages" ON public.staff_messages FOR SELECT USING (public.is_approved_staff())';
    EXECUTE 'CREATE POLICY "Approved staff can insert messages" ON public.staff_messages FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_approved_staff())';
  END IF;
END
$$;
