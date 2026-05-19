#!/bin/bash
# Script to initialize the publications table in Supabase

# Please set these environment variables before running:
# export SUPABASE_URL="your_supabase_url"
# export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

SUPABASE_URL=${SUPABASE_URL:-"https://your-project.supabase.co"}
SERVICE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-""}

if [ -z "$SERVICE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set"
  exit 1
fi

# SQL to create publications table
SQL=$(cat <<'EOF'
CREATE TABLE IF NOT EXISTS publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_publications_user_id ON publications(user_id);
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);

ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read publications" ON publications;
CREATE POLICY "Allow read publications" ON publications
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to insert their own publications" ON publications;
CREATE POLICY "Allow users to insert their own publications" ON publications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to update their own publications" ON publications;
CREATE POLICY "Allow users to update their own publications" ON publications
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to delete their own publications" ON publications;
CREATE POLICY "Allow users to delete their own publications" ON publications
  FOR DELETE USING (auth.uid() = user_id);
EOF
)

echo "Attempting to create publications table..."
echo "URL: $SUPABASE_URL"
echo ""
echo "Please run this SQL in your Supabase SQL Editor:"
echo "=========================================="
echo "$SQL"
echo "=========================================="
echo ""
echo "Alternatively, paste the SQL above in: $SUPABASE_URL/project/_/sql"
