"use client"

import Image from "next/image"
import { useState, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Save, Camera, Upload, AlertCircle, ArrowLeft, Settings, Shield, Globe, Users, Lock, MessageCircle, MessageSquareOff, Download, Baby, Pencil } from "lucide-react"
import { PushNotificationToggle } from "@/components/PushNotificationToggle"

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

type SubAccountType = "child" | "pet"
type SubAccount = {
  id: string
  owner_user_id: string
  account_type: SubAccountType
  display_name: string
  visibility: "public" | "private"
  allow_minor_publish: boolean
  allow_minor_comment: boolean
  created_at: string
}
type SubAccountMeta = Record<string, { avatar_url?: string | null }>
function subAccountTypeLabel(v: SubAccountType) { return v === "child" ? "Enfant" : "Animal" }

export default function ParametresProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [accessToken, setAccessToken] = useState("")
  const [loading, setLoading] = useState(true)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  // Confidentialité
  type Audience = "public" | "circle" | "private"
  type CommentPolicy = "everyone" | "circle" | "nobody"
  interface PrivacyPrefs { default_audience: Audience; default_comment_policy: CommentPolicy; show_in_member_directory: boolean }
  const DEFAULT_PREFS: PrivacyPrefs = { default_audience: "public", default_comment_policy: "everyone", show_in_member_directory: true }
  const [prefs, setPrefs] = useState<PrivacyPrefs>(DEFAULT_PREFS)
  const [privacyPrefsRaw, setPrivacyPrefsRaw] = useState<Record<string, unknown>>({})
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [savedPrivacy, setSavedPrivacy] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Sous-comptes
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [subAccountsEnabled, setSubAccountsEnabled] = useState(true)
  const [subAccountNotice, setSubAccountNotice] = useState<string | null>(null)
  const [newSubAccountName, setNewSubAccountName] = useState("")
  const [newSubAccountType, setNewSubAccountType] = useState<SubAccountType>("child")
  const [creatingSubAccount, setCreatingSubAccount] = useState(false)
  const [subAccountMeta, setSubAccountMeta] = useState<SubAccountMeta>({})
  const [editingSubAccount, setEditingSubAccount] = useState<SubAccount | null>(null)
  const [editingName, setEditingName] = useState("")
  const [editingAvatarUrl, setEditingAvatarUrl] = useState("")
  const [savingSubAccountEdit, setSavingSubAccountEdit] = useState(false)
  const [uploadingSubAvatar, setUploadingSubAvatar] = useState(false)

  // Auth
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" })
        setAccessToken(session.access_token)
      } else {
        router.push("/espace")
      }
      setLoading(false)
    })()
  }, [router])

  // Charger le profil
  useEffect(() => {
    if (!user) return
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, bio, created_at, privacy_prefs")
        .eq("id", user.id)
        .maybeSingle()

      const p = data as (UserProfile & { privacy_prefs?: Partial<PrivacyPrefs> }) | null
      if (p) {
        setProfile(p)
        setDisplayName(p.display_name ?? user.email.split("@")[0] ?? "")
        setBio(p.bio ?? "")
        setAvatarUrl(p.avatar_url ?? "")
        if (p.privacy_prefs && typeof p.privacy_prefs === "object") {
          const rawPrefs = p.privacy_prefs as Record<string, unknown>
          setPrivacyPrefsRaw(rawPrefs)
          setPrefs(prev => ({
            ...prev,
            ...(rawPrefs as Partial<PrivacyPrefs>),
          }))
          const maybeSubMeta = rawPrefs.sub_account_meta
          if (maybeSubMeta && typeof maybeSubMeta === "object") {
            setSubAccountMeta(maybeSubMeta as SubAccountMeta)
          }
        }
      } else {
        setProfile({
          id: user.id,
          email: user.email,
          display_name: user.email.split("@")[0] ?? "",
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
        })
        setDisplayName(user.email.split("@")[0] ?? "")
      }
    })()
  }, [user])

  // Charger les sous-comptes
  useEffect(() => {
    if (!user) return
    void (async () => {
      const { data, error } = await supabase
        .from("sub_accounts")
        .select("id, owner_user_id, account_type, display_name, visibility, allow_minor_publish, allow_minor_comment, created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
      if (error) {
        if ((error as { code?: string }).code === "42P01") {
          setSubAccountsEnabled(false)
          return
        }
        setSubAccountNotice("Impossible de charger les sous-comptes.")
        return
      }
      setSubAccountsEnabled(true)
      setSubAccounts((data as SubAccount[]) ?? [])
    })()
  }, [user])

  const createSubAccount = async () => {
    if (!user || !newSubAccountName.trim()) {
      setSubAccountNotice("Le nom est requis.")
      return
    }
    setCreatingSubAccount(true)
    setSubAccountNotice(null)
    const { data, error } = await supabase
      .from("sub_accounts")
      .insert({ owner_user_id: user.id, account_type: newSubAccountType, display_name: newSubAccountName.trim(), visibility: "public", allow_minor_publish: false, allow_minor_comment: true })
      .select()
      .single()
    if (error) {
      setSubAccountNotice("Erreur lors de la création.")
    } else {
      setSubAccounts((prev) => [data as SubAccount, ...prev])
      setNewSubAccountName("")
      setNewSubAccountType("child")
      setSubAccountNotice("Sous-compte créé.")
    }
    setCreatingSubAccount(false)
  }

  const updateSubAccountRights = async (subAccountId: string, patch: Partial<Pick<SubAccount, "allow_minor_publish" | "allow_minor_comment" | "visibility">>) => {
    if (!user) {
      setSubAccountNotice("Session invalide. Reconnectez-vous.")
      return
    }

    const { data, error } = await supabase
      .from("sub_accounts")
      .update(patch)
      .eq("id", subAccountId)
      .eq("owner_user_id", user.id)
      .select("id")
      .maybeSingle()

    if (error || !data) {
      setSubAccountNotice("Erreur lors de la mise à jour.")
      return
    }

    setSubAccounts((prev) => prev.map((item) => (item.id === subAccountId ? { ...item, ...patch } : item)))
  }

  const persistSubAccountMeta = async (nextMeta: SubAccountMeta) => {
    if (!user || !accessToken) return new Error("Session invalide")
    const payload = {
      ...privacyPrefsRaw,
      ...prefs,
      sub_account_meta: nextMeta,
    }
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ privacy_prefs: payload }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) {
        return new Error(data.error ?? "Erreur serveur")
      }
      setPrivacyPrefsRaw(payload)
      setSubAccountMeta(nextMeta)
      return null
    } catch {
      return new Error("Erreur réseau")
    }
  }

  const persistSubAccountName = async (subAccountId: string, displayName: string) => {
    if (!accessToken) return new Error("Session invalide")
    try {
      const response = await fetch("/api/profile/sub-account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ subAccountId, displayName }),
      })
      const data = await response.json() as { error?: string }
      if (!response.ok) {
        return new Error(data.error ?? "Erreur serveur")
      }
      return null
    } catch {
      return new Error("Erreur reseau")
    }
  }

  const openSubAccountEditor = (account: SubAccount) => {
    setEditingSubAccount(account)
    setEditingName(account.display_name)
    setEditingAvatarUrl(subAccountMeta[account.id]?.avatar_url ?? "")
    setSubAccountNotice(null)
  }

  const handleSubAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""
    void (async () => {
      if (!accessToken) {
        setSubAccountNotice("Session invalide. Reconnectez-vous.")
        return
      }
      setUploadingSubAvatar(true)
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
          setSubAccountNotice(data.error ?? "Impossible d'envoyer la photo du sous-profil.")
          return
        }
        setEditingAvatarUrl(data.publicUrl)
        setSubAccountNotice("Photo du sous-profil chargée.")
      } catch {
        setSubAccountNotice("Erreur réseau pendant l'envoi de la photo du sous-profil.")
      } finally {
        setUploadingSubAvatar(false)
      }
    })()
  }

  const saveSubAccountEdit = async () => {
    if (!editingSubAccount || !user) {
      setSubAccountNotice("Session invalide. Reconnectez-vous.")
      return
    }

    const nextName = editingName.trim()
    if (!nextName) {
      setSubAccountNotice("Le nom du sous-profil est requis.")
      return
    }

    const currentName = editingSubAccount.display_name
    const currentAvatar = (subAccountMeta[editingSubAccount.id]?.avatar_url ?? "").trim()
    const nextAvatar = editingAvatarUrl.trim()
    const hasNameChange = nextName !== currentName
    const hasAvatarChange = nextAvatar !== currentAvatar

    if (!hasNameChange && !hasAvatarChange) {
      setSubAccountNotice("Aucune modification à enregistrer.")
      return
    }

    setSavingSubAccountEdit(true)
    setSubAccountNotice(null)

    if (hasNameChange) {
      const nameError = await persistSubAccountName(editingSubAccount.id, nextName)
      if (nameError) {
        setSubAccountNotice(`Erreur lors de la mise a jour du sous-profil: ${nameError.message}`)
        setSavingSubAccountEdit(false)
        return
      }
    }

    if (hasAvatarChange) {
      const nextMeta: SubAccountMeta = {
        ...subAccountMeta,
        [editingSubAccount.id]: {
          avatar_url: nextAvatar || null,
        },
      }

      const metaError = await persistSubAccountMeta(nextMeta)
      if (metaError) {
        if (hasNameChange) {
          setSubAccounts((prev) => prev.map((item) => (item.id === editingSubAccount.id ? { ...item, display_name: nextName } : item)))
          setEditingSubAccount((prev) => (prev ? { ...prev, display_name: nextName } : prev))
        }
        setSubAccountNotice("Nom sauvegardé, mais impossible d'enregistrer la photo du sous-profil.")
        setSavingSubAccountEdit(false)
        return
      }
    }

    if (hasNameChange) {
      setSubAccounts((prev) => prev.map((item) => (item.id === editingSubAccount.id ? { ...item, display_name: nextName } : item)))
    }
    setEditingSubAccount(null)
    setSubAccountNotice("Sous-profil mis à jour.")
    setSavingSubAccountEdit(false)
  }

  const uploadAvatar = async (file: File) => {
    if (!accessToken) {
      setNotice("Session invalide. Reconnectez-vous.")
      return
    }
    setUploadingAvatar(true)
    setNotice(null)
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
        setNotice(data.error ?? "Impossible d'envoyer la photo.")
        return
      }
      setAvatarUrl(data.publicUrl)
      setNotice("Photo mise à jour.")
    } catch {
      setNotice("Erreur réseau pendant l'envoi de la photo.")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""
    void uploadAvatar(file)
  }

  const saveProfile = async () => {
    if (!user || !accessToken) {
      setNotice("Session invalide. Reconnectez-vous.")
      return
    }
    setSavingProfile(true)
    setNotice(null)
    const nextName = displayName.trim() || user.email.split("@")[0] || "Membre"
    const nextAvatar = avatarUrl.trim()
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          displayName: nextName,
          avatarUrl: nextAvatar.length > 0 ? nextAvatar : null,
          bio: bio.trim().length > 0 ? bio : null,
        }),
      })
      const data = await response.json() as { error?: string; profile?: UserProfile }
      if (!response.ok) {
        setNotice(data.error ?? "Erreur lors de la sauvegarde du profil.")
      } else {
        if (data.profile) {
          setProfile(data.profile)
          setDisplayName(data.profile.display_name ?? nextName)
          setBio(data.profile.bio ?? "")
          setAvatarUrl(data.profile.avatar_url ?? "")
        }
        setNotice("Profil mis à jour avec succès.")
      }
    } catch {
      setNotice("Erreur réseau lors de la sauvegarde du profil.")
    }
    setSavingProfile(false)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-8 max-w-2xl mx-auto min-h-[80vh] flex items-center justify-center">
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Chargement…</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="p-4 sm:p-8 max-w-2xl mx-auto pb-24">
      {/* En-tête */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/espace/profil")}
          className="inline-flex items-center gap-2 text-sm mb-4 transition-opacity hover:opacity-70"
          style={{ color: "var(--muted-foreground)" }}
        >
          <ArrowLeft size={16} />
          Retour au profil
        </button>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--primary) 14%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))" }}
          >
            <Settings size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold" style={{ color: "var(--foreground)" }}>
              Paramètres du profil
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Modifiez votre nom, votre bio et votre photo de profil
            </p>
          </div>
        </div>
      </div>

      {/* Carte édition */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--card)",
          border: "1px solid color-mix(in srgb, var(--primary) 14%, var(--border))",
        }}
      >
        <div className="flex items-start gap-6 mb-6 flex-wrap">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center"
              style={{ background: "var(--secondary)", border: "2px solid var(--border)" }}
            >
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={112} height={112} className="w-full h-full object-cover" unoptimized />
              ) : (
                <span className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
                  {(displayName.trim()[0] || "M").toUpperCase()}
                </span>
              )}
            </div>
            {uploadingAvatar && (
              <p className="text-xs" style={{ color: "var(--primary)" }}>Envoi en cours…</p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <label
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <Camera size={13} />
                Photo
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
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <Upload size={13} />
                Fichier
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
          </div>

          {/* Informations */}
          <div className="flex-1 min-w-[240px]">
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                Nom public
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Parlez de vous… (max 180 caractères)"
                maxLength={180}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                {bio.length}/180
              </p>
            </div>

            <div className="rounded-xl p-3" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>
                Profil public
              </p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Votre identité reste visible de tous. La confidentialité se gère publication par publication.
              </p>
            </div>
          </div>
        </div>

        {/* Notices et bouton sauvegarde */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          {notice ? (
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: notice.includes("Erreur") || notice.includes("invalide") || notice.includes("Impossible") ? "#dc2626" : "var(--primary)" }}
            >
              <AlertCircle size={14} />
              {notice}
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={saveProfile}
            disabled={savingProfile || uploadingAvatar}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Save size={15} />
            {uploadingAvatar ? "Upload…" : savingProfile ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Email (lecture seule) */}
      <div
        className="rounded-2xl p-5 mt-4"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>
          Adresse e-mail
        </p>
        <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
          {profile?.email ?? user.email}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
          L'e-mail ne peut pas être modifié depuis cette page.
        </p>
      </div>

      {/* Confidentialité */}
      <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={16} style={{ color: "var(--primary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Confidentialité par défaut</h2>
        </div>

        <div className="mb-5">
          <p className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>Audience par défaut des nouvelles publications</p>
          <div className="flex gap-2">
            {(["public", "circle", "private"] as Audience[]).map((v) => {
              const meta = { public: { label: "Public", icon: Globe, color: "#10B981" }, circle: { label: "Cercle", icon: Users, color: "#3B82F6" }, private: { label: "Moi seul", icon: Lock, color: "#8B5CF6" } }[v]
              const Icon = meta.icon
              return (
                <button key={v} onClick={() => setPrefs(p => ({ ...p, default_audience: v }))}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: prefs.default_audience === v ? `color-mix(in srgb, ${meta.color} 14%, var(--card))` : "var(--secondary)",
                    border: `1px solid ${prefs.default_audience === v ? meta.color : "var(--border)"}`,
                    color: prefs.default_audience === v ? meta.color : "var(--muted-foreground)",
                  }}>
                  <Icon size={15} />{meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-5">
          <p className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>Commentaires par défaut</p>
          <div className="flex gap-2">
            {(["everyone", "circle", "nobody"] as CommentPolicy[]).map((v) => {
              const meta = { everyone: { label: "Tout le monde", icon: MessageCircle, color: "#10B981" }, circle: { label: "Cercle", icon: Users, color: "#3B82F6" }, nobody: { label: "Désactivés", icon: MessageSquareOff, color: "#EF4444" } }[v]
              const Icon = meta.icon
              return (
                <button key={v} onClick={() => setPrefs(p => ({ ...p, default_comment_policy: v }))}
                  className="flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: prefs.default_comment_policy === v ? `color-mix(in srgb, ${meta.color} 14%, var(--card))` : "var(--secondary)",
                    border: `1px solid ${prefs.default_comment_policy === v ? meta.color : "var(--border)"}`,
                    color: prefs.default_comment_policy === v ? meta.color : "var(--muted-foreground)",
                  }}>
                  <Icon size={15} />{meta.label}
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between py-3 px-4 rounded-xl mb-5" style={{ background: "var(--secondary)" }}>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Annuaire membres</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Les autres membres peuvent te trouver par ton nom</p>
          </div>
          <button onClick={() => setPrefs(p => ({ ...p, show_in_member_directory: !p.show_in_member_directory }))}
            className="w-12 h-6 rounded-full transition-all flex-shrink-0 relative"
            style={{ background: prefs.show_in_member_directory ? "var(--primary)" : "var(--border)" }}>
            <span className="absolute top-0.5 w-5 h-5 rounded-full shadow-md transition-all"
              style={{ left: prefs.show_in_member_directory ? "calc(100% - 22px)" : "2px", background: "var(--background)", boxShadow: "0 1px 4px rgba(0,0,0,0.25)" }} />
          </button>
        </div>

        <div className="flex justify-end">
          <button onClick={async () => {
            if (!user) return
            setSavingPrivacy(true)
            const nextPrefs = {
              ...privacyPrefsRaw,
              ...prefs,
              sub_account_meta: subAccountMeta,
            }
            await supabase.from("profiles").update({ privacy_prefs: nextPrefs }).eq("id", user.id)
            setPrivacyPrefsRaw(nextPrefs)
            setSavingPrivacy(false); setSavedPrivacy(true); setTimeout(() => setSavedPrivacy(false), 2500)
          }} disabled={savingPrivacy}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
            <Save size={15} />
            {savedPrivacy ? "Sauvegardé ✓" : savingPrivacy ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      </div>

      {/* Sous-comptes */}
      <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <Baby size={16} style={{ color: "var(--primary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Sous-comptes (enfant / animal)</h2>
          <span className="ml-auto text-[11px] px-2 py-1 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
            {subAccounts.length} actif{subAccounts.length > 1 ? "s" : ""}
          </span>
        </div>

        {subAccountsEnabled ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-2 mb-4">
              <input
                value={newSubAccountName}
                onChange={(e) => setNewSubAccountName(e.target.value)}
                placeholder="Nom du sous-compte"
                className="px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
              <select
                value={newSubAccountType}
                onChange={(e) => setNewSubAccountType(e.target.value as SubAccountType)}
                className="px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <option value="child">Enfant</option>
                <option value="pet">Animal</option>
              </select>
              <button
                onClick={createSubAccount}
                disabled={creatingSubAccount}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {creatingSubAccount ? "Création…" : "Ajouter"}
              </button>
            </div>

            <div className="space-y-2">
              {subAccounts.map((account) => (
                <div key={account.id} className="rounded-xl p-3" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                        {subAccountMeta[account.id]?.avatar_url ? (
                          <Image src={subAccountMeta[account.id]?.avatar_url ?? ""} alt={account.display_name} width={32} height={32} className="w-full h-full object-cover" unoptimized />
                        ) : (
                          <span className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                            {(account.display_name.trim()[0] || "S").toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{account.display_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--primary)" }}>
                        {subAccountTypeLabel(account.account_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={account.visibility}
                        onChange={(e) => void updateSubAccountRights(account.id, { visibility: e.target.value as "public" | "private" })}
                        className="px-2 py-1.5 rounded-lg text-xs"
                        style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                      >
                        <option value="public">Public</option>
                        <option value="private">Privé</option>
                      </select>
                      <button
                        onClick={() => openSubAccountEditor(account)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold"
                        style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                      >
                        <Pencil size={12} /> Modifier
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => void updateSubAccountRights(account.id, { allow_minor_publish: !account.allow_minor_publish })}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: account.allow_minor_publish ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--secondary)",
                        color: account.allow_minor_publish ? "var(--primary)" : "var(--muted-foreground)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Publication mineur: {account.allow_minor_publish ? "autorisée" : "bloquée"}
                    </button>
                    <button
                      onClick={() => void updateSubAccountRights(account.id, { allow_minor_comment: !account.allow_minor_comment })}
                      className="px-2 py-1.5 rounded-lg text-xs font-semibold"
                      style={{
                        background: account.allow_minor_comment ? "color-mix(in srgb, var(--primary) 14%, var(--card))" : "var(--secondary)",
                        color: account.allow_minor_comment ? "var(--primary)" : "var(--muted-foreground)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      Commentaires mineur: {account.allow_minor_comment ? "autorisés" : "bloqués"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Module sous-comptes indisponible pour l&apos;instant. Lancez le script SQL d&apos;initialisation pour l&apos;activer.
          </p>
        )}

        {subAccountNotice && (
          <p className="text-xs mt-3" style={{ color: subAccountNotice.includes("Erreur") ? "#dc2626" : "var(--muted-foreground)" }}>
            {subAccountNotice}
          </p>
        )}
      </div>

      {editingSubAccount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setEditingSubAccount(null)}>
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md rounded-2xl p-5"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold mb-4" style={{ color: "var(--foreground)" }}>
              Modifier le sous-profil
            </h3>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                {editingAvatarUrl ? (
                  <Image src={editingAvatarUrl} alt={editingName || "Sous-profil"} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span className="text-xl font-bold" style={{ color: "var(--primary)" }}>
                    {(editingName.trim()[0] || "S").toUpperCase()}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                <label
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <Camera size={12} /> Photo
                  <input type="file" accept="image/*" capture="environment" onChange={handleSubAvatarFileChange} className="hidden" disabled={uploadingSubAvatar} />
                </label>
                <label
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  style={{ background: "var(--secondary)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <Upload size={12} /> Fichier
                  <input type="file" accept="image/*" onChange={handleSubAvatarFileChange} className="hidden" disabled={uploadingSubAvatar} />
                </label>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Nom du sous-profil</label>
              <input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>

            {subAccountNotice && (
              <p
                className="text-xs mb-3"
                style={{ color: subAccountNotice.includes("Erreur") || subAccountNotice.includes("impossible") ? "#dc2626" : "var(--muted-foreground)" }}
              >
                {subAccountNotice}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setEditingSubAccount(null)}
                className="px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}
              >
                Annuler
              </button>
              <button
                onClick={() => void saveSubAccountEdit()}
                disabled={savingSubAccountEdit || uploadingSubAvatar}
                className="px-3 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                {uploadingSubAvatar ? "Upload…" : savingSubAccountEdit ? "Sauvegarde…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export données */}
      <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Download size={16} style={{ color: "var(--primary)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Exporter mes données</h2>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
          Télécharge une copie de ton profil, tes publications et tes connexions au format JSON.
        </p>
        <button onClick={async () => {
          if (!user) return
          setExporting(true)
          try {
            const [{ data: profile }, { data: pubs }, { data: conns }] = await Promise.all([
              supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
              supabase.from("publications").select("*").eq("user_id", user.id).order("created_at"),
              supabase.from("connections").select("*").or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`),
            ])
            const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), profile, publications: pubs ?? [], connections: conns ?? [] }, null, 2)], { type: "application/json" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a"); a.href = url; a.download = `milele-export-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url)
          } finally { setExporting(false) }
        }} disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
          style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
          <Download size={15} />
          {exporting ? "Préparation…" : "Télécharger mes données (.json)"}
        </button>
      </div>

      {/* Notifications push */}
      <div className="rounded-2xl p-5 mt-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-semibold" style={{ color: "var(--foreground)" }}>Notifications</span>
        </div>
        <PushNotificationToggle />
      </div>
    </div>
  )
}
