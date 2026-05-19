"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { Shield, ShieldBan, ShieldCheck, Trash2, Search, Users, RefreshCw, Clock3, MailCheck } from "lucide-react"
import { ALL_ROLES } from "@/lib/roles"

interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  role_id?: string | null
  role_name: string | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  email_confirmed_at: string | null
  last_sign_in_at: string | null
  provider: string | null
  is_disabled: boolean
  banned_until: string | null
  is_restricted: boolean
  restricted_reason: string | null
  is_kent: boolean
  account_section: "staff" | "public"
}

interface AuditLogItem {
  id: string
  action: string
  target_user_id: string
  target_email: string | null
  target_role_name?: string | null
  reason?: string | null
  actor_user_id: string
  created_at: string
}

const ROLE_OPTIONS = ALL_ROLES.filter((role) => role.id !== "admin-supreme")

function actionLabel(action: string) {
  switch (action) {
    case "disable":
      return "Desactivation"
    case "enable":
      return "Reactivation"
    case "restrict":
      return "Restriction"
    case "unrestrict":
      return "Fin de restriction"
    case "change_role":
      return "Changement de role"
    case "approve":
      return "Approbation"
    case "reject":
      return "Refus"
    case "delete":
      return "Suppression"
    case "reset_password":
      return "Reinitialisation mot de passe"
    case "wipe_content":
      return "Remise a zero compte"
    case "suspend_staff":
      return "Suspension staff"
    case "reactivate_staff":
      return "Reactivation staff"
    default:
      return action
  }
}

function formatDate(value: string | null) {
  if (!value) return "Jamais"
  return new Date(value).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

function statusLabel(status: string | null) {
  switch (status) {
    case "approved":
      return "Approuve"
    case "pending_approval":
      return "En attente"
    case "pending_role":
      return "Sans role"
    case "rejected":
      return "Refuse"
    case "suspended":
      return "Suspendu"
    default:
      return "Hors portail"
  }
}

export default function AdminUserManagement() {
  type ActivityFilter = "all" | "active" | "inactive" | "restricted"
  type StatsFilter = "all" | "staff" | "public" | "active" | "disabled" | "restricted" | "staffSuspended" | "recent7d" | "neverLogged"

  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [auditSearch, setAuditSearch] = useState("")
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({})
  const [staffFilter, setStaffFilter] = useState<ActivityFilter>("all")
  const [publicFilter, setPublicFilter] = useState<ActivityFilter>("all")
  const [temporaryPasswordInfo, setTemporaryPasswordInfo] = useState<{ email: string; password: string } | null>(null)
  const [statsFilter, setStatsFilter] = useState<StatsFilter>("all")
  const [emailProviderConfigured, setEmailProviderConfigured] = useState<boolean | null>(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Session admin introuvable.")
      setLoading(false)
      return
    }

    const response = await fetch("/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    const result = await response.json().catch(() => ({})) as { error?: string; users?: AdminUser[]; auditLogs?: AuditLogItem[]; emailProviderConfigured?: boolean }
    if (!response.ok) {
      setError(result.error ?? "Chargement impossible")
      setLoading(false)
      return
    }

    setUsers(result.users ?? [])
    setAuditLogs(result.auditLogs ?? [])
    setEmailProviderConfigured(typeof result.emailProviderConfigured === "boolean" ? result.emailProviderConfigured : null)
    setRoleDrafts(Object.fromEntries((result.users ?? []).map((user) => [user.id, user.role_id ?? ""])))
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    const channel = supabase
      .channel("admin-users-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, () => {
        void fetchUsers()
      })
      .subscribe()

    const interval = window.setInterval(() => {
      void fetchUsers()
    }, 30000)

    return () => {
      window.clearInterval(interval)
      void supabase.removeChannel(channel)
    }
  }, [fetchUsers])

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return users

    return users.filter((user) =>
      [user.full_name, user.email, user.role_name, user.status, user.provider]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    )
  }, [search, users])

  const filteredAuditLogs = useMemo(() => {
    const needle = auditSearch.trim().toLowerCase()
    if (!needle) return auditLogs
    return auditLogs.filter((entry) =>
      [
        actionLabel(entry.action),
        entry.target_email,
        entry.target_user_id,
        entry.target_role_name,
        entry.reason,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle))
    )
  }, [auditLogs, auditSearch])

  function exportAuditLogs() {
    const blob = new Blob([JSON.stringify(filteredAuditLogs, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `aeternum-admin-audit-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function runAction(action: "disable" | "enable" | "restrict" | "unrestrict" | "delete" | "change_role" | "approve" | "reject" | "reset_password" | "wipe_content" | "suspend_staff" | "reactivate_staff", user: AdminUser) {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData.session?.access_token
    if (!token) {
      setError("Session admin introuvable.")
      return
    }

    let reason: string | null = null
    if (action === "restrict") {
      reason = window.prompt("Motif de restriction (optionnel)", user.restricted_reason ?? "")?.trim() ?? null
    }

    const roleId = action === "change_role" ? (roleDrafts[user.id] ?? "").trim() : null
    if (action === "change_role" && !roleId) {
      setError("Choisis d'abord un role.")
      return
    }

    const confirmMessage = {
      disable: `Desactiver ${user.email} ?`,
      enable: `Reactiver ${user.email} ?`,
      restrict: `Restreindre ${user.email} ?`,
      unrestrict: `Retirer la restriction de ${user.email} ?`,
      suspend_staff: `Suspendre le compte staff ${user.email} ?`,
      reactivate_staff: `Reactiver le compte staff ${user.email} ?`,
      change_role: `Changer le role de ${user.email} ?`,
      approve: `Approuver ${user.email} pour l'accès staff ?`,
      reject: `Refuser ${user.email} ?`,
      reset_password: `Generer un mot de passe temporaire pour ${user.email} ?`,
      wipe_content: `Effacer tout le contenu de ${user.email} (dossiers, connexions, tickets) ?`,
      delete: `Supprimer definitivement ${user.email} ? Cette action est irreversible.`,
    }[action]

    if (!window.confirm(confirmMessage)) return

    setActionLoading(`${user.id}:${action}`)
    setError(null)
    setMessage(null)

    const response = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId: user.id, action, reason, roleId }),
    })

    const result = await response.json().catch(() => ({})) as { error?: string; temporaryPassword?: string; emailDelivery?: "sent" | "fallback" }
    if (!response.ok) {
      setError(result.error ?? "Action impossible")
    } else {
      if (action === "reset_password" && result.temporaryPassword) {
        setTemporaryPasswordInfo({
          email: user.email ?? "Utilisateur",
          password: result.temporaryPassword,
        })
        setMessage(result.emailDelivery === "sent"
          ? "Mot de passe temporaire genere et envoye automatiquement."
          : "Mot de passe temporaire genere. Envoi auto indisponible, communique-le manuellement.")
      } else {
        setMessage("Action admin appliquee.")
      }
      await fetchUsers()
    }

    setActionLoading(null)
  }

  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  const stats = {
    total: users.length,
    active: users.filter((user) => !user.is_disabled && !user.is_restricted).length,
    disabled: users.filter((user) => user.is_disabled).length,
    restricted: users.filter((user) => user.is_restricted).length,
    staff: users.filter((user) => user.account_section === "staff").length,
    staffSuspended: users.filter((user) => user.account_section === "staff" && user.status === "suspended").length,
    public: users.filter((user) => user.account_section === "public").length,
    recent7d: users.filter((user) => user.last_sign_in_at && (now - new Date(user.last_sign_in_at).getTime()) <= sevenDaysMs).length,
    neverLogged: users.filter((user) => !user.last_sign_in_at).length,
  }

  function applyStatsFilter(list: AdminUser[], filter: StatsFilter) {
    switch (filter) {
      case "staff":
        return list.filter((user) => user.account_section === "staff")
      case "public":
        return list.filter((user) => user.account_section === "public")
      case "active":
        return list.filter((user) => !user.is_disabled && !user.is_restricted)
      case "disabled":
        return list.filter((user) => user.is_disabled)
      case "restricted":
        return list.filter((user) => user.is_restricted)
      case "staffSuspended":
        return list.filter((user) => user.account_section === "staff" && user.status === "suspended")
      case "recent7d":
        return list.filter((user) => user.last_sign_in_at && (now - new Date(user.last_sign_in_at).getTime()) <= sevenDaysMs)
      case "neverLogged":
        return list.filter((user) => !user.last_sign_in_at)
      default:
        return list
    }
  }

  function statsFilterLabel(filter: StatsFilter) {
    switch (filter) {
      case "staff": return "Staff"
      case "public": return "Public"
      case "active": return "Actifs"
      case "disabled": return "Desactives"
      case "restricted": return "Restreints"
      case "staffSuspended": return "Staff suspendus"
      case "recent7d": return "Connexions 7j"
      case "neverLogged": return "Jamais connectes"
      default: return "Tous les comptes"
    }
  }

  const scopedUsers = applyStatsFilter(filteredUsers, statsFilter)
  const staffUsers = scopedUsers.filter((user) => user.account_section === "staff")
  const publicUsers = scopedUsers.filter((user) => user.account_section === "public")

  function applyActivityFilter(list: AdminUser[], filter: ActivityFilter) {
    switch (filter) {
      case "active":
        return list.filter((user) => !user.is_disabled)
      case "inactive":
        return list.filter((user) => user.is_disabled)
      case "restricted":
        return list.filter((user) => user.is_restricted)
      default:
        return list
    }
  }

  const displayedStaffUsers = applyActivityFilter(staffUsers, staffFilter)
  const displayedPublicUsers = applyActivityFilter(publicUsers, publicFilter)

  const grouped = {
    staffActive: displayedStaffUsers.filter((user) => !user.is_disabled),
    staffInactive: displayedStaffUsers.filter((user) => user.is_disabled),
    publicActive: displayedPublicUsers.filter((user) => !user.is_disabled),
    publicInactive: displayedPublicUsers.filter((user) => user.is_disabled),
  }

  function renderUsersTable(title: string, list: AdminUser[]) {
    if (list.length === 0) {
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/35 text-center">
          Aucun compte dans cette section.
        </div>
      )
    }

    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">{title} · {list.length}</h3>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 uppercase tracking-[0.18em] text-[11px]">
                <th className="text-left py-3 px-4">Utilisateur</th>
                <th className="text-left py-3 pr-4">Portail</th>
                <th className="text-left py-3 pr-4">Role admin</th>
                <th className="text-left py-3 pr-4">Confirmation</th>
                <th className="text-left py-3 pr-4">Connexion</th>
                <th className="text-left py-3 pr-4">Etat</th>
                <th className="text-left py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {list.map((user) => {
                const loadingPrefix = `${user.id}:`
                const busy = actionLoading?.startsWith(loadingPrefix)
                return (
                  <tr key={user.id} className="align-top hover:bg-white/[0.03] transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-white flex items-center gap-2">
                        <span>{user.full_name ?? user.email ?? "Utilisateur sans nom"}</span>
                        {user.is_kent ? <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-100 text-[10px] border border-sky-400/30">Supreme</span> : null}
                      </div>
                      <div className="text-white/45 text-xs mt-1">{user.email ?? "Aucun courriel"}</div>
                      <div className="text-white/25 text-xs mt-1">Cree le {formatDate(user.created_at)}</div>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="text-white/80">{user.account_section === "staff" ? "Staff" : "Public"}</div>
                      <div className="text-white/35 text-xs mt-1">Statut staff: {statusLabel(user.status)}</div>
                      {user.restricted_reason ? <div className="text-rose-200/80 text-xs mt-1">Restriction: {user.restricted_reason}</div> : null}
                    </td>
                    <td className="py-4 pr-4">
                      {user.account_section === "staff" && !user.is_kent ? (
                        <div className="flex flex-col gap-2 min-w-[220px]">
                          <select
                            value={roleDrafts[user.id] ?? ""}
                            onChange={(event) => setRoleDrafts((current) => ({ ...current, [user.id]: event.target.value }))}
                            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-sky-400/40"
                          >
                            <option value="">Choisir un role</option>
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role.id} value={role.id}>{role.categoryEmoji} {role.name}</option>
                            ))}
                          </select>
                          <button
                            disabled={!!busy || !roleDrafts[user.id] || roleDrafts[user.id] === user.role_id}
                            onClick={() => void runAction("change_role", user)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold border border-violet-500/20 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20 disabled:opacity-50"
                          >
                            Changer le role
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-white/25">Non applicable</div>
                      )}
                    </td>
                    <td className="py-4 pr-4">
                      <div className={`inline-flex px-2 py-1 rounded-full border text-xs font-semibold ${user.email_confirmed_at ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20" : "bg-amber-500/15 text-amber-200 border-amber-500/20"}`}>
                        {user.email_confirmed_at ? "Courriel confirme" : "En attente"}
                      </div>
                      <div className="text-white/25 text-xs mt-2">Provider: {user.provider ?? "email"}</div>
                    </td>
                    <td className="py-4 pr-4 text-white/45 text-xs">
                      Derniere connexion: {formatDate(user.last_sign_in_at)}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${user.is_disabled ? "bg-amber-500/15 text-amber-200 border-amber-500/20" : "bg-emerald-500/15 text-emerald-200 border-emerald-500/20"}`}>
                          {user.is_disabled ? "Desactive" : "Actif"}
                        </span>
                        <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${user.is_restricted ? "bg-rose-500/15 text-rose-200 border-rose-500/20" : "bg-sky-500/15 text-sky-200 border-sky-500/20"}`}>
                          {user.is_restricted ? "Restreint" : "Libre"}
                        </span>
                        {user.account_section === "staff" ? (
                          <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${user.status === "suspended" ? "bg-rose-500/15 text-rose-200 border-rose-500/20" : user.status === "approved" ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/20" : "bg-white/10 text-white/70 border-white/20"}`}>
                            Staff: {statusLabel(user.status)}
                          </span>
                        ) : null}
                      </div>
                      {user.is_kent ? (
                        <div className="text-xs text-white/25">Compte protege</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.account_section === "staff" && user.status === "pending_approval" ? (
                            <>
                              <button
                                disabled={!!busy}
                                onClick={() => void runAction("approve", user)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-500/25 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20 disabled:opacity-50"
                              >
                                Approuver
                              </button>
                              <button
                                disabled={!!busy}
                                onClick={() => void runAction("reject", user)}
                                className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/25 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-50"
                              >
                                Refuser
                              </button>
                            </>
                          ) : null}
                          {user.account_section === "staff" ? (
                            <button
                              disabled={!!busy}
                              onClick={() => void runAction(user.status === "suspended" ? "reactivate_staff" : "suspend_staff", user)}
                              className="px-3 py-2 rounded-xl text-xs font-semibold border border-orange-500/20 bg-orange-500/10 text-orange-100 hover:bg-orange-500/20 disabled:opacity-50"
                            >
                              {user.status === "suspended" ? "Reactiver staff" : "Suspendre staff"}
                            </button>
                          ) : null}
                          <button
                            disabled={!!busy}
                            onClick={() => void runAction(user.is_disabled ? "enable" : "disable", user)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold border border-amber-500/20 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            {user.is_disabled ? "Debloquer connexion" : "Bloquer connexion"}
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => void runAction("reset_password", user)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold border border-indigo-500/20 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20 disabled:opacity-50"
                          >
                            MdP temporaire
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => void runAction("wipe_content", user)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-100 hover:bg-fuchsia-500/20 disabled:opacity-50"
                          >
                            Reset contenu
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => void runAction(user.is_restricted ? "unrestrict" : "restrict", user)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold border border-sky-500/20 bg-sky-500/10 text-sky-100 hover:bg-sky-500/20 disabled:opacity-50"
                          >
                            {user.is_restricted ? "Retirer restriction" : "Restreindre"}
                          </button>
                          <button
                            disabled={!!busy}
                            onClick={() => void runAction("delete", user)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold border border-rose-500/20 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <Trash2 size={12} /> Supprimer
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  function renderFilterChips(current: ActivityFilter, onChange: (value: ActivityFilter) => void) {
    const options: Array<{ value: ActivityFilter; label: string }> = [
      { value: "all", label: "Tous" },
      { value: "active", label: "Actifs" },
      { value: "inactive", label: "Inactifs" },
      { value: "restricted", label: "Restreints" },
    ]

    return (
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => {
          const active = current === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${active ? "bg-sky-500/20 border-sky-400/40 text-sky-100" : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.24),transparent_30%),linear-gradient(135deg,#07142b_0%,#0b2347_55%,#081b38_100%)] text-white px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs tracking-[0.28em] uppercase text-sky-300 mb-2">Admin supreme</div>
            <h1 className="text-3xl font-black">Gestion des utilisateurs</h1>
            <p className="text-sm text-white/50 mt-2 max-w-2xl">
              Kent peut surveiller les comptes, desactiver un acces, restreindre temporairement un utilisateur ou le supprimer completement.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/staff" className="px-4 py-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-sm font-semibold">
              Retour staff
            </Link>
            <button onClick={() => void fetchUsers()} className="px-4 py-2 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 text-white font-semibold text-sm inline-flex items-center gap-2 hover:brightness-105 transition">
              <RefreshCw size={15} /> Actualiser
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "all", label: "Comptes", value: stats.total, icon: <Users size={18} />, tone: "from-slate-200/10 to-white/5" },
            { key: "staff", label: "Staff", value: stats.staff, icon: <ShieldCheck size={18} />, tone: "from-cyan-500/20 to-sky-800/15" },
            { key: "public", label: "Public", value: stats.public, icon: <Shield size={18} />, tone: "from-indigo-500/20 to-indigo-800/15" },
            { key: "active", label: "Actifs", value: stats.active, icon: <ShieldCheck size={18} />, tone: "from-emerald-500/20 to-emerald-800/15" },
            { key: "disabled", label: "Desactives", value: stats.disabled, icon: <ShieldBan size={18} />, tone: "from-amber-500/20 to-orange-800/15" },
            { key: "restricted", label: "Restreints", value: stats.restricted, icon: <Shield size={18} />, tone: "from-rose-500/20 to-rose-800/15" },
            { key: "staffSuspended", label: "Staff suspendus", value: stats.staffSuspended, icon: <ShieldBan size={18} />, tone: "from-rose-600/30 to-red-900/20" },
            { key: "recent7d", label: "Connexions 7j", value: stats.recent7d, icon: <Clock3 size={18} />, tone: "from-teal-500/20 to-teal-800/15" },
            { key: "neverLogged", label: "Jamais connectes", value: stats.neverLogged, icon: <MailCheck size={18} />, tone: "from-zinc-400/20 to-zinc-700/15" },
          ].map((card) => (
            <button
              key={card.label}
              type="button"
              onClick={() => setStatsFilter(card.key as StatsFilter)}
              className={`rounded-3xl border ${statsFilter === card.key ? "border-sky-300/50" : "border-white/10"} bg-gradient-to-br ${card.tone} p-5 shadow-xl text-left hover:brightness-110 transition`}
            >
              <div className="flex items-center justify-between mb-4 text-white/75">
                {card.icon}
                <span className="text-xs uppercase tracking-[0.22em]">{card.label}</span>
              </div>
              <div className="text-3xl font-black tabular-nums">{card.value}</div>
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Contenu affiche: <span className="font-semibold">{statsFilterLabel(statsFilter)}</span> · {scopedUsers.length} compte(s)
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-sm ${emailProviderConfigured === true ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100" : "border-amber-500/25 bg-amber-500/10 text-amber-100"}`}>
          <span className="font-semibold">Envoi automatique des mots de passe temporaires:</span>{" "}
          {emailProviderConfigured === true ? "Actif (provider email configure)" : "Inactif (variables RESEND manquantes)"}
        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl p-4 md:p-6 space-y-4 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative flex-1 max-w-xl">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher par nom, email, role ou statut"
                className="w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-sky-400/45"
              />
            </div>
            <div className="text-xs text-white/35">{scopedUsers.length} utilisateur(s) affiches</div>
          </div>

          {error ? <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}
          {message ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</div> : null}
          {temporaryPasswordInfo ? (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 px-4 py-4 text-sm text-sky-100 space-y-2">
              <div className="font-semibold">Mot de passe temporaire pour {temporaryPasswordInfo.email}</div>
              <div className="font-mono text-xs bg-black/25 border border-white/10 rounded-lg px-3 py-2 break-all">{temporaryPasswordInfo.password}</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(temporaryPasswordInfo.password)
                    setMessage("Mot de passe temporaire copie.")
                  }}
                  className="px-3 py-1.5 rounded-lg border border-sky-400/35 bg-sky-400/15 hover:bg-sky-400/25 text-xs font-semibold"
                >
                  Copier
                </button>
                <button
                  type="button"
                  onClick={() => setTemporaryPasswordInfo(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white/85"
                >
                  Fermer
                </button>
              </div>
              <div className="text-[11px] text-sky-100/70">L'utilisateur devra changer ce mot de passe a sa prochaine connexion.</div>
            </div>
          ) : null}

          {loading ? (
            <div className="h-40 flex items-center justify-center text-white/40 text-sm">Chargement des utilisateurs...</div>
          ) : (
            <div className="space-y-6">
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black tracking-wide">Section Staff</h2>
                  <span className="text-xs text-white/45">{staffUsers.length} compte(s)</span>
                </div>
                {renderFilterChips(staffFilter, setStaffFilter)}
                {renderUsersTable("Staff actifs", grouped.staffActive)}
                {renderUsersTable("Staff inactifs", grouped.staffInactive)}
              </div>

              <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 md:p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-black tracking-wide">Section Public</h2>
                  <span className="text-xs text-white/45">{publicUsers.length} compte(s)</span>
                </div>
                {renderFilterChips(publicFilter, setPublicFilter)}
                {renderUsersTable("Public actifs", grouped.publicActive)}
                {renderUsersTable("Public inactifs", grouped.publicInactive)}
              </div>
            </div>
          )}

        </div>

        <div className="rounded-3xl border border-white/10 bg-black/20 backdrop-blur-xl p-4 md:p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold">Journal admin</h2>
              <p className="text-sm text-white/45 mt-1">Historique recent des actions declenchees par l'administrateur supreme.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-white/35">{filteredAuditLogs.length} entree(s)</div>
              <button
                onClick={exportAuditLogs}
                className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition text-xs font-semibold"
              >
                Export JSON
              </button>
            </div>
          </div>

          <input
            value={auditSearch}
            onChange={(event) => setAuditSearch(event.target.value)}
            placeholder="Filtrer le journal (email, action, role, motif)"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-sky-400/45"
          />

          {filteredAuditLogs.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-sm text-white/35 text-center">
              Aucune action admin journalisee pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAuditLogs.map((entry) => (
                <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold text-white">{actionLabel(entry.action)}</div>
                      <div className="text-xs text-white/45 mt-1">
                        Cible: {entry.target_email ?? entry.target_user_id}
                        {entry.target_role_name ? ` · Role: ${entry.target_role_name}` : ""}
                      </div>
                      <div className="text-[11px] text-white/25 mt-1">Acteur: {entry.actor_user_id}</div>
                    </div>
                    <div className="text-xs text-white/30">{formatDate(entry.created_at)}</div>
                  </div>
                  {entry.reason ? <div className="text-xs text-white/55 mt-2">Motif: {entry.reason}</div> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}