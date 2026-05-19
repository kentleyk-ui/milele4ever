import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type AuthAdminUser = {
  id: string
  email?: string | null
  email_confirmed_at?: string | null
}

type AuthAdminApi = {
  listUsers: (params?: { page?: number; perPage?: number }) => Promise<{
    data: { users: AuthAdminUser[] } | null
    error: { message: string } | null
  }>
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 })
  }

  const supabaseAdmin = createAdminClient()
  const adminAuth = supabaseAdmin.auth.admin as unknown as AuthAdminApi

  const perPage = 200
  const maxPages = 20

  for (let page = 1; page <= maxPages; page += 1) {
    const { data, error } = await adminAuth.listUsers({ page, perPage })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = data?.users ?? []
    const match = users.find((user) => (user.email ?? "").trim().toLowerCase() === email)
    if (match) {
      return NextResponse.json({
        exists: true,
        emailConfirmed: !!match.email_confirmed_at,
      })
    }

    if (users.length < perPage) break
  }

  return NextResponse.json({ exists: false, emailConfirmed: false })
}
