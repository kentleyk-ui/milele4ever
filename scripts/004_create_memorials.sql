-- Memorial pages for humans and animals
CREATE TABLE IF NOT EXISTS public.memorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'human' CHECK (type IN ('human', 'animal')),
  species TEXT,
  birth_date DATE,
  death_date DATE,
  photo_url TEXT,
  biography TEXT,
  city TEXT,
  country TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;

-- Public memorials visible to all authenticated users
CREATE POLICY "memorials_select_public" ON public.memorials
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

-- Creator can insert
CREATE POLICY "memorials_insert_own" ON public.memorials
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Creator can update
CREATE POLICY "memorials_update_own" ON public.memorials
  FOR UPDATE USING (auth.uid() = created_by);

-- Creator can delete
CREATE POLICY "memorials_delete_own" ON public.memorials
  FOR DELETE USING (auth.uid() = created_by);
