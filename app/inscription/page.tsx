"use client"

import { Suspense, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import MemberAuth from "@/components/MemberAuth"

function InscriptionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const safeRedirect = useMemo(() => {
    const requested = searchParams.get("redirect")
    if (requested && requested.startsWith("/")) return requested
    return "/espace"
  }, [searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--background)" }}>
      <div
        className="w-full max-w-md rounded-3xl p-6 sm:p-8"
        style={{
          background: "color-mix(in srgb, var(--card) 88%, transparent)",
          border: "1px solid var(--border)",
          boxShadow: "0 20px 60px oklch(0.08 0.04 150 / 0.25)",
        }}
      >
        <MemberAuth
          initialMode="menu"
          onSuccess={() => router.push(safeRedirect)}
          onClose={() => router.push("/")}
        />
      </div>
    </div>
  )
}

export default function InscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      }
    >
      <InscriptionContent />
    </Suspense>
  )
}
