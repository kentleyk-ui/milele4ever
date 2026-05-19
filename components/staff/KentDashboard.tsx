"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ROLE_CATEGORIES } from "@/lib/roles";
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";

interface StaffProfile {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role_id: string | null;
  role_name: string | null;
  role_category: string | null;
  status: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function getInitials(name: string | null, email: string | null) {
  const n = name ?? email ?? "?";
  return n.split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
}

export default function KentDashboard() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeStat, setActiveStat] = useState<"approved" | "pending" | "pendingRole" | "rejected">("pending");

  const loadProfiles = useCallback(async () => {
    const { data } = await supabase
      .from("staff_profiles")
      .select("user_id, email, full_name, role_id, role_name, role_category, status, created_at")
      .order("created_at", { ascending: false });
    setProfiles((data as StaffProfile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadProfiles();
    // Realtime : écouter les changements de staff_profiles
    const channel = supabase
      .channel("kent-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, () => {
        void loadProfiles();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadProfiles]);

  async function handleDecision(userId: string, decision: "approved" | "rejected") {
    setActionLoading(userId + decision);
    const updateData: Record<string, unknown> = {
      status: decision,
      updated_at: new Date().toISOString(),
    };
    if (decision === "approved") {
      updateData.approved_at = new Date().toISOString();
    }
    await supabase.from("staff_profiles").update(updateData).eq("user_id", userId);
    await loadProfiles();
    setActionLoading(null);
  }

  const pending = profiles.filter(p => p.status === "pending_approval");
  const approved = profiles.filter(p => p.status === "approved" && p.role_id !== "admin-supreme");
  const rejected = profiles.filter(p => p.status === "rejected");
  const pendingRole = profiles.filter(p => p.status === "pending_role");

  useEffect(() => {
    if (pending.length > 0) {
      setActiveStat("pending");
      return;
    }
    setActiveStat("approved");
  }, [pending.length]);

  // Compter les membres par catégorie
  const catStats = ROLE_CATEGORIES.map(cat => ({
    ...cat,
    count: approved.filter(p => p.role_category === cat.id).length,
    total: cat.roles.filter(r => !("locked" in r && r.locked)).length,
  }));

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-6">

      {/* Header Kent */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#d4a853] to-amber-600 flex items-center justify-center font-bold text-black text-lg shadow-lg">⚜️</div>
            <div>
              <h1 className="text-xl font-bold text-white">Tableau de Bord</h1>
              <p className="text-xs text-[#d4a853]/80">Administrateur Suprême · Aeternum</p>
            </div>
          </div>
        </div>
        <LiquidMetalButton
          label="Panneau Admin"
          width={210}
          height={52}
          tinted
          leftIcon={<svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M12 1L3 5v7c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5L12 1z" fill="currentColor" opacity="0.9"/></svg>}
          onClick={() => router.push("/admin")}
        />
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: "approved", label: "Membres approuvés", value: approved.length + 1, color: "from-emerald-400/85 via-emerald-600/80 to-emerald-900/85", icon: "✅" },
          { key: "pending", label: "En attente", value: pending.length, color: "from-amber-300/85 via-orange-500/80 to-orange-900/90", icon: "⏳", alert: pending.length > 0 },
          { key: "pendingRole", label: "Sans rôle", value: pendingRole.length, color: "from-sky-300/85 via-blue-500/80 to-indigo-900/90", icon: "🔵" },
          { key: "rejected", label: "Refusés", value: rejected.length, color: "from-rose-300/85 via-rose-600/80 to-red-900/90", icon: "❌" },
        ].map(s => (
          <button
            key={s.label}
            type="button"
            onClick={() => setActiveStat(s.key as "approved" | "pending" | "pendingRole" | "rejected")}
            className={`group relative overflow-hidden rounded-[1.35rem] p-5 border ${activeStat === s.key ? "border-white/70 ring-2 ring-white/35" : "border-white/15"} shadow-[0_16px_42px_rgba(0,0,0,0.35)] flex flex-col gap-1 text-left transition-all duration-300 hover:-translate-y-0.5`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${s.color}`} />
            <div className="absolute inset-[1px] rounded-[1.2rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.07)_34%,rgba(10,15,32,0.46)_100%)]" />
            <div className="absolute top-0 left-3 right-3 h-9 rounded-b-[1.2rem] bg-gradient-to-b from-white/30 to-transparent opacity-80" />
            <div className="absolute -top-7 left-[-35%] h-20 w-[70%] rotate-[14deg] bg-white/30 blur-xl transition-all duration-700 group-hover:left-[70%]" />
            {s.alert && s.value > 0 && (
              <span className="absolute top-2 right-2 z-20 w-3 h-3 rounded-full bg-amber-300 animate-pulse" />
            )}
            <div className="relative z-10 text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">{s.icon}</div>
            <div className="relative z-10 text-3xl font-black text-white tabular-nums drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]">{s.value}</div>
            <div className="relative z-10 text-xs text-white/85 font-semibold tracking-[0.02em]">{s.label}</div>
            <div className="relative z-10 mt-2 h-[2px] w-20 rounded-full bg-white/40" />
          </button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-white">
            Détails {activeStat === "approved" ? "Membres approuvés" : activeStat === "pending" ? "Demandes en attente" : activeStat === "pendingRole" ? "Comptes sans rôle" : "Comptes refusés"}
          </h2>
          <span className="text-xs text-white/50">
            {activeStat === "approved" ? approved.length + 1 : activeStat === "pending" ? pending.length : activeStat === "pendingRole" ? pendingRole.length : rejected.length} élément(s)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-24 text-white/30 text-sm">Chargement…</div>
        ) : (
          <div className="divide-y divide-white/5">
            {(activeStat === "approved" ? approved : activeStat === "pending" ? pending : activeStat === "pendingRole" ? pendingRole : rejected).slice(0, 25).map((p) => {
              const cat = ROLE_CATEGORIES.find(c => c.id === p.role_category);
              const initials = getInitials(p.full_name, p.email);
              const isApproving = actionLoading === p.user_id + "approved";
              const isRejecting = actionLoading === p.user_id + "rejected";
              return (
                <div key={p.user_id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: cat ? cat.color + "40" : "#3b82f640", border: `1.5px solid ${cat?.color ?? "#3b82f6"}50` }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{p.full_name ?? p.email ?? p.user_id}</div>
                      <div className="text-xs text-white/40 truncate">{p.email}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {cat && <span className="text-xs">{cat.emoji}</span>}
                        <span className="text-xs font-medium" style={{ color: cat?.color ?? "#fff" }}>{p.role_name}</span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/30 text-xs">{timeAgo(p.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {activeStat === "pending" ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <LiquidMetalButton
                        label={isApproving ? "Validation..." : "Approuver"}
                        width={142}
                        height={42}
                        tinted
                        leftIcon={<span>{isApproving ? "⏳" : "✅"}</span>}
                        disabled={!!actionLoading}
                        onClick={() => handleDecision(p.user_id, "approved")}
                      />
                      <LiquidMetalButton
                        label={isRejecting ? "Refus..." : "Refuser"}
                        width={132}
                        height={42}
                        tinted
                        leftIcon={<span>{isRejecting ? "⏳" : "❌"}</span>}
                        disabled={!!actionLoading}
                        onClick={() => handleDecision(p.user_id, "rejected")}
                      />
                    </div>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs border ${activeStat === "approved" ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30" : activeStat === "pendingRole" ? "bg-sky-500/20 text-sky-200 border-sky-500/30" : "bg-rose-500/20 text-rose-200 border-rose-500/30"}`}>
                      {activeStat === "approved" ? "Approuvé" : activeStat === "pendingRole" ? "Sans rôle" : "Refusé"}
                    </span>
                  )}
                </div>
              );
            })}

            {(activeStat === "approved" ? approved : activeStat === "pending" ? pending : activeStat === "pendingRole" ? pendingRole : rejected).length === 0 ? (
              <div className="py-8 text-center text-white/35 text-sm">Aucun élément dans cette section.</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Demandes en attente */}
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="font-bold text-white flex items-center gap-2">
            <span className="text-amber-400">⏳</span>
            Demandes en attente
            {pending.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/30">
                {pending.length}
              </span>
            )}
          </h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-24 text-white/30 text-sm">Chargement…</div>
        ) : pending.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-white/30 text-sm">Aucune demande en attente ✓</div>
        ) : (
          <div className="divide-y divide-white/5">
            {pending.map(p => {
              const cat = ROLE_CATEGORIES.find(c => c.id === p.role_category);
              const initials = getInitials(p.full_name, p.email);
              const isApproving = actionLoading === p.user_id + "approved";
              const isRejecting = actionLoading === p.user_id + "rejected";
              return (
                <div key={p.user_id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
                      style={{ background: cat ? cat.color + "40" : "#3b82f640", border: `1.5px solid ${cat?.color ?? "#3b82f6"}50` }}>
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{p.full_name ?? p.email ?? p.user_id}</div>
                      <div className="text-xs text-white/40 truncate">{p.email}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {cat && <span className="text-xs">{cat.emoji}</span>}
                        <span className="text-xs font-medium" style={{ color: cat?.color ?? "#fff" }}>{p.role_name}</span>
                        <span className="text-white/20 text-xs">·</span>
                        <span className="text-white/30 text-xs">{timeAgo(p.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleDecision(p.user_id, "approved")}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {isApproving ? <span className="w-3 h-3 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" /> : "✅"}
                      Approuver
                    </button>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleDecision(p.user_id, "rejected")}
                      className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-all active:scale-95 disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {isRejecting ? <span className="w-3 h-3 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" /> : "❌"}
                      Refuser
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Évolution organigramme par catégorie */}
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <span>🏛️</span> Occupation des catégories
          </h2>
          <div className="space-y-4">
            {catStats.map(cat => {
              const pct = cat.total > 0 ? Math.round((cat.count / cat.total) * 100) : 0;
              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat.emoji}</span>
                      <span className="text-sm font-medium text-white/80">{cat.name}</span>
                    </div>
                    <span className="text-xs font-bold tabular-nums" style={{ color: cat.color }}>
                      {cat.count}/{cat.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cat.color}99, ${cat.color})` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Membres récemment approuvés */}
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <span>👥</span> Membres approuvés
          </h2>
          {approved.length === 0 ? (
            <div className="text-white/30 text-sm text-center py-4">Aucun membre encore</div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {approved.map(p => {
                const cat = ROLE_CATEGORIES.find(c => c.id === p.role_category);
                return (
                  <div key={p.user_id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: cat ? cat.color + "30" : "#3b82f630", border: `1px solid ${cat?.color ?? "#3b82f6"}40` }}>
                      {getInitials(p.full_name, p.email)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{p.full_name ?? p.email}</div>
                      <div className="text-xs text-white/40 truncate flex items-center gap-1">
                        {cat && <span>{cat.emoji}</span>}
                        <span>{p.role_name}</span>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activité récente (refusés + en attente rôle) */}
        <div className="bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 lg:col-span-2">
          <h2 className="font-bold text-white mb-5 flex items-center gap-2">
            <span>📋</span> Historique complet des membres
          </h2>
          {profiles.length === 0 ? (
            <div className="text-white/30 text-sm text-center py-4">Aucune donnée</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/30 text-xs uppercase tracking-wider border-b border-white/5">
                    <th className="text-left pb-3 pr-4">Membre</th>
                    <th className="text-left pb-3 pr-4">Rôle demandé</th>
                    <th className="text-left pb-3 pr-4">Statut</th>
                    <th className="text-left pb-3">Inscrit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {profiles.map(p => {
                    const cat = ROLE_CATEGORIES.find(c => c.id === p.role_category);
                    const statusConfig: Record<string, { label: string; cls: string }> = {
                      approved:         { label: "Approuvé",    cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
                      pending_approval: { label: "En attente",  cls: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
                      pending_role:     { label: "Sans rôle",   cls: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
                      rejected:         { label: "Refusé",      cls: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
                    };
                    const sc = statusConfig[p.status] ?? { label: p.status, cls: "bg-white/10 text-white/50 border-white/10" };
                    return (
                      <tr key={p.user_id} className="group hover:bg-white/3">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                              style={{ background: cat ? cat.color + "25" : "#ffffff15", border: `1px solid ${cat?.color ?? "#ffffff"}20` }}>
                              {getInitials(p.full_name, p.email)}
                            </div>
                            <span className="text-white/80 truncate max-w-[160px]">{p.full_name ?? p.email ?? "—"}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          {p.role_name ? (
                            <div className="flex items-center gap-1.5">
                              {cat && <span className="text-xs">{cat.emoji}</span>}
                              <span className="text-white/60 truncate max-w-[160px]">{p.role_name}</span>
                            </div>
                          ) : (
                            <span className="text-white/20">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${sc.cls}`}>
                            {sc.label}
                          </span>
                        </td>
                        <td className="py-3 text-white/30 text-xs whitespace-nowrap">{timeAgo(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
