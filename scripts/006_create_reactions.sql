-- Memorial-specific reactions
CREATE TABLE IF NOT EXISTS public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'heart' CHECK (type IN ('heart', 'candle', 'flower', 'pray', 'hug')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, post_id, type)
);

ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view reactions
CREATE POLICY "reactions_select" ON public.reactions FOR SELECT USING (true);

-- Users can insert their own reactions
CREATE POLICY "reactions_insert_own" ON public.reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "reactions_delete_own" ON public.reactions
  FOR DELETE USING (auth.uid() = user_id);
