import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Configuration Supabase manquante" },
        { status: 500 }
      )
    }

    // Préférer utiliser directement PostgreSQL via le connecteur Supabase
    const dbUrl = process.env.DATABASE_URL
    if (!dbUrl) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      )
    }

    // Utiliser fetch pour faire un appel au service Supabase
    const sqlStatements = [
      `CREATE TABLE IF NOT EXISTS publications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0
      );`,
      `CREATE INDEX IF NOT EXISTS idx_publications_user_id ON publications(user_id);`,
      `CREATE INDEX IF NOT EXISTS idx_publications_created_at ON publications(created_at DESC);`,
      `ALTER TABLE publications ENABLE ROW LEVEL SECURITY;`,
      `DROP POLICY IF EXISTS "Allow read publications" ON publications; CREATE POLICY "Allow read publications" ON publications FOR SELECT USING (true);`,
      `DROP POLICY IF EXISTS "Allow users to insert their own publications" ON publications; CREATE POLICY "Allow users to insert their own publications" ON publications FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Allow users to update their own publications" ON publications; CREATE POLICY "Allow users to update their own publications" ON publications FOR UPDATE USING (auth.uid() = user_id);`,
      `DROP POLICY IF EXISTS "Allow users to delete their own publications" ON publications; CREATE POLICY "Allow users to delete their own publications" ON publications FOR DELETE USING (auth.uid() = user_id);`,
    ]

    const response = await fetch(`${supabaseUrl}/rest/v1/publications?select=count`, {
      method: "HEAD",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    })

    if (response.status === 200) {
      return NextResponse.json({
        success: true,
        message: "Table publications existe déjà",
      })
    }

    return NextResponse.json({
      success: false,
      message: "Table introuvable.",
    }, { status: 400 })
  } catch (err) {
    console.error("Erreur:", err)
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    )
  }
}
