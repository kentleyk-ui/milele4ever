-- ══════════════════════════════════════════════
-- MILELE — Migration SQL complète
-- Colle ce script dans Supabase SQL Editor
-- ══════════════════════════════════════════════

-- 1. TABLE PROFILES (membres Milele)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  text NOT NULL DEFAULT '',
  avatar_url    text,
  bio           text,
  email         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
-- Ajouter la colonne visibility si elle n'existe pas encore
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private'));
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profil visible si public" ON public.profiles;
DROP POLICY IF EXISTS "Proprio peut modifier son profil" ON public.profiles;
CREATE POLICY "Profil visible si public" ON public.profiles FOR SELECT USING (visibility = 'public' OR auth.uid() = id);
CREATE POLICY "Proprio peut modifier son profil" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Trigger auto-création de profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email,'@',1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. TABLE CONNECTIONS (réseau famille/amis)
CREATE TABLE IF NOT EXISTS public.connections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category      text NOT NULL CHECK (category IN ('famille','amis','connaissances')),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','invited')),
  message       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, target_id)
);
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Voir ses connexions" ON public.connections FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "Créer une connexion" ON public.connections FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Modifier si impliqué" ON public.connections FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = target_id);
CREATE POLICY "Supprimer si impliqué" ON public.connections FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = target_id);

-- 3. TABLE STAFF_ROLES (rôles portail staff)
CREATE TABLE IF NOT EXISTS public.staff_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area       text NOT NULL DEFAULT 'staff' CHECK (area IN ('staff','suggestions')),
  role       text NOT NULL DEFAULT 'member',
  active     boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, area)
);
ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only" ON public.staff_roles FOR ALL USING (false);

SELECT 'Migration terminée ✓' as status;
