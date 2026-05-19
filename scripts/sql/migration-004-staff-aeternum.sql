-- ══════════════════════════════════════════════════════════════
-- Migration 004 — Adaptation staff_profiles au scénario Aeternum
-- ══════════════════════════════════════════════════════════════

-- 1. Ajouter les colonnes Aeternum à staff_profiles
ALTER TABLE public.staff_profiles
  ADD COLUMN IF NOT EXISTS role_id      TEXT,
  ADD COLUMN IF NOT EXISTS role_name    TEXT,
  ADD COLUMN IF NOT EXISTS role_category TEXT,
  ADD COLUMN IF NOT EXISTS status       TEXT NOT NULL DEFAULT 'pending_role'
                                         CHECK (status IN ('pending_role','pending_approval','approved','rejected')),
  ADD COLUMN IF NOT EXISTS full_name    TEXT,
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS accent_color JSONB DEFAULT '{"h": 160, "s": 60, "l": 40}'::jsonb,
  ADD COLUMN IF NOT EXISTS approved_by  UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now();

-- 2. Activer RLS
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS — Chaque utilisateur peut lire/modifier son propre profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'staff_profiles' AND policyname = 'Users manage own staff profile'
  ) THEN
    CREATE POLICY "Users manage own staff profile"
      ON public.staff_profiles FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. RLS — Admin suprême peut lire et modifier tous les profils
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'staff_profiles' AND policyname = 'Admin reads all staff profiles'
  ) THEN
    CREATE POLICY "Admin reads all staff profiles"
      ON public.staff_profiles FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.staff_profiles WHERE role_id = 'admin-supreme'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'staff_profiles' AND policyname = 'Admin updates all staff profiles'
  ) THEN
    CREATE POLICY "Admin updates all staff profiles"
      ON public.staff_profiles FOR UPDATE
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.staff_profiles WHERE role_id = 'admin-supreme'
        )
      );
  END IF;
END $$;

-- 5. Auto-approuver Kent (Administrateur Suprême)
-- Remplacer si besoin par le vrai user_id de Kent
UPDATE public.staff_profiles
SET
  role_id       = 'admin-supreme',
  role_name     = 'Administrateur Suprême',
  role_category = 'administration',
  status        = 'approved'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'kentleyk@gmail.com' LIMIT 1
);

-- 6. Table staff_messages — ajouter sender_name si absent (pour l'affichage chat)
ALTER TABLE public.staff_messages
  ADD COLUMN IF NOT EXISTS sender_name TEXT;

-- 7. RLS staff_messages — tout staff approuvé peut lire et écrire
ALTER TABLE public.staff_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'staff_messages' AND policyname = 'Approved staff can read messages'
  ) THEN
    CREATE POLICY "Approved staff can read messages"
      ON public.staff_messages FOR SELECT
      USING (
        auth.uid() IN (
          SELECT user_id FROM public.staff_profiles WHERE status = 'approved'
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'staff_messages' AND policyname = 'Approved staff can insert messages'
  ) THEN
    CREATE POLICY "Approved staff can insert messages"
      ON public.staff_messages FOR INSERT
      WITH CHECK (
        auth.uid() = user_id AND
        auth.uid() IN (
          SELECT user_id FROM public.staff_profiles WHERE status = 'approved'
        )
      );
  END IF;
END $$;
