"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { STAFF_FOCUS_RING, StaffEmptyState, StaffPanel, StaffShell } from "@/components/staff/StaffDesignSystem";

type FeedbackRow = {
  id: string;
  type: string;
  status: string;
  created_at: string;
};

type TimePoint = { label: string; value: number };
type CategoryPoint = { label: string; pct: number; color: string };
type PeriodKey = "W" | "1M" | "3M" | "6M" | "1A";

const CATEGORY_COLORS: Record<string, string> = {
  bug: "#fb923c",
  feature: "#38bdf8",
  idea: "#a78bfa",
  compliment: "#34d399",
  other: "#94a3b8",
};
const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Fonctionnalité",
  idea: "Idée",
  compliment: "Compliment",
  other: "Autre",
};

function getLast6Months(): { key: string; label: string }[] {
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    months.push({ key, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return months;
}

function getCurrentWeekBounds(now = new Date()): { start: Date; end: Date } {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay(); // 0 = Sunday, 1 = Monday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMonday);

  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

function getPeriodStart(period: PeriodKey, now = new Date()): Date {
  if (period === "W") return getCurrentWeekBounds(now).start;

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "1M") start.setMonth(start.getMonth() - 1);
  if (period === "3M") start.setMonth(start.getMonth() - 3);
  if (period === "6M") start.setMonth(start.getMonth() - 6);
  if (period === "1A") start.setFullYear(start.getFullYear() - 1);
  return start;
}

function getWeekPoints(rows: FeedbackRow[], now = new Date()): TimePoint[] {
  const labels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const { start, end } = getCurrentWeekBounds(now);
  const points = labels.map((label) => ({ label, value: 0 }));

  rows.forEach((r) => {
    const date = new Date(r.created_at);
    if (Number.isNaN(date.getTime())) return;
    if (date < start || date >= end) return;

    const day = date.getDay();
    const idx = day === 0 ? 6 : day - 1;
    points[idx].value += 1;
  });

  return points;
}

// Bar chart SVG
function BarChart({ data }: { data: TimePoint[] }) {
  if (!data.length) return <div className="text-center py-8 text-gray-400 text-sm">Aucune donnée disponible</div>;
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartH = 110;
  const barW = 32;
  const gap = 14;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <svg width="100%" viewBox={`0 0 ${totalW + 20} ${chartH + 30}`} preserveAspectRatio="xMidYMid meet">
      {data.map((d, i) => {
        const h = Math.max((d.value / maxVal) * chartH, 2);
        const x = i * (barW + gap);
        const y = chartH - h;
        return (
          <g key={d.label}>
            <defs>
              <linearGradient id={`bar-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <rect x={x} y={y} width={barW} height={h} rx={6} fill={`url(#bar-${i})`} />
            {d.value > 0 && <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#94a3b8">{d.value}</text>}
            <text x={x + barW / 2} y={chartH + 18} textAnchor="middle" fontSize="11" fill="#64748b">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// Donut chart SVG
function DonutChart({ data }: { data: CategoryPoint[] }) {
  if (!data.length) return <div className="text-center py-8 text-gray-400 text-sm">Aucun feedback enregistré</div>;
  const r = 50;
  const cx = 80;
  const cy = 70;
  const strokeW = 18;
  const circumference = 2 * Math.PI * r;
  // Pre-compute cumulative offsets to avoid mutation during render
  const offsets = data.map((_, i) =>
    data.slice(0, i).reduce((sum, d) => sum + d.pct, 0)
  );

  return (
    <svg width="100%" viewBox="0 0 200 160" preserveAspectRatio="xMidYMid meet">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeW} />
      {data.map((d, idx) => {
        const dash = (d.pct / 100) * circumference;
        const gap2 = circumference - dash;
        const rotation = (offsets[idx] / 100) * 360 - 90;
        return (
          <circle
            key={d.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={d.color}
            strokeWidth={strokeW}
            strokeDasharray={`${dash} ${gap2}`}
            strokeDashoffset={0}
            transform={`rotate(${rotation}, ${cx}, ${cy})`}
            strokeLinecap="butt"
          />
        );
      })}
      {data.map((d, i) => (
        <g key={d.label} transform={`translate(140, ${20 + i * 22})`}>
          <rect x={0} y={-8} width={10} height={10} rx={3} fill={d.color} />
          <text x={15} y={0} fontSize="10" fill="#94a3b8">{d.label}</text>
          <text x={115} y={0} fontSize="10" fill="#e2e8f0" textAnchor="end">{d.pct}%</text>
        </g>
      ))}
    </svg>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<PeriodKey>("W");
  const [loading, setLoading] = useState(true);
  const [series, setSeries] = useState<TimePoint[]>([]);
  const [categories, setCategories] = useState<CategoryPoint[]>([]);
  const [kpis, setKpis] = useState({
    total: 0,
    resolved: 0,
    resolutionRate: 0,
    newCount: 0,
    inProgress: 0,
    members: 0,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
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

      if (!response.ok) {
        setLoading(false);
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        feedbackRows?: FeedbackRow[];
        counts?: { approvedMembers?: number };
      } | null;

      const rows: FeedbackRow[] = (payload?.feedbackRows ?? []) as FeedbackRow[];
      const memberCount = payload?.counts?.approvedMembers ?? 0;

      const now = new Date();
      const periodStart = getPeriodStart(period, now);
      const filteredRows = rows.filter((r) => {
        const created = new Date(r.created_at);
        if (Number.isNaN(created.getTime())) return false;
        return created >= periodStart;
      });

      // KPIs
      const total = filteredRows.length;
      const resolved = filteredRows.filter((r) => r.status === "done").length;
      const inProgress = filteredRows.filter((r) => r.status === "in-progress").length;
      const newCount = filteredRows.filter((r) => r.status === "new").length;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      setKpis({ total, resolved, resolutionRate, newCount, inProgress, members: memberCount });

      // Série temporelle
      if (period === "W") {
        setSeries(getWeekPoints(filteredRows, now));
      } else {
        const last6 = getLast6Months();
        const monthMap: Record<string, number> = {};
        last6.forEach((m) => {
          monthMap[m.key] = 0;
        });
        filteredRows.forEach((r) => {
          const key = r.created_at.slice(0, 7);
          if (key in monthMap) monthMap[key]++;
        });
        setSeries(last6.map((m) => ({ label: m.label, value: monthMap[m.key] })));
      }

      // Catégories
      const typeCounts: Record<string, number> = {};
      filteredRows.forEach((r) => {
        typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
      });
      const catData: CategoryPoint[] = Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([type, count]) => ({
          label: CATEGORY_LABELS[type] ?? type,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
          color: CATEGORY_COLORS[type] ?? "#94a3b8",
        }));
      setCategories(catData);

      setLoading(false);
    }
    load();
  }, [period]);

  return (
    <StaffShell maxWidthClass="max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytiques</h1>
          <p className="text-sm text-gray-400 mt-0.5">Performances de la plateforme ({period === "W" ? "semaine en cours" : period})</p>
        </div>
        <div className="flex items-center gap-3">
          {[
            { key: "W", label: "Semaine" },
            { key: "1M", label: "1M" },
            { key: "3M", label: "3M" },
            { key: "6M", label: "6M" },
            { key: "1A", label: "1A" },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key as PeriodKey)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${period === p.key ? "bg-indigo-500 text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"} ${STAFF_FOCUS_RING}`}
              aria-label={`Afficher les statistiques ${p.label}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <StaffEmptyState title="Chargement des données" description="Préparation des indicateurs analytiques." />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Taux de Résolution", value: String(kpis.resolutionRate), unit: "%", sub: `${kpis.resolved} / ${kpis.total} feedbacks`, color: "from-emerald-500 to-emerald-700" },
              { label: "Total Feedbacks", value: String(kpis.total), unit: "", sub: `${kpis.newCount} nouveau${kpis.newCount > 1 ? "x" : ""}`, color: "from-sky-500 to-sky-700" },
              { label: "En Cours de Traitement", value: String(kpis.inProgress), unit: "", sub: "Feedbacks actifs", color: "from-amber-500 to-amber-700" },
              { label: "Membres Actifs", value: String(kpis.members), unit: "", sub: "Approuvés", color: "from-violet-500 to-violet-700" },
            ].map((k) => (
              <div key={k.label} className={`rounded-2xl p-5 bg-gradient-to-br ${k.color} text-white shadow-lg`}>
                <div className="text-xs opacity-75 font-medium mb-2">{k.label}</div>
                <div className="text-3xl font-bold tabular-nums">{k.value}<span className="text-lg font-normal opacity-70">{k.unit}</span></div>
                <div className="text-xs opacity-60 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Bar Chart */}
          <StaffPanel>
            <h2 className="text-base font-bold mb-1 text-white">{period === "W" ? "Volume de Feedbacks — Semaine en cours" : "Volume de Feedbacks"}</h2>
            <p className="text-xs text-gray-400 mb-4">{period === "W" ? "Nombre de feedbacks reçus par jour" : "Nombre de feedbacks reçus par mois"}</p>
            <BarChart data={series} />
          </StaffPanel>

          {/* Donut + Barres catégories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StaffPanel>
              <h2 className="text-base font-bold mb-1 text-white">Répartition par Catégorie</h2>
              <p className="text-xs text-gray-400 mb-4">Distribution des feedbacks par type</p>
              <DonutChart data={categories} />
            </StaffPanel>
            <StaffPanel>
              <h2 className="text-base font-bold mb-1 text-white">Détail Catégories</h2>
              <p className="text-xs text-gray-400 mb-4">Volume et pourcentage par type</p>
              {categories.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Aucun feedback enregistré</div>
              ) : (
                <div className="flex flex-col gap-3 mt-2">
                  {categories.map((c) => (
                    <div key={c.label} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: c.color }} />
                      <span className="text-sm text-gray-300 flex-1">{c.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${c.pct}%`, background: c.color, opacity: 0.8 }} />
                      </div>
                      <span className="text-sm font-semibold text-white/80 w-8 text-right">{c.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </StaffPanel>
          </div>

          {/* Statuts */}
          <StaffPanel>
            <h2 className="text-base font-bold mb-1 text-white">Répartition par Statut</h2>
            <p className="text-xs text-gray-400 mb-4">État actuel de tous les feedbacks</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Nouveaux", value: kpis.newCount, color: "bg-sky-500/70" },
                { label: "En cours", value: kpis.inProgress, color: "bg-amber-500/70" },
                { label: "Résolus", value: kpis.resolved, color: "bg-emerald-500/70" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-4 ${s.color} text-white text-center`}>
                  <div className="text-3xl font-bold tabular-nums">{s.value}</div>
                  <div className="text-xs opacity-80 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </StaffPanel>
        </>
      )}
    </StaffShell>
  );
}
