"use client"

import { ShieldX } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export default function RestrictedAccess({ reason }: { reason?: string | null }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(135deg, #140d18 0%, #1f1728 50%, #120a16 100%)",
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-rose-500/20 bg-rose-950/20 backdrop-blur-xl shadow-2xl p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/12 border border-rose-500/20 flex items-center justify-center text-rose-300 mb-5">
          <ShieldX size={30} />
        </div>
        <div className="text-xs tracking-[0.25em] uppercase text-rose-200/70 mb-3">Aeternum</div>
        <h1 className="text-2xl font-bold text-white mb-3">Acces restreint</h1>
        <p className="text-sm text-white/60 leading-relaxed mb-4">
          Ton compte staff a ete restreint par l'Administrateur Supreme. L'acces au dashboard est bloque tant qu'une reactivation n'a pas ete faite.
        </p>
        {reason ? (
          <div className="rounded-2xl border border-rose-500/20 bg-black/20 px-4 py-3 text-sm text-rose-100 mb-6">
            Motif: {reason}
          </div>
        ) : null}
        <button
          className="px-5 py-2.5 rounded-2xl font-semibold text-white bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 transition-all"
          onClick={async () => {
            await supabase.auth.signOut()
          }}
        >
          Se deconnecter
        </button>
      </div>
    </div>
  )
}