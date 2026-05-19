import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const isServer = typeof window === "undefined"

// Guard pour éviter un crash au prerender si les vars ne sont pas définies
if (!supabaseUrl || !supabaseAnonKey) {
  if (isServer) {
    // Côté serveur au build : on ne lance pas d'erreur fatale
    console.warn("[supabaseClient] Supabase env vars manquantes — mode build statique")
  } else {
    throw new Error("[supabaseClient] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY manquantes")
  }
}

export const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "placeholder-anon-key",
  isServer
    ? {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    : undefined
)
