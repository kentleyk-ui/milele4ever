# PowerShell script to initialize the publications table in Supabase
# Usage: .\scripts\init-publications.ps1

Write-Host "========================================"
Write-Host "Supabase Publications Table Initialization"
Write-Host "========================================"
Write-Host ""

# Get credentials from environment or user
$supabaseUrl = $env:SUPABASE_URL
$serviceKey = $env:SUPABASE_SERVICE_ROLE_KEY

if (-not $supabaseUrl) {
  $supabaseUrl = Read-Host "Enter your Supabase URL (https://your-project.supabase.co)"
}

if (-not $serviceKey) {
  $serviceKey = Read-Host "Enter your Service Role Key"
}

$sql = @"
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
"@

Write-Host "SQL à exécuter:"
Write-Host "=========================================="
Write-Host $sql
Write-Host "=========================================="
Write-Host ""
Write-Host "Pour exécuter:"
Write-Host "1. Ouvre: $supabaseUrl/project/_/sql"
Write-Host "2. Clique sur 'New Query'"
Write-Host "3. Copie-colle le SQL ci-dessus"
Write-Host "4. Clique sur 'Execute'"
Write-Host ""

# Optionally copy to clipboard
$copyToClipboard = Read-Host "Copier le SQL dans le presse-papiers? (y/n)"
if ($copyToClipboard -eq 'y' -or $copyToClipboard -eq 'Y') {
  $sql | Set-Clipboard
  Write-Host "✓ SQL copié dans le presse-papiers!"
}

Write-Host ""
Write-Host "Lien direct Supabase:"
Write-Host "$supabaseUrl/project/_/sql"
