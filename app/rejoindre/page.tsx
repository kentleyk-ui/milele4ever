"use client"

import { Suspense } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Link2, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

interface InvitePayload {
  id: string
  category: string
  message?: string | null
  target_email?: string | null
  requester?: { display_name?: string | null } | null
}

function RejoindreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")?.trim() ?? ""

  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invite, setInvite] = useState<InvitePayload | null>(null)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function boot() {
      if (!token) {
        setError("Lien d'invitation invalide.")
        setLoading(false)
        return
      }

      const [{ data: sessionData }, inviteRes] = await Promise.all([
        supabase.auth.getSession(),
        fetch(`/api/membres/accept?token=${encodeURIComponent(token)}`),
      ])

      if (cancelled) return

      const payload = (await inviteRes.json().catch(() => ({}))) as {
        valid?: boolean
        error?: string
        invite?: InvitePayload
      }

      setSessionEmail(sessionData.session?.user?.email?.toLowerCase() ?? null)

      if (!inviteRes.ok || !payload.valid || !payload.invite) {
        setError(payload.error ?? "Cette invitation n'est plus disponible.")
        setLoading(false)
        return
      }

      setInvite(payload.invite)
      setValid(true)
      setLoading(false)
    }

    void boot()
    return () => {
      cancelled = true
    }
  }, [token])

  async function acceptInvite() {
    if (!token) return
    const { data } = await supabase.auth.getSession()
    const accessToken = data.session?.access_token

    if (!accessToken) {
      router.push(`/espace/membres?inviteToken=${encodeURIComponent(token)}`)
      return
    }

    const res = await fetch("/api/membres/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ invitationToken: token, action: "accept" }),
    })

    if (res.ok) {
      router.push("/espace/membres")
      return
    }

    const payload = (await res.json().catch(() => ({}))) as { error?: string }
    setError(payload.error ?? "Impossible d'accepter l'invitation.")
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>Chargement…</div>
  }

  return (
    <div className="min-h-screen px-4 py-12" style={{ background: "var(--background)" }}>
      <div className="mx-auto max-w-xl rounded-3xl p-6 border" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        {valid && invite ? (
          <>
            <div className="flex items-center gap-2 mb-4" style={{ color: "var(--primary)" }}>
              <CheckCircle2 size={18} />
              <h1 className="text-lg font-semibold">Invitation Milele</h1>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--foreground)" }}>
              <strong>{invite.requester?.display_name ?? "Un proche"}</strong> vous invite à rejoindre son cercle ({invite.category}).
            </p>
            {invite.message ? (
              <p className="text-sm mb-4 italic" style={{ color: "var(--muted-foreground)" }}>“{invite.message}”</p>
            ) : null}

            {invite.target_email && sessionEmail && invite.target_email !== sessionEmail ? (
              <div className="rounded-xl px-3 py-2 text-xs mb-4" style={{ background: "oklch(97% 0.02 30)", color: "#b91c1c" }}>
                Cette invitation est liée à <strong>{invite.target_email}</strong>. Connectez-vous avec cette adresse pour continuer.
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={acceptInvite}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                Accepter l'invitation
              </button>
              <Link
                href="/espace/membres"
                className="px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
              >
                Ouvrir mon espace
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-4" style={{ color: "#b91c1c" }}>
              <XCircle size={18} />
              <h1 className="text-lg font-semibold">Invitation indisponible</h1>
            </div>
            <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
              {error ?? "Ce lien n'est plus valide."}
            </p>
            <Link
              href="/espace/membres"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}
            >
              <Link2 size={14} /> Aller à l'espace membres
            </Link>
          </>
        )}

        {error && valid ? (
          <div className="rounded-xl px-3 py-2 text-xs mt-4" style={{ background: "oklch(97% 0.02 30)", color: "#b91c1c" }}>
            {error}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function RejoindrePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>Chargement…</div>}>
      <RejoindreContent />
    </Suspense>
  )
}
