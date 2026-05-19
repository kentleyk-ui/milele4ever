"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { X, Mail, Phone, Send, Edit2, Check, Loader2 } from "lucide-react";
import { STAFF_FOCUS_RING, STAFF_INPUT, StaffEmptyState, StaffPanel, StaffShell } from "@/components/staff/StaffDesignSystem";

type ProfileMeta = {
  avatar_url?: string | null;
  phone_number?: string | null;
  personal_email?: string | null;
  professional_email?: string | null;
  telegram_username?: string | null;
};

type Member = {
  user_id: string;
  full_name: string | null;
  email: string;
  role_name: string | null;
  role_category: string | null;
  status: string;
  accent_color: Record<string, unknown> | null;
  created_at: string;
};

function getInitials(name: string | null, email: string): string {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function getAvatar(m: Member): string | null {
  const ac = m.accent_color as Record<string, unknown> | null;
  if (!ac) return null;
  const profile = ac.profile as Record<string, unknown> | undefined;
  return (profile?.avatar_url as string) ?? null;
}

function getProfileMeta(m: Member): ProfileMeta {
  const ac = m.accent_color as Record<string, unknown> | null;
  if (!ac || typeof ac !== "object" || !("profile" in ac)) return {};
  const profile = (ac as { profile?: ProfileMeta }).profile;
  return profile && typeof profile === "object" ? profile : {};
}

function getDept(category: string | null): string {
  if (!category) return "Équipe";
  const map: Record<string, string> = {
    direction: "Direction", coordination: "Coordination", support: "Support",
    communication: "Communication", tech: "Technique", content: "Contenu",
    creative: "Créatif", moderation: "Modération", community: "Communauté",
  };
  return map[category.toLowerCase()] ?? category;
}

const DEPT_COLORS: Record<string, string> = {
  Direction: "bg-sky-500/20 text-sky-200",
  Coordination: "bg-violet-500/20 text-violet-200",
  Support: "bg-amber-500/20 text-amber-200",
  Contenu: "bg-pink-500/20 text-pink-200",
  Technique: "bg-emerald-500/20 text-emerald-200",
  Créatif: "bg-fuchsia-500/20 text-fuchsia-200",
  Communication: "bg-orange-500/20 text-orange-200",
  Modération: "bg-red-500/20 text-red-200",
  Communauté: "bg-teal-500/20 text-teal-200",
};

const AVATAR_COLORS = ["bg-sky-500","bg-violet-500","bg-amber-500","bg-pink-500","bg-emerald-500","bg-fuchsia-500","bg-teal-500","bg-orange-400"];
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default function Team() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("Tous");
  const [selected, setSelected] = useState<Member | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savingField, setSavingField] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email === "kentleyk@gmail.com") setIsAdmin(true);
    });
    supabase
      .from("staff_profiles")
      .select("user_id, full_name, email, role_name, role_category, status, accent_color, created_at")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMembers((data as Member[]) ?? []);
        setLoading(false);
      });
  }, []);

  const refreshMember = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("staff_profiles")
      .select("user_id, full_name, email, role_name, role_category, status, accent_color, created_at")
      .eq("user_id", userId)
      .single();
    if (data) {
      setMembers((prev) => prev.map((m) => (m.user_id === userId ? (data as Member) : m)));
      setSelected(data as Member);
    }
  }, []);

  const saveAdminEdit = useCallback(async (field: string, value: string) => {
    if (!selected) return;
    setSavingField(field);
    let patch: Partial<Member> = {};
    if (field === "full_name") patch = { full_name: value || null };
    else if (field === "role_name") patch = { role_name: value || null };
    else {
      const ac = (selected.accent_color ?? {}) as Record<string, unknown>;
      const existingProfile = ((ac.profile as Record<string, unknown>) ?? {}) as Record<string, unknown>;
      const profile = { ...existingProfile, [field]: value || null };
      patch = { accent_color: { ...ac, profile } };
    }
    await supabase.from("staff_profiles").update(patch).eq("user_id", selected.user_id);
    await refreshMember(selected.user_id);
    setSavingField(null);
    setEditField(null);
  }, [selected, refreshMember]);

  const depts = ["Tous", ...Array.from(new Set(members.map((m) => getDept(m.role_category))))];

  const filtered = members.filter((m) => {
    const name = m.full_name ?? m.email;
    const matchSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      (m.role_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "Tous" || getDept(m.role_category) === deptFilter;
    return matchSearch && matchDept;
  });

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", { month: "short", year: "numeric" });
  }

  function EditableRow({ label, field, value }: { label: string; field: string; value: string | null }) {
    return (
      <div className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0">
        <span className="text-xs text-gray-400 w-28 shrink-0">{label}</span>
        {editField === field ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              className={`flex-1 bg-white/10 border border-violet-400 rounded-lg px-2 py-1 text-sm text-white ${STAFF_FOCUS_RING}`}
              aria-label={`Modifier ${label}`}
              defaultValue={value ?? ""}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveAdminEdit(field, (e.target as HTMLInputElement).value);
                if (e.key === "Escape") setEditField(null);
              }}
              onChange={(e) => setEditValue(e.target.value)}
            />
            <button
              onClick={() => saveAdminEdit(field, editValue || value || "")}
              className={`text-violet-300 hover:text-white p-1 ${STAFF_FOCUS_RING}`}
              disabled={savingField === field}
              aria-label={`Confirmer ${label}`}
            >
              {savingField === field ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            </button>
            <button onClick={() => setEditField(null)} className={`text-gray-400 hover:text-white p-1 ${STAFF_FOCUS_RING}`} aria-label={`Annuler ${label}`}>
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-white/80 flex-1">{value || <span className="text-gray-500">—</span>}</span>
            {isAdmin && (
              <button
                onClick={() => { setEditField(field); setEditValue(value ?? ""); }}
                className={`opacity-0 group-hover:opacity-100 text-gray-400 hover:text-violet-300 p-1 transition-opacity ${STAFF_FOCUS_RING}`}
                aria-label={`Editer ${label}`}
              >
                <Edit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <StaffShell maxWidthClass="max-w-5xl">

      {/* Member detail sheet */}
      {selected && (() => {
        const avatarUrl = getAvatar(selected);
        const name = selected.full_name ?? selected.email.split("@")[0];
        const initials = getInitials(selected.full_name, selected.email);
        const color = hashColor(selected.user_id);
        const dept = getDept(selected.role_category);
        const meta = getProfileMeta(selected);
        return (
          <div
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelected(null); setEditField(null); }}
          >
            <div
              className="h-full w-full max-w-sm bg-[#0f0f1a] border-l border-white/10 shadow-2xl flex flex-col overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with avatar */}
              <div className="relative bg-gradient-to-b from-violet-900/40 to-transparent px-6 pt-10 pb-6 flex flex-col items-center">
                <button
                  onClick={() => { setSelected(null); setEditField(null); }}
                  className={`absolute top-4 right-4 text-gray-400 hover:text-white bg-white/10 rounded-full p-1.5 ${STAFF_FOCUS_RING}`}
                  aria-label="Fermer la fiche membre"
                >
                  <X size={16} />
                </button>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={name} width={96} height={96} sizes="96px" className="w-24 h-24 rounded-full object-cover ring-4 ring-violet-500/40 shadow-xl mb-4 transition-opacity duration-300" />
                ) : (
                  <div className={`w-24 h-24 rounded-full ${color} flex items-center justify-center font-bold text-3xl text-white ring-4 ring-white/10 shadow-xl mb-4`}>
                    {initials}
                  </div>
                )}
                <h2 className="text-xl font-bold text-white text-center">{name}</h2>
                <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                  <span className="text-sm text-gray-300">{selected.role_name ?? "—"}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEPT_COLORS[dept] ?? "bg-white/10 text-white/60"}`}>{dept}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Membre depuis {formatDate(selected.created_at)}</p>
              </div>

              {/* Info fields */}
              <div className="px-6 pb-8 flex flex-col gap-1 group">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-2 mt-2">Informations</h3>

                <div className="flex items-center gap-2 py-1.5 border-b border-white/5">
                  <span className="text-xs text-gray-400 w-28 shrink-0">Email compte</span>
                  <span className="text-sm text-white/80 flex-1 truncate">{selected.email}</span>
                  <a href={`mailto:${selected.email}`} className={`text-violet-300 hover:text-white p-1 ${STAFF_FOCUS_RING}`} aria-label="Envoyer un email au compte"><Mail size={13} /></a>
                </div>

                <EditableRow label="Nom complet" field="full_name" value={selected.full_name} />
                <EditableRow label="Rôle" field="role_name" value={selected.role_name} />
                <EditableRow label="Téléphone" field="phone_number" value={meta.phone_number ?? null} />
                <EditableRow label="Email perso" field="personal_email" value={meta.personal_email ?? null} />
                <EditableRow label="Email pro" field="professional_email" value={meta.professional_email ?? null} />
                <EditableRow label="Telegram" field="telegram_username" value={meta.telegram_username ?? null} />

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2 mt-5">
                  <a
                    href={`mailto:${meta.professional_email ?? meta.personal_email ?? selected.email}`}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-200 hover:bg-violet-500/40 transition"
                    aria-label="Envoyer un email au membre"
                  >
                    <Mail size={13} /> Envoyer un email
                  </a>
                  {meta.phone_number && (
                    <a
                      href={`tel:${meta.phone_number}`}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-200 hover:bg-sky-500/40 transition"
                      aria-label="Appeler le membre"
                    >
                      <Phone size={13} /> Appeler
                    </a>
                  )}
                  {meta.telegram_username && (
                    <a
                      href={`https://t.me/${meta.telegram_username.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-sky-400/20 text-sky-300 hover:bg-sky-400/40 transition"
                      aria-label="Ouvrir Telegram"
                    >
                      <Send size={13} /> Telegram
                    </a>
                  )}
                </div>
                {isAdmin && <p className="text-xs text-gray-600 mt-3">Cliquez sur un champ pour modifier.</p>}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Équipe Aeternum</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading
              ? "Chargement..."
              : `${members.length} membre${members.length !== 1 ? "s" : ""} approuvé${members.length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total membres", value: members.length, color: "from-slate-600 to-slate-700" },
          { label: "Approuvés", value: members.filter((m) => m.status === "approved").length, color: "from-emerald-500 to-emerald-700" },
          { label: "Départements", value: new Set(members.map((m) => getDept(m.role_category))).size, color: "from-violet-500 to-violet-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 bg-gradient-to-br ${s.color} text-white shadow flex flex-col`}>
            <span className="text-xs opacity-75">{s.label}</span>
            <span className="text-3xl font-bold tabular-nums mt-1">{s.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className={STAFF_INPUT}
          placeholder="Rechercher un membre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher un membre"
        />
        <select
          className={STAFF_INPUT}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="Filtrer les membres par département"
        >
          {depts.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <StaffEmptyState title="Chargement de l'équipe" description="Récupération des profils staff en cours." />
      ) : filtered.length === 0 ? (
        <StaffEmptyState
          title={members.length === 0 ? "Aucun membre approuvé" : "Aucun résultat"}
          description={members.length === 0 ? "Les membres validés apparaîtront ici automatiquement." : "Essayez une autre recherche ou un autre département."}
        />
      ) : (
        <>
          <StaffPanel className="hidden md:block p-0 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {["Membre", "Rôle", "Département", "Email", "Depuis", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-violet-300 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const name = m.full_name ?? m.email.split("@")[0];
                  const avatarUrl = getAvatar(m);
                  const initials = getInitials(m.full_name, m.email);
                  const color = hashColor(m.user_id);
                  const dept = getDept(m.role_category);
                  const meta = getProfileMeta(m);
                  return (
                    <tr
                      key={m.user_id}
                      className="border-b border-white/5 hover:bg-white/5 transition cursor-pointer"
                      onClick={() => { setSelected(m); setEditField(null); }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {avatarUrl ? (
                            <Image src={avatarUrl} alt={name} width={36} height={36} sizes="36px" className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-400/30 transition-opacity duration-300" />
                          ) : (
                            <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-bold text-white text-xs ring-2 ring-white/10`}>{initials}</div>
                          )}
                          <div>
                            <span className="font-semibold text-white/90 block">{name}</span>
                            {meta.telegram_username && <span className="text-xs text-gray-500">{meta.telegram_username}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-300 text-sm">{m.role_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${DEPT_COLORS[dept] ?? "bg-white/10 text-white/60"}`}>{dept}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{m.email}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(m); setEditField(null); }}
                          className={`text-xs text-violet-300 hover:text-violet-100 border border-violet-500/30 rounded-lg px-3 py-1 hover:bg-violet-500/10 transition ${STAFF_FOCUS_RING}`}
                          aria-label={`Voir le profil de ${name}`}
                        >
                          Voir profil
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </StaffPanel>

          <div className="md:hidden grid grid-cols-1 gap-3">
            {filtered.map((m) => {
              const name = m.full_name ?? m.email.split("@")[0];
              const avatarUrl = getAvatar(m);
              const initials = getInitials(m.full_name, m.email);
              const color = hashColor(m.user_id);
              const dept = getDept(m.role_category);
              const meta = getProfileMeta(m);
              return (
                <div
                  key={m.user_id}
                  className="rounded-xl bg-white/10 p-4 border border-white/20 cursor-pointer hover:bg-white/15 transition"
                  onClick={() => { setSelected(m); setEditField(null); }}
                >
                  <div className="flex items-center gap-4">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={name} width={56} height={56} sizes="56px" className="w-14 h-14 rounded-full object-cover ring-2 ring-violet-400/40 flex-shrink-0 shadow-lg transition-opacity duration-300" />
                    ) : (
                      <div className={`w-14 h-14 rounded-full ${color} flex items-center justify-center font-bold text-xl text-white flex-shrink-0 ring-2 ring-white/10`}>{initials}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white/90 text-base">{name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{m.role_name ?? "—"}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DEPT_COLORS[dept] ?? "bg-white/10 text-white/60"}`}>{dept}</span>
                        {meta.telegram_username && <span className="text-xs text-sky-400">{meta.telegram_username}</span>}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 self-start pt-1">{formatDate(m.created_at)}</div>
                  </div>
                  {(meta.phone_number || meta.professional_email || meta.personal_email) && (
                    <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-3">
                      {meta.phone_number && <span className="flex items-center gap-1 text-xs text-gray-400"><Phone size={11} /> {meta.phone_number}</span>}
                      {(meta.professional_email || meta.personal_email) && (
                        <span className="flex items-center gap-1 text-xs text-gray-400"><Mail size={11} /> {meta.professional_email ?? meta.personal_email}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </StaffShell>
  );
}
