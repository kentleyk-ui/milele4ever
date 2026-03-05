-- Friends/family connections
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  relation_type TEXT DEFAULT 'friend',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Users can see connections they are part of
CREATE POLICY "connections_select_own" ON public.connections
  FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Users can create connection requests
CREATE POLICY "connections_insert_own" ON public.connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update connections addressed to them (accept/decline)
CREATE POLICY "connections_update_addressee" ON public.connections
  FOR UPDATE USING (auth.uid() = addressee_id);

-- Users can delete their own requests or received requests
CREATE POLICY "connections_delete_own" ON public.connections
  FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
