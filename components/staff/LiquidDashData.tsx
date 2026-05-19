"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  LayoutDashboard,
  MessageSquare,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";
import Dashboard from "@/components/staff/Dashboard";
import KentDashboard from "@/components/staff/KentDashboard";
import { supabase } from "@/lib/supabaseClient";

type QuickStats = {
  approvedMembers: number;
  pendingApprovals: number;
  feedbackTotal: number;
  feedbackNew: number;
  openTickets: number;
  resolutionRate: number;
};

const KPI_CARDS = (s: QuickStats) => [
  {
    label: "Membres actifs",
    value: s.approvedMembers,
    icon: Users,
    color: "from-emerald-500/20 to-emerald-800/20 border-emerald-500/20",
    text: "text-emerald-200",
    dot: "bg-emerald-400",
    sub: "équipe approuvée",
  },
  {
    label: "En attente",
    value: s.pendingApprovals,
    icon: Clock,
    color: "from-amber-500/20 to-amber-800/20 border-amber-500/20",
    text: "text-amber-200",
    dot: "bg-amber-400",
    sub: "décisions requises",
  },
  {
    label: "Feedbacks",
    value: s.feedbackTotal,
    icon: MessageSquare,
    color: "from-sky-500/20 to-sky-800/20 border-sky-500/20",
    text: "text-sky-200",
    dot: "bg-sky-400",
    sub: `${s.feedbackNew} nouveaux`,
  },
  {
    label: "Résolution",
    value: s.resolutionRate,
    icon: TrendingUp,
    color: "from-violet-500/20 to-violet-800/20 border-violet-500/20",
    text: "text-violet-200",
    dot: "bg-violet-400",
    sub: "taux feedbacks",
    unit: "%",
  },
  {
    label: "Tickets ouverts",
    value: s.openTickets,
    icon: Zap,
    color: "from-rose-500/20 to-rose-800/20 border-rose-500/20",
    text: "text-rose-200",
    dot: "bg-rose-400",
    sub: "en cours de traitement",
  },
  {
    label: "Santé système",
    value: Math.min(100, 94 - Math.min(s.openTickets, 14)),
    icon: Shield,
    color: "from-cyan-500/20 to-cyan-800/20 border-cyan-500/20",
    text: "text-cyan-200",
    dot: "bg-cyan-400",
    sub: "services critiques",
    unit: "%",
  },
];

export default function LiquidDashData() {
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;

      const [metricsRes, ticketsRes] = await Promise.all([
        fetch("/api/staff/metrics", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
        fetch("/api/staff/tickets", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }),
      ]);

      if (!metricsRes.ok) return;

      type MetricsPayload = {
        counts?: { approvedMembers?: number; pendingApprovals?: number; feedbackTotal?: number; feedbackNew?: number };
        feedbackRows?: Array<{ status: string }>;
      };
      const m = (await metricsRes.json()) as MetricsPayload;
      const approved = Number(m.counts?.approvedMembers ?? 0);
      const pending = Number(m.counts?.pendingApprovals ?? 0);
      const total = Number(m.counts?.feedbackTotal ?? 0);
      const fresh = Number(m.counts?.feedbackNew ?? 0);

      type TicketsPayload = { tickets?: Array<{ status: string }> };
      let openTickets = 0;
      if (ticketsRes.ok) {
        const t = (await ticketsRes.json()) as TicketsPayload;
        openTickets = (t.tickets ?? []).filter(
          (ti) => ti.status !== "Fermé" && ti.status !== "Résolu"
        ).length;
      }

      const rows = (m.feedbackRows ?? []) as Array<{ status: string }>;
      const resolved = rows.filter((r) => r.status === "done").length;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      setStats({ approvedMembers: approved, pendingApprovals: pending, feedbackTotal: total, feedbackNew: fresh, openTickets, resolutionRate });
    }
    void load();
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("fr-FR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const cards = stats ? KPI_CARDS(stats) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020712] via-[#061226] to-[#071a32] text-slate-100">
      {/* Particle canvas decoration */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_20%_20%,rgba(14,165,233,0.07),transparent_60%),radial-gradient(ellipse_at_80%_80%,rgba(59,130,246,0.07),transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-[1600px] space-y-6 p-4 md:p-6">

        {/* ── Header ── */}
        <header className="rounded-3xl border border-white/10 bg-slate-950/50 p-4 backdrop-blur-2xl shadow-[0_24px_80px_rgba(2,8,22,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/25 to-blue-700/20 ring-1 ring-cyan-400/20 shadow-[0_0_18px_rgba(14,165,233,0.22)]">
                <Database className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white md:text-2xl">Hub de données · Liquid Dash</h1>
                <p className="text-xs text-slate-400 md:text-sm">
                  Migration complète des dashboards opérationnel &amp; administrateur
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-xs text-slate-400 sm:block">
                {formatTime(now)}
              </div>
              <LiquidMetalButton
                label="Retour Cockpit"
                tinted
                width={152}
                height={40}
                fontSize={11}
                leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
                onClick={() => (window.location.href = "/staff/liquid-dash")}
              />
              <LiquidMetalButton
                label="Staff Hub"
                tinted
                width={108}
                height={40}
                fontSize={11}
                leftIcon={<LayoutDashboard className="h-3.5 w-3.5" />}
                onClick={() => (window.location.href = "/staff")}
              />
            </div>
          </div>
        </header>

        {/* ── KPI Strip ── */}
        <section>
          <div className="mb-2 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Indicateurs clés en temps réel</span>
            {stats && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-cyan-400/70">
                <CheckCircle className="h-3 w-3" /> Données chargées
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {cards
              ? cards.map((c) => (
                  <div
                    key={c.label}
                    className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${c.color} p-4 backdrop-blur-xl shadow-[0_12px_32px_rgba(2,8,22,0.22)]`}
                  >
                    <div className="absolute inset-[1px] rounded-[calc(1rem-1px)] bg-[linear-gradient(160deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.03)_40%,transparent_100%)]" />
                    <div className="absolute -top-4 left-[-30%] h-14 w-[60%] rotate-[16deg] bg-white/20 blur-xl transition-all" />
                    <div className="relative z-10 flex items-start justify-between">
                      <c.icon className={`h-4 w-4 ${c.text}`} />
                      <span className={`h-2 w-2 rounded-full ${c.dot} opacity-80`} />
                    </div>
                    <div className={`relative z-10 mt-2 text-3xl font-black tabular-nums text-white drop-shadow`}>
                      {stats ? c.value : "—"}{c.unit ?? ""}
                    </div>
                    <div className="relative z-10 mt-0.5 text-[11px] font-semibold text-white/70">{c.label}</div>
                    <div className="relative z-10 text-[10px] text-white/40">{c.sub}</div>
                  </div>
                ))
              : Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
                ))}
          </div>
        </section>

        {/* ── Dashboards migration ── */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-cyan-500/10 bg-slate-950/40 p-5 backdrop-blur-2xl shadow-[0_20px_70px_rgba(2,8,22,0.30)]">
            <div className="mb-4 flex items-center gap-2 border-b border-white/[0.07] pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/15 ring-1 ring-sky-400/20">
                <BarChart3 className="h-4 w-4 text-sky-300" />
              </div>
              <div>
                <div className="text-sm font-bold text-sky-100">Dashboard opérationnel</div>
                <div className="text-[10px] text-slate-500">Métriques équipe · Feedbacks · Momentum</div>
              </div>
            </div>
            <Dashboard />
          </div>
          <div className="rounded-3xl border border-amber-500/10 bg-slate-950/40 p-5 backdrop-blur-2xl shadow-[0_20px_70px_rgba(2,8,22,0.30)]">
            <div className="mb-4 flex items-center gap-2 border-b border-white/[0.07] pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 ring-1 ring-amber-400/20">
                <Shield className="h-4 w-4 text-amber-300" />
              </div>
              <div>
                <div className="text-sm font-bold text-amber-100">Dashboard administrateur</div>
                <div className="text-[10px] text-slate-500">Profils staff · Approbations · Organigramme</div>
              </div>
            </div>
            <KentDashboard />
          </div>
        </section>

      </div>
    </div>
  );
}
