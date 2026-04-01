-- Malaika Chat History Table
-- Stores conversation history with Malaika AI assistant

-- Create malaika_conversations table
CREATE TABLE IF NOT EXISTS malaika_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  memorial_id UUID REFERENCES memorials(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create malaika_messages table
CREATE TABLE IF NOT EXISTS malaika_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES malaika_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE malaika_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE malaika_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON malaika_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON malaika_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON malaika_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON malaika_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages (based on conversation ownership)
CREATE POLICY "Users can view messages in own conversations" ON malaika_messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM malaika_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON malaika_messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM malaika_conversations WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_malaika_conversations_user_id ON malaika_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_malaika_messages_conversation_id ON malaika_messages(conversation_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_malaika_conversations_updated_at 
  BEFORE UPDATE ON malaika_conversations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
