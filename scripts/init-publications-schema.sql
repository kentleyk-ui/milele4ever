-- Publications Table Schema
-- Execute this in your Supabase SQL Editor to create the publications table
-- https://app.supabase.com -> SQL Editor -> New Query

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_publications_user_id ON publications(user_id);
CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view publications
DROP POLICY IF EXISTS "Allow read publications" ON publications;
CREATE POLICY "Allow read publications" ON publications
  FOR SELECT USING (true);

-- Allow users to create their own publications
DROP POLICY IF EXISTS "Allow users to insert their own publications" ON publications;
CREATE POLICY "Allow users to insert their own publications" ON publications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own publications
DROP POLICY IF EXISTS "Allow users to update their own publications" ON publications;
CREATE POLICY "Allow users to update their own publications" ON publications
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to delete their own publications
DROP POLICY IF EXISTS "Allow users to delete their own publications" ON publications;
CREATE POLICY "Allow users to delete their own publications" ON publications
  FOR DELETE USING (auth.uid() = user_id);
