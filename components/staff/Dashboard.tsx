"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type StaffMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role_name: string | null;
  status: string | null;
  accent_color: Record<string, unknown> | null;
};

function getInitials(name: string | null, email: string | null): string {
  if (name) return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (email ?? "ST").slice(0, 2).toUpperCase();
}

type StaffMetricsPayload = {
  ok: boolean;
  me: StaffMember | null;
  teamPreview: StaffMember[];
  counts: {
    approvedMembers: number;
    pendingApprovals: number;
    feedbackTotal: number;
    feedbackNew: number;
  };
};

function getAvatar(m: StaffMember): string | null {
  const ac = m.accent_color as Record<string, unknown> | null;
  if (!ac) return null;
  const profile = ac.profile as Record<string, unknown> | undefined;
  return (profile?.avatar_url as string) ?? null;
}

const AVATAR_COLORS = ["bg-sky-500","bg-violet-500","bg-amber-500","bg-pink-500","bg-emerald-500","bg-fuchsia-500","bg-teal-500","bg-orange-400"];
function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [approvedMembersCount, setApprovedMembersCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [feedbackStats, setFeedbackStats] = useState({ total: 0, new: 0 });
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<StaffMember | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/staff/metrics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as StaffMetricsPayload | null;
      if (response.ok && payload?.ok) {
        setMyProfile(payload.me ?? null);
        setTeam(payload.teamPreview ?? []);
        setApprovedMembersCount(payload.counts.approvedMembers ?? 0);
        setPendingCount(payload.counts.pendingApprovals ?? 0);
        setFeedbackStats({
          total: payload.counts.feedbackTotal ?? 0,
          new: payload.counts.feedbackNew ?? 0,
        });
      }

      setLoading(false);
    }

    void loadData();
  }, []);

  const stats = [
    { label: "Membres Approuvés", value: approvedMembersCount, color: "from-emerald-400 to-emerald-600", view: "team" },
    { label: "En Attente d'Approbation", value: pendingCount, color: "from-amber-400 to-amber-600", view: "notifications" },
    { label: "Feedbacks Total", value: feedbackStats.total, color: "from-sky-400 to-sky-600", view: "suggestions" },
    { label: "Feedbacks Nouveaux", value: feedbackStats.new, color: "from-rose-500 to-rose-700", view: "suggestions" },
  ];

  const totalSignals = Math.max(approvedMembersCount + pendingCount + feedbackStats.total, 1);
  const momentumScore = Math.min(100, Math.round(((approvedMembersCount * 2 + (feedbackStats.total - feedbackStats.new)) / totalSignals) * 100));
  const dailyFocus = feedbackStats.new > 0
    ? `Priorité du jour: ${feedbackStats.new} feedback${feedbackStats.new > 1 ? "s" : ""} nouveau${feedbackStats.new > 1 ? "x" : ""} à traiter.`
    : pendingCount > 0
      ? `Priorité du jour: ${pendingCount} demande${pendingCount > 1 ? "s" : ""} staff en attente.`
      : "Priorité du jour: maintenir la qualité et accélérer les réponses équipe.";

  const actions: { label: string; view: string; color: string; icon: string }[] = [
    { label: "Feedbacks", view: "suggestions", color: "ghost", icon: "💬" },
    { label: "Voir l'Équipe", view: "team", color: "ghost", icon: "👥" },
    { label: "Analytiques", view: "analytics", color: "ghost", icon: "📊" },
    { label: "Chat Équipe", view: "chat", color: "liquid", icon: "✉️" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-8">
      {/* Carte profil personnel */}
      {myProfile && (() => {
        const myName = myProfile.full_name ?? myProfile.email?.split("@")[0] ?? "Staff";
        const myAvatar = getAvatar(myProfile);
        const myInitials = getInitials(myProfile.full_name, myProfile.email ?? "staff@milele.local");
        const myColor = hashColor(myProfile.user_id);
        const statusColors: Record<string, string> = {
          approved: "text-emerald-300 bg-emerald-500/15 border-emerald-500/25",
          pending_approval: "text-amber-300 bg-amber-500/15 border-amber-500/25",
          pending_role: "text-sky-300 bg-sky-500/15 border-sky-500/25",
          rejected: "text-rose-300 bg-rose-500/15 border-rose-500/25",
        };
        const statusLabels: Record<string, string> = {
          approved: "Approuvé",
          pending_approval: "En attente",
          pending_role: "Sans rôle",
          rejected: "Refusé",
        };
        const profileStatus = myProfile.status ?? "";
        return (
          <div className="flex items-center gap-5 bg-white/10 rounded-2xl border border-white/20 px-6 py-5 shadow-xl backdrop-blur-xl">
            {myAvatar ? (
              <Image src={myAvatar} alt={myName} width={64} height={64} sizes="64px" className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-white/15 transition-opacity duration-300" />
            ) : (
              <div className={`w-16 h-16 rounded-2xl ${myColor} flex items-center justify-center font-bold text-white text-xl shadow-lg`}>{myInitials}</div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xl font-bold text-white truncate">{myName}</div>
              <div className="text-sm text-gray-400 mt-0.5">{myProfile.role_name ?? "Rôle non défini"}</div>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${statusColors[profileStatus] ?? "text-gray-400 bg-white/5 border-white/10"}`}>
              {statusLabels[profileStatus] ?? myProfile.status}
            </span>
          </div>
        );
      })()}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list" aria-label="Statistiques du staff">
        {stats.map((s) => (
          <button
            key={s.label}
            role="listitem"
            type="button"
            onClick={() => onNavigate?.(s.view)}
            aria-label={`${s.label}: ${loading ? "chargement" : s.value}`}
            className={`group rounded-xl p-5 bg-gradient-to-br ${s.color} text-white shadow-lg flex flex-col items-start justify-between min-h-[100px] text-left transition hover:-translate-y-1 hover:shadow-2xl`}
          >
            <div className="text-xs opacity-80 mb-2 font-medium">{s.label}</div>
            <div className="text-3xl font-bold tabular-nums" aria-live="polite">{loading ? "—" : s.value}</div>
            <div className="text-[11px] opacity-0 group-hover:opacity-100 transition">Ouvrir</div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-sky-400/20 bg-[linear-gradient(130deg,rgba(14,165,233,0.18),rgba(59,130,246,0.14),rgba(20,184,166,0.1))] p-5 md:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-sky-100/70">Focus Quotidien</div>
            <p className="text-white text-sm md:text-base font-semibold mt-2">{dailyFocus}</p>
          </div>
          <div className="min-w-[180px]">
            <div className="text-xs text-sky-100/70 mb-1">Momentum équipe</div>
            <div className="h-2 rounded-full bg-black/25 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-200 transition-all duration-700" style={{ width: `${momentumScore}%` }} />
            </div>
            <div className="text-xs text-white/80 mt-1 font-semibold">{momentumScore}%</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Équipe active */}
        <div className="lg:col-span-2 bg-white/10 rounded-2xl p-6 shadow-xl backdrop-blur-xl border border-white/20">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-violet-400">👥</span> Équipe Active
          </h2>
          {loading ? (
            <div className="text-gray-400 text-sm">Chargement…</div>
          ) : team.length === 0 ? (
            <div className="text-gray-400 text-sm">Aucun membre approuvé pour l'instant.</div>
          ) : (
            <div className="space-y-3">
              {team.map((m) => {
                const name = m.full_name ?? m.email?.split("@")[0] ?? "Membre";
                const avatarUrl = getAvatar(m);
                const initials = getInitials(m.full_name, m.email);
                const color = hashColor(m.user_id);
                return (
                  <div key={m.user_id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={name} width={36} height={36} sizes="36px" className="w-9 h-9 rounded-full object-cover transition-opacity duration-300" />
                    ) : (
                      <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center font-bold text-white text-sm`}>{initials}</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white/90 truncate">{name}</div>
                      <div className="text-xs text-gray-400">{m.role_name ?? "—"}</div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Actif</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="bg-white/10 rounded-2xl p-6 shadow-xl border border-white/20">
          <h2 className="text-base font-bold mb-4">Actions Rapides</h2>
          <div className="flex flex-col gap-3">
            {actions.map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate?.(a.view)}
                aria-label={`Naviguer vers : ${a.label}`}
                className={
                  a.color === "liquid"
                    ? "btn-liquid text-left flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow hover:scale-105 transition"
                    : "text-left flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-white/5 hover:bg-white/15 border border-white/10 text-white/80 hover:text-white transition"
                }
              >
                <span aria-hidden="true">{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
