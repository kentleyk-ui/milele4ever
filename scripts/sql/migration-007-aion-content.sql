-- ============================================================
-- MILELE — Migration 007 : Tables Aïon
-- À exécuter dans Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── content_items (tous les contenus Aïon) ─────────────────
CREATE TABLE IF NOT EXISTS public.content_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type  TEXT NOT NULL CHECK (content_type IN ('mon_histoire','coffre_fort','capsules','journal','volontes','souvenirs')),
  title         TEXT,
  body          TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  visibility    TEXT NOT NULL DEFAULT 'intime' CHECK (visibility IN ('intime','famille','amis','public')),
  media_urls    TEXT[] NOT NULL DEFAULT '{}',
  is_encrypted  BOOLEAN NOT NULL DEFAULT false,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_content_owner ON public.content_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_content_type  ON public.content_items(content_type);

-- ─── circle_members ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.circle_members (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email            TEXT NOT NULL,
  display_name     TEXT,
  visibility_level TEXT NOT NULL DEFAULT 'famille' CHECK (visibility_level IN ('intime','famille','amis','public')),
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','declined','removed')),
  role             TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','executor','guardian')),
  invited_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_circle_owner ON public.circle_members(owner_id);

-- ─── capsules_temporelles ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.capsules_temporelles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_item_id  UUID REFERENCES public.content_items(id) ON DELETE SET NULL,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email  TEXT NOT NULL,
  recipient_name   TEXT,
  trigger_type     TEXT NOT NULL DEFAULT 'date' CHECK (trigger_type IN ('date','death','event','manual')),
  deliver_at       TIMESTAMPTZ,
  trigger_event    TEXT,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','delivered','opened','cancelled')),
  delivered_at     TIMESTAMPTZ,
  opened_at        TIMESTAMPTZ,
  personal_message TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── volontes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.volontes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category    TEXT NOT NULL CHECK (category IN ('funeraire','medical','legal','personnel','numerique')),
  title       TEXT NOT NULL,
  body        TEXT,
  attachments TEXT[] NOT NULL DEFAULT '{}',
  visibility  TEXT NOT NULL DEFAULT 'intime' CHECK (visibility IN ('intime','famille','amis','public')),
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  confirmed   BOOLEAN NOT NULL DEFAULT false,
  locked_at   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── memorials ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.memorials (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug         TEXT UNIQUE,
  display_name TEXT NOT NULL,
  bio          TEXT,
  birth_date   DATE,
  death_date   DATE,
  cover_url    TEXT,
  avatar_url   TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  theme        TEXT NOT NULL DEFAULT 'default',
  settings     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── tributes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tributes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  memorial_id    UUID NOT NULL REFERENCES public.memorials(id) ON DELETE CASCADE,
  author_name    TEXT NOT NULL,
  author_email   TEXT,
  author_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  tribute_type   TEXT NOT NULL DEFAULT 'message' CHECK (tribute_type IN ('message','flower','candle','photo','memory')),
  content        TEXT,
  media_url      TEXT,
  is_approved    BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── aion_activity_log ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.aion_activity_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.aion_activity_log(user_id);

-- ─── RLS ────────────────────────────────────────────────────
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='content_items_owner_all' AND tablename='content_items') THEN
  CREATE POLICY content_items_owner_all ON public.content_items FOR ALL USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);
END IF; END $$;

ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='circle_owner_all' AND tablename='circle_members') THEN
  CREATE POLICY circle_owner_all ON public.circle_members FOR ALL USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);
END IF; END $$;

ALTER TABLE public.capsules_temporelles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='capsules_owner_all' AND tablename='capsules_temporelles') THEN
  CREATE POLICY capsules_owner_all ON public.capsules_temporelles FOR ALL USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);
END IF; END $$;

ALTER TABLE public.volontes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='volontes_owner_all' AND tablename='volontes') THEN
  CREATE POLICY volontes_owner_all ON public.volontes FOR ALL USING (auth.uid()=owner_id) WITH CHECK (auth.uid()=owner_id);
END IF; END $$;

ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='memorials_owner_all' AND tablename='memorials') THEN
  CREATE POLICY memorials_owner_all ON public.memorials FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='memorials_public_read' AND tablename='memorials') THEN
  CREATE POLICY memorials_public_read ON public.memorials FOR SELECT USING (is_active=true);
END IF; END $$;

ALTER TABLE public.tributes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='tributes_public_read' AND tablename='tributes') THEN
  CREATE POLICY tributes_public_read ON public.tributes FOR SELECT USING (true);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='tributes_insert_auth' AND tablename='tributes') THEN
  CREATE POLICY tributes_insert_auth ON public.tributes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
END IF; END $$;

ALTER TABLE public.aion_activity_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='activity_owner_all' AND tablename='aion_activity_log') THEN
  CREATE POLICY activity_owner_all ON public.aion_activity_log FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
END IF; END $$;

-- ─── Trigger updated_at ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_content_items') THEN
  CREATE TRIGGER set_updated_at_content_items BEFORE UPDATE ON public.content_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_circle_members') THEN
  CREATE TRIGGER set_updated_at_circle_members BEFORE UPDATE ON public.circle_members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_capsules') THEN
  CREATE TRIGGER set_updated_at_capsules BEFORE UPDATE ON public.capsules_temporelles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_volontes') THEN
  CREATE TRIGGER set_updated_at_volontes BEFORE UPDATE ON public.volontes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
END IF; END $$;

-- ─── Storage bucket médias Aïon ─────────────────────────────
INSERT INTO storage.buckets (id, name, public) VALUES ('aion-media', 'aion-media', false)
ON CONFLICT (id) DO NOTHING;
