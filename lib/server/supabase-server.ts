import { createClient } from "@supabase/supabase-js"

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321"
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "placeholder"
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
