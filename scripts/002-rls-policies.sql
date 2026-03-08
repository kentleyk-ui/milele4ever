-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE memorial_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE candles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Memorials policies
CREATE POLICY "Public memorials are viewable by everyone" ON memorials FOR SELECT USING (is_public = true OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM memorial_members WHERE memorial_id = memorials.id AND user_id = auth.uid()));
CREATE POLICY "Users can create memorials" ON memorials FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Memorial owners can update" ON memorials FOR UPDATE USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM memorial_members WHERE memorial_id = memorials.id AND user_id = auth.uid() AND role IN ('owner', 'editor')));
CREATE POLICY "Memorial owners can delete" ON memorials FOR DELETE USING (created_by = auth.uid());

-- Memorial members policies
CREATE POLICY "Members viewable by memorial participants" ON memorial_members FOR SELECT USING (EXISTS (SELECT 1 FROM memorials WHERE id = memorial_members.memorial_id AND (is_public = true OR created_by = auth.uid())));
CREATE POLICY "Memorial owners can manage members" ON memorial_members FOR ALL USING (EXISTS (SELECT 1 FROM memorials WHERE id = memorial_members.memorial_id AND created_by = auth.uid()));

-- Posts policies
CREATE POLICY "Posts viewable on accessible memorials" ON posts FOR SELECT USING (EXISTS (SELECT 1 FROM memorials WHERE id = posts.memorial_id AND (is_public = true OR created_by = auth.uid() OR EXISTS (SELECT 1 FROM memorial_members WHERE memorial_id = memorials.id AND user_id = auth.uid()))));
CREATE POLICY "Authenticated users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Authors can update own posts" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Authors can delete own posts" ON posts FOR DELETE USING (auth.uid() = author_id);

-- Media policies
CREATE POLICY "Media viewable on accessible memorials" ON media FOR SELECT USING (EXISTS (SELECT 1 FROM memorials WHERE id = media.memorial_id AND (is_public = true OR created_by = auth.uid())));
CREATE POLICY "Authenticated users can upload media" ON media FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Uploaders can delete own media" ON media FOR DELETE USING (auth.uid() = uploaded_by);

-- Timeline events policies
CREATE POLICY "Timeline viewable on accessible memorials" ON timeline_events FOR SELECT USING (EXISTS (SELECT 1 FROM memorials WHERE id = timeline_events.memorial_id AND (is_public = true OR created_by = auth.uid())));
CREATE POLICY "Memorial editors can manage timeline" ON timeline_events FOR ALL USING (EXISTS (SELECT 1 FROM memorials WHERE id = timeline_events.memorial_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM memorial_members WHERE memorial_id = memorials.id AND user_id = auth.uid() AND role IN ('owner', 'editor')))));

-- Family relationships policies
CREATE POLICY "Relationships viewable on accessible memorials" ON family_relationships FOR SELECT USING (EXISTS (SELECT 1 FROM memorials WHERE id = family_relationships.memorial_id AND (is_public = true OR created_by = auth.uid())));
CREATE POLICY "Memorial editors can manage relationships" ON family_relationships FOR ALL USING (EXISTS (SELECT 1 FROM memorials WHERE id = family_relationships.memorial_id AND (created_by = auth.uid() OR EXISTS (SELECT 1 FROM memorial_members WHERE memorial_id = memorials.id AND user_id = auth.uid() AND role IN ('owner', 'editor')))));

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = conversations.id AND user_id = auth.uid()));
CREATE POLICY "Authenticated users can create conversations" ON conversations FOR INSERT WITH CHECK (true);

-- Conversation participants policies
CREATE POLICY "Participants can view conversation members" ON conversation_participants FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants cp WHERE cp.conversation_id = conversation_participants.conversation_id AND cp.user_id = auth.uid()));
CREATE POLICY "Users can join conversations" ON conversation_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON conversation_participants FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Conversation participants can view messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Participants can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()));

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Service requests policies
CREATE POLICY "Users can view own service requests" ON service_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create service requests" ON service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own service requests" ON service_requests FOR UPDATE USING (auth.uid() = user_id);

-- Candles policies
CREATE POLICY "Candles viewable on accessible memorials" ON candles FOR SELECT USING (EXISTS (SELECT 1 FROM memorials WHERE id = candles.memorial_id AND (is_public = true OR created_by = auth.uid())));
CREATE POLICY "Authenticated users can light candles" ON candles FOR INSERT WITH CHECK (auth.uid() = lit_by);
