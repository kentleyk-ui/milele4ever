"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useDossier } from "@/lib/dossier-context"
import { useLocale } from "@/lib/locale-context"
import { supabase } from "@/lib/supabaseClient"
import { Heart, ChevronRight, CheckCircle2, FileText, Users, Clock, Globe, Shield, CloudUpload, Camera, Upload, ImageIcon, Save } from "lucide-react"
import dynamic from "next/dynamic"
const LiquidMetalButton = dynamic(() => import("@/components/liquid-metal-button").then((m) => m.LiquidMetalButton), { ssr: false })

/* ═══ Flow de création ═══ */
function CreationFlow() {
  const { createDossier } = useDossier()
  const { settings, formatDate, t } = useLocale()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [acceptedPolicy, setAcceptedPolicy] = useState(false)
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    relation: "",
    dateDeces: "",
    dateNaissance: "",
    lieuDeces: "",
  })

  const relations = [
    { value: "parent", label: t("espace.relation.parent"), emoji: "🕊️" },
    { value: "conjoint", label: t("espace.relation.conjoint"), emoji: "💑" },
    { value: "enfant", label: t("espace.relation.enfant"), emoji: "🌱" },
    { value: "frere-soeur", label: t("espace.relation.sibling"), emoji: "🤝" },
    { value: "ami", label: t("espace.relation.ami"), emoji: "🌿" },
    { value: "autre", label: t("espace.relation.autre"), emoji: "🕯️" },
  ]

  const handleCreate = () => {
    createDossier({
      prenom: form.prenom,
      nom: form.nom,
      relation: form.relation,
      dateDeces: form.dateDeces,
      dateNaissance: form.dateNaissance || undefined,
      lieuDeces: form.lieuDeces || undefined,
    })
    router.push("/espace/checklist")
  }

  if (step === 0) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 overflow-hidden">
        {/* Orbe décoratif */}
        <div className="orb orb-primary animate-float-slow" style={{ width: 400, height: 400, top: "-20%", left: "50%", transform: "translateX(-50%)", opacity: 0.2 }} />

        <div className="max-w-md w-full text-center relative">
          <div className="mb-8 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 relative"
              style={{ background: "color-mix(in srgb, var(--primary) 15%, var(--secondary))" }}>
              <div className="absolute inset-0 rounded-2xl animate-border-glow" style={{ border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)" }} />
              <Heart size={28} style={{ color: "var(--primary)" }} className="animate-float-medium" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mb-3" style={{ color: "var(--foreground)" }}>
              {t("espace.welcome.title")}
            </h1>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {t("espace.welcome.desc")}
            </p>
          </div>

          {/* Acceptation politique de confidentialité */}
          <label className="mt-6 flex items-start gap-3 text-left cursor-pointer group animate-fade-up delay-200">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={acceptedPolicy}
                onChange={e => setAcceptedPolicy(e.target.checked)}
                className="sr-only peer"
              />
              <div
                className="w-5 h-5 rounded-md border-2 transition-all peer-checked:border-transparent flex items-center justify-center"
                style={{
                  borderColor: acceptedPolicy ? "var(--primary)" : "var(--border)",
                  background: acceptedPolicy ? "var(--primary)" : "transparent",
                  boxShadow: acceptedPolicy ? "0 0 8px color-mix(in srgb, var(--primary) 40%, transparent)" : "none",
                }}
              >
                {acceptedPolicy && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="var(--primary-foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
            </div>
            <span className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              {t("espace.privacy.accept")}{" "}
              <Link href="/politique" target="_blank" className="underline font-medium underline-animated" style={{ color: "var(--primary)" }}>
                {t("espace.privacy.policy")}
              </Link>{" "}
              {t("espace.privacy.acceptSuffix")}
            </span>
          </label>

          <div className="flex items-center justify-center gap-3 mt-6 animate-fade-up delay-300"
            style={{ opacity: acceptedPolicy ? 1 : 0.4, pointerEvents: acceptedPolicy ? "auto" : "none", transition: "opacity 0.3s" }}>
            <LiquidMetalButton label={t("espace.cta.start")} width={200} height={48} fontSize={13} tinted onClick={() => router.push("/aion")} />
            <LiquidMetalButton label={t("espace.cta.create")} width={200} height={48} fontSize={13} tinted onClick={() => setStep(1)} />
          </div>

          <p className="mt-4 text-xs animate-fade-up delay-400" style={{ color: "var(--muted-foreground)" }}>
            {t("espace.privacy.note")}
          </p>
          {/* Locale détectée */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px]" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
            <Globe size={12} />
            <span>{settings.locale} · {settings.timezone} · {settings.currency}</span>
          </div>
        </div>
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="flex flex-col items-center min-h-[80vh] px-4 pt-8 sm:pt-16">
        <div className="max-w-md w-full">
          <p className="text-xs font-medium mb-6 tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
            {t("espace.step.1of3")}
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            {t("espace.step1.title")}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            {t("espace.step1.desc")}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {relations.map(r => (
              <button
                key={r.value}
                onClick={() => { setForm(f => ({ ...f, relation: r.value })); setStep(2) }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <span className="text-2xl">{r.emoji}</span>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(0)} className="mt-6 text-sm underline" style={{ color: "var(--muted-foreground)" }}>
            {t("common.back")}
          </button>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="flex flex-col items-center min-h-[80vh] px-4 pt-8 sm:pt-16">
        <div className="max-w-md w-full">
          <p className="text-xs font-medium mb-6 tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
            {t("espace.step.2of3")}
          </p>
          <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
            {t("espace.step2.title")}
          </h2>
          <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
            {t("espace.step2.desc")}
          </p>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.form.firstnameReq")}</label>
              <input
                type="text"
                value={form.prenom}
                onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder={t("espace.form.firstname")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.form.lastnameReq")}</label>
              <input
                type="text"
                value={form.nom}
                onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                placeholder={t("espace.form.lastname")}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.form.deathdateReq")}</label>
              <input
                type="date"
                value={form.dateDeces}
                onChange={e => setForm(f => ({ ...f, dateDeces: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  colorScheme: "dark light",
                }}
              />
            </div>
            <div className="mt-2 flex justify-center" style={{ opacity: (form.prenom && form.nom && form.dateDeces) ? 1 : 0.4, pointerEvents: (form.prenom && form.nom && form.dateDeces) ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
              <LiquidMetalButton
                label={t("common.continue")}
                width={220}
                height={42}
                fontSize={13}
                tinted
                onClick={() => setStep(3)}
              />
            </div>
            <button onClick={() => setStep(1)} className="text-sm underline" style={{ color: "var(--muted-foreground)" }}>
              {t("common.back")}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3 — infos optionnelles + confirmation
  return (
    <div className="flex flex-col items-center min-h-[80vh] px-4 pt-8 sm:pt-16">
      <div className="max-w-md w-full">
        <p className="text-xs font-medium mb-6 tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
          Étape 3 sur 3
        </p>
        <h2 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          Quelques détails optionnels
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--muted-foreground)" }}>
          Vous pouvez passer cette étape et compléter plus tard.
        </p>
        <div className="flex flex-col gap-4">
          <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.form.birthdate")}</label>
            <input
              type="date"
              value={form.dateNaissance}
              onChange={e => setForm(f => ({ ...f, dateNaissance: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
                colorScheme: "dark light",
              }}
            />
          </div>
          <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.form.deathplace")}</label>
            <input
              type="text"
              value={form.lieuDeces}
              onChange={e => setForm(f => ({ ...f, lieuDeces: e.target.value }))}
                placeholder={t("espace.form.deathplacePlaceholder")}
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>

          {/* Récapitulatif */}
          <div className="mt-4 p-4 rounded-2xl" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-medium mb-3 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{t("espace.form.summary")}</p>
            <p className="text-base font-semibold" style={{ color: "var(--foreground)" }}>
              {form.prenom} {form.nom}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
              {relations.find(r => r.value === form.relation)?.label} · {t("espace.form.deceasedOn")} {formatDate(form.dateDeces)}
            </p>
          </div>

          <div className="mt-2 flex justify-center">
            <LiquidMetalButton
              label={t("espace.cta.createMain")}
              width={220}
              height={42}
              fontSize={13}
              tinted
              onClick={handleCreate}
            />
          </div>
          <button onClick={() => setStep(2)} className="text-sm underline" style={{ color: "var(--muted-foreground)" }}>
            {t("common.back")}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══ Dashboard (dossier existant) ═══ */
function Dashboard() {
  const { dossier, updateDefunt, resetDossier } = useDossier()
  const { formatDate, t } = useLocale()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)
  const [profileName, setProfileName] = useState("Mon profil")
  const [accessToken, setAccessToken] = useState("")
  const [publicDisplayName, setPublicDisplayName] = useState("")
  const [publicAvatarUrl, setPublicAvatarUrl] = useState("")
  const [publicVisibility, setPublicVisibility] = useState<"public" | "private">("public")
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [profileNotice, setProfileNotice] = useState<string | null>(null)
  const [editingDefunt, setEditingDefunt] = useState(false)
  const [draftDefunt, setDraftDefunt] = useState({ prenom: "", nom: "", dateDeces: "", relation: "" })

  useEffect(() => {
    async function applySession(session: { user?: { id: string; email?: string }; access_token?: string } | null) {
      const user = session?.user
      setIsLoggedIn(!!user)
      setAccessToken(session?.access_token ?? "")

      if (!user) {
        setProfileName("Mon profil")
        setPublicDisplayName("")
        setPublicAvatarUrl("")
        setPublicVisibility("public")
        return
      }

      const fallbackName = user.email?.split("@")[0] ?? "Membre Milele"

      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, visibility")
        .eq("id", user.id)
        .maybeSingle()

      const profile = data as { display_name?: string | null; avatar_url?: string | null; visibility?: string | null } | null
      const resolvedName = profile?.display_name ?? fallbackName
      const resolvedAvatar = profile?.avatar_url ?? null

      setProfileName(resolvedName)
      setPublicDisplayName(resolvedName)
      setPublicAvatarUrl(resolvedAvatar ?? "")
      setPublicVisibility(profile?.visibility === "private" ? "private" : "public")
    }

    supabase.auth.getSession().then(({ data }) => {
      void applySession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      void applySession(session)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const uploadPublicAvatar = async (file: File) => {
    if (!accessToken) {
      setProfileNotice("Session invalide. Reconnectez-vous pour envoyer une photo.")
      return
    }

    setUploadingAvatar(true)
    setProfileNotice(null)

    try {
      const body = new FormData()
      body.append("file", file)

      const response = await fetch("/api/staff/profile-photo", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body,
      })

      const data = await response.json() as { publicUrl?: string; error?: string }
      if (!response.ok || !data.publicUrl) {
        setProfileNotice(data.error ?? "Impossible d'envoyer la photo.")
        return
      }

      setPublicAvatarUrl(data.publicUrl)
      setProfileNotice("Photo ajoutée. Cliquez sur sauvegarder pour valider le profil.")
    } catch {
      setProfileNotice("Erreur réseau pendant l'envoi de la photo.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""
    void uploadPublicAvatar(file)
  }

  const savePublicProfile = async () => {
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user
    if (!user) return

    setSavingProfile(true)
    setProfileNotice(null)

    const nextName = publicDisplayName.trim() || user.email?.split("@")[0] || "Membre Milele"
    const nextAvatar = publicAvatarUrl.trim()

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        display_name: nextName,
        avatar_url: nextAvatar.length > 0 ? nextAvatar : null,
        visibility: publicVisibility,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (error) {
      setProfileNotice("Erreur lors de la sauvegarde du profil public.")
    } else {
      setProfileName(nextName)
      setPublicDisplayName(nextName)
      setProfileNotice("Profil public mis à jour.")
    }

    setSavingProfile(false)
  }

  if (!dossier) return null

  const openEditDefunt = () => {
    setDraftDefunt({
      prenom: dossier.defunt.prenom ?? "",
      nom: dossier.defunt.nom ?? "",
      dateDeces: dossier.defunt.dateDeces ?? "",
      relation: dossier.defunt.relation ?? "",
    })
    setEditingDefunt(true)
  }

  const saveDefunt = () => {
    if (!draftDefunt.prenom.trim() || !draftDefunt.nom.trim() || !draftDefunt.dateDeces) return
    updateDefunt({
      prenom: draftDefunt.prenom.trim(),
      nom: draftDefunt.nom.trim(),
      dateDeces: draftDefunt.dateDeces,
      relation: draftDefunt.relation.trim() || dossier.defunt.relation,
    })
    setEditingDefunt(false)
  }

  const deleteDossier = () => {
    const ok = window.confirm("Supprimer ce dossier et repartir de zéro ? Cette action efface les données du dossier en cours.")
    if (!ok) return
    resetDossier()
  }

  const checklist = dossier.checklist
  const done48h = checklist.filter(c => c.phase === "48h" && c.done).length
  const total48h = checklist.filter(c => c.phase === "48h").length
  const done1s = checklist.filter(c => c.phase === "1semaine" && c.done).length
  const total1s = checklist.filter(c => c.phase === "1semaine").length
  const done1m = checklist.filter(c => c.phase === "1mois" && c.done).length
  const total1m = checklist.filter(c => c.phase === "1mois").length
  const totalDone = checklist.filter(c => c.done).length
  const totalAll = checklist.length
  const progress = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 0

  const nextTask = checklist.find(c => !c.done)

  const phases = [
    { label: "48 heures", done: done48h, total: total48h, color: "oklch(0.55 0.15 25)" },
    { label: "1 semaine", done: done1s, total: total1s, color: "oklch(0.55 0.12 80)" },
    { label: "1 mois", done: done1m, total: total1m, color: "var(--primary)" },
  ]

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      {/* Widget profil public (premier) */}
      <div
        className="rounded-2xl p-4 mb-6"
        style={{
          background: "var(--card)",
          border: "1px solid color-mix(in srgb, var(--primary) 14%, var(--border))",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{t("espace.profile.title")}</p>
            <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
              {t("espace.profile.desc")}
            </p>
          </div>
          <div
            className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center"
            style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
          >
            {publicAvatarUrl ? (
              <Image src={publicAvatarUrl} alt={publicDisplayName || profileName} width={48} height={48} sizes="48px" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                {(publicDisplayName.trim()[0] || profileName.trim()[0] || "M").toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.profile.displayname")}</label>
            <input
              value={publicDisplayName}
              onChange={(e) => setPublicDisplayName(e.target.value)}
              placeholder={t("espace.profile.displaynamePlaceholder")}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.profile.photo")}</label>
            <div className="grid grid-cols-1 gap-2">
              <label
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <Camera size={13} />
                {t("espace.profile.takePhoto")}
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              <label
                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <Upload size={13} />
                {t("espace.profile.chooseFile")}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
              <div className="relative">
                <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
                <input
                  value={publicAvatarUrl}
                  onChange={(e) => setPublicAvatarUrl(e.target.value)}
                  placeholder={t("espace.profile.urlPlaceholder")}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("espace.profile.visibility")}</span>
          <button
            onClick={() => setPublicVisibility("public")}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{
              background: publicVisibility === "public" ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--secondary)",
              color: publicVisibility === "public" ? "var(--primary)" : "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {t("common.public")}
          </button>
          <button
            onClick={() => setPublicVisibility("private")}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{
              background: publicVisibility === "private" ? "color-mix(in srgb, #b45309 14%, var(--card))" : "var(--secondary)",
              color: publicVisibility === "private" ? "#b45309" : "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {t("common.private")}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{profileNotice ?? ""}</span>
          <button
            onClick={savePublicProfile}
            disabled={savingProfile || uploadingAvatar}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Save size={13} />
            {uploadingAvatar ? t("espace.profile.uploading") : savingProfile ? t("common.saving") : t("common.saveAction")}
          </button>
        </div>
      </div>

      {/* En-tête */}
      <div className="mb-8">
        <p className="text-xs font-medium tracking-wider uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
          {t("espace.dashboard.folder")}
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <button
            onClick={openEditDefunt}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: "var(--secondary)", color: "var(--primary)", border: "1px solid var(--border)" }}
          >
            {t("espace.dashboard.editFolder")}
          </button>
          <button
            onClick={deleteDossier}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold"
            style={{ background: "color-mix(in srgb, #ef4444 12%, var(--secondary))", color: "#b91c1c", border: "1px solid color-mix(in srgb, #ef4444 35%, var(--border))" }}
          >
            {t("espace.dashboard.deleteFolder")}
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
          {dossier.defunt.prenom} {dossier.defunt.nom}
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          {t("espace.dashboard.deceasedOn")} {formatDate(dossier.defunt.dateDeces)}
        </p>
      </div>

      {/* Barre de progression globale */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", backdropFilter: "blur(12px)", border: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t("espace.dashboard.progress")}</span>
          <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>{progress}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "var(--secondary)" }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, background: "var(--primary)" }}
          />
        </div>
        <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>
          {totalDone} / {totalAll}
        </p>
      </div>

      {/* Phases */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {phases.map(phase => (
          <button
            key={phase.label}
            onClick={() => router.push("/espace/checklist")}
            className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} style={{ color: phase.color }} />
              <span className="text-xs font-semibold" style={{ color: phase.color }}>{phase.label}</span>
            </div>
            <p className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              {phase.done}/{phase.total}
            </p>
            <div className="h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: "var(--secondary)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${phase.total > 0 ? (phase.done / phase.total) * 100 : 0}%`, background: phase.color }}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Prochaine tâche */}
      {nextTask && (
        <button
          onClick={() => router.push("/espace/checklist")}
          className="w-full rounded-2xl p-5 text-left transition-all hover:scale-[1.005] active:scale-[0.995] mb-6"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            {t("espace.dashboard.nextTask")}
          </p>
          <div className="flex items-start gap-3">
            <CheckCircle2 size={20} style={{ color: "var(--primary)", marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{nextTask.label}</p>
              {nextTask.description && (
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{nextTask.description}</p>
              )}
            </div>
            <ChevronRight size={16} className="ml-auto mt-0.5" style={{ color: "var(--muted-foreground)" }} />
          </div>
        </button>
      )}

      {/* Bannière cloud si non connecté */}
      {isLoggedIn === false && (
        <Link
          href="/espace/membres"
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-6 transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{
            background: "color-mix(in srgb, var(--primary) 8%, var(--card))",
            border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
          }}
        >
          <CloudUpload size={18} style={{ color: "var(--primary)", flexShrink: 0 }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "var(--primary)" }}>{t("espace.dashboard.saveCloud")}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t("espace.dashboard.saveCloudDesc")}</p>
          </div>
          <ChevronRight size={14} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        </Link>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => router.push("/espace/documents")}
          className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <FileText size={20} style={{ color: "var(--primary)", marginBottom: 8 }} />
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Documents</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {dossier.documents.length} fichier{dossier.documents.length !== 1 ? "s" : ""}
          </p>
        </button>
        <button
          onClick={() => router.push(`/espace/contacts?import=1&t=${Date.now()}`)}
          className="rounded-2xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.99]"
          style={{ background: "var(--card)", border: "1px solid var(--border)" }}
        >
          <Users size={20} style={{ color: "var(--primary)", marginBottom: 8 }} />
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Contacts</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {dossier.contacts.length} personne{dossier.contacts.length !== 1 ? "s" : ""}
          </p>
        </button>
      </div>

      {editingDefunt && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setEditingDefunt(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl p-4"
            style={{ background: "var(--background)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--foreground)" }}>{t("espace.dashboard.editFolder")}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <input value={draftDefunt.prenom} onChange={(e) => setDraftDefunt((p) => ({ ...p, prenom: e.target.value }))} placeholder={t("espace.form.firstname")} className="px-3 py-2 rounded-xl text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <input value={draftDefunt.nom} onChange={(e) => setDraftDefunt((p) => ({ ...p, nom: e.target.value }))} placeholder={t("espace.form.lastname")} className="px-3 py-2 rounded-xl text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <input type="date" value={draftDefunt.dateDeces} onChange={(e) => setDraftDefunt((p) => ({ ...p, dateDeces: e.target.value }))} className="px-3 py-2 rounded-xl text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <input value={draftDefunt.relation} onChange={(e) => setDraftDefunt((p) => ({ ...p, relation: e.target.value }))} placeholder={t("espace.form.relation")} className="px-3 py-2 rounded-xl text-sm" style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingDefunt(false)} className="px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--secondary)", color: "var(--muted-foreground)" }}>{t("common.cancel")}</button>
              <button onClick={saveDefunt} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>{t("common.save")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyDashboard() {
  const router = useRouter()
  const { t } = useLocale()

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <div
        className="rounded-2xl p-6 sm:p-8"
        style={{
          background: "color-mix(in srgb, var(--card) 84%, transparent)",
          border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
          backdropFilter: "blur(14px)",
        }}
      >
        <p className="text-xs font-semibold tracking-wider uppercase mb-2" style={{ color: "var(--muted-foreground)" }}>
          {t("espace.dashboard")}
        </p>
        <h1 className="text-xl sm:text-2xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
          {t("espace.empty.title")}
        </h1>
        <p className="text-sm mb-5" style={{ color: "var(--muted-foreground)" }}>
          {t("espace.empty.desc")}
        </p>
        <LiquidMetalButton
          label={t("espace.cta.create")}
          width={220}
          height={46}
          fontSize={13}
          tinted
          onClick={() => router.push("/espace")}
        />
      </div>
    </div>
  )
}

/* ═══ Page principale /espace ═══ */
export default function EspacePage() {
  const { hasDossier } = useDossier()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [entryChecked, setEntryChecked] = useState(false)
  const forceDashboard = searchParams.get("dashboard") === "1"

  useEffect(() => {
    if (forceDashboard) return

    let cancelled = false

    async function checkFirstAccess() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user

      if (!user) {
        if (!cancelled) setEntryChecked(true)
        return
      }

      const firstAccessKey = `milele:first-access:${user.id}`
      const alreadySeen = window.localStorage.getItem(firstAccessKey) === "1"

      if (alreadySeen) {
        if (!cancelled) setEntryChecked(true)
        return
      }

      window.localStorage.setItem(firstAccessKey, "1")
      if (!cancelled) setEntryChecked(true)
    }

    void checkFirstAccess()

    return () => {
      cancelled = true
    }
  }, [router, forceDashboard])

  if (forceDashboard) {
    return hasDossier ? <Dashboard /> : <EmptyDashboard />
  }

  if (!entryChecked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
        />
      </div>
    )
  }

  return hasDossier ? <Dashboard /> : <CreationFlow />
}
