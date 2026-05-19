#!/usr/bin/env pwsh
# Script to initialize publications table using Supabase Management API
# This script uses the Supabase API to execute SQL directly without needing the CLI

param(
    [string]$ProjectRef,
    [string]$AccessToken
)

# If not provided as arguments, prompt for them
if (-not $ProjectRef) {
    $ProjectRef = Read-Host "Enter your Supabase Project Reference (from project URL, e.g., 'abcdefgh')"
}

if (-not $AccessToken) {
    $AccessToken = Read-Host "Enter your Supabase Personal Access Token" -AsSecureString
    $AccessToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($AccessToken))
}

if (-not $ProjectRef -or -not $AccessToken) {
    Write-Host "❌ Missing required parameters" -ForegroundColor Red
    exit 1
}

$SQL = @"
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

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Executing SQL via Supabase Management API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $AccessToken"
    "Content-Type"   = "application/json"
}

$body = @{
    query = $SQL
} | ConvertTo-Json

Write-Host "📤 Sending SQL to Supabase Management API..." -ForegroundColor Blue

try {
    $response = Invoke-RestMethod `
        -Uri "https://api.supabase.com/v1/projects/$ProjectRef/database/query" `
        -Method POST `
        -Headers $headers `
        -Body $body

    if ($response) {
        Write-Host "✅ SQL executed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Response:" -ForegroundColor Green
        $response | ConvertTo-Json | Write-Host
    }
}
catch {
    $errorResponse = $_
    Write-Host "❌ Error executing SQL:" -ForegroundColor Red
    Write-Host $errorResponse.Exception.Message -ForegroundColor Red
    
    if ($errorResponse.Exception.Response) {
        $errorContent = $errorResponse.Exception.Response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($errorContent) {
            Write-Host "Details:" -ForegroundColor Yellow
            $errorContent | ConvertTo-Json | Write-Host
        }
    }
    
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "For Supabase Personal Access Token:" -ForegroundColor Cyan
Write-Host "1. Go to https://app.supabase.com/account/tokens" -ForegroundColor Cyan
Write-Host "2. Create a new personal access token" -ForegroundColor Cyan
Write-Host "3. Use it with this script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
