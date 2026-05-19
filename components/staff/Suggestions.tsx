"use client";
import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Feedback = {
  id: string;
  name: string | null;
  type: string;
  typeLabel: string | null;
  message: string;
  status: string;
  note: string | null;
  creatorUpdate: string | null;
  adminComment: string | null;
  resolutionSummary: string | null;
  creatorReply: string | null;
  url: string | null;
  date: string;
};

const STATUS_COLORS: Record<string, string> = {
  "new": "bg-sky-500/20 text-sky-300 border-sky-500/20",
  "in-progress": "bg-amber-500/20 text-amber-300 border-amber-500/20",
  "done": "bg-emerald-500/20 text-emerald-300 border-emerald-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  "new": "Nouveau",
  "in-progress": "En cours",
  "done": "Résolu",
};

const TYPE_LABELS: Record<string, string> = {
  "bug": "🐛 Bug",
  "suggestion": "💡 Suggestion",
  "typo": "✏️ Orthographe",
  "design": "🎨 Design",
  "autre": "📄 Autre",
};

const STATUS_KEYS = ["new", "in-progress", "done"] as const;
const STATUS_DISPLAY: Record<string, string> = { "new": "Nouveaux", "in-progress": "En cours", "done": "Résolus" };

export default function Suggestions() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [token, setToken] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { adminComment: string; resolutionSummary: string; creatorReply: string }>>({});

  const loadFeedbacks = useCallback(async () => {
    const res = await fetch("/api/feedback/list");
    const data = (await res.json().catch(() => ({}))) as { suggestions?: Feedback[] };
    setFeedbacks(data.suggestions ?? []);
  }, []);

  useEffect(() => {
    let disposed = false;

    const boot = async () => {
      try {
        await loadFeedbacks();
      } finally {
        if (!disposed) setLoading(false);
      }
    };

    void boot();

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!disposed) {
        setToken(data.session?.access_token ?? "");
      }
    })();

    const channel = supabase
      .channel("staff-feedbacks")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedbacks" }, async () => {
        await loadFeedbacks();
      })
      .subscribe();

    return () => {
      disposed = true;
      void supabase.removeChannel(channel);
    };
  }, [loadFeedbacks]);

  async function changeStatus(id: string, newStatus: string) {
    const draft = drafts[id] ?? { adminComment: "", resolutionSummary: "", creatorReply: "" };
    await fetch("/api/feedback/status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        id,
        status: newStatus,
        adminComment: draft.adminComment,
        resolutionSummary: draft.resolutionSummary,
        creatorReply: draft.creatorReply,
      }),
    });
    await loadFeedbacks();
  }

  function updateDraft(id: string, patch: Partial<{ adminComment: string; resolutionSummary: string; creatorReply: string }>) {
    setDrafts((prev) => {
      const current = prev[id] ?? { adminComment: "", resolutionSummary: "", creatorReply: "" };
      return { ...prev, [id]: { ...current, ...patch } };
    });
  }

  const filtered = feedbacks
    .filter((f) => {
      const matchSearch =
        f.message.toLowerCase().includes(search.toLowerCase()) ||
        (f.name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "Tous" || f.status === statusFilter;
      return matchSearch && matchStatus;
    });

  const statusCounts = STATUS_KEYS.map((st) => ({
    status: st,
    count: feedbacks.filter((f) => f.status === st).length,
  }));

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Feedbacks & Suggestions</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading
              ? "Chargement..."
              : `${feedbacks.length} retour${feedbacks.length !== 1 ? "s" : ""} · ${feedbacks.filter((f) => f.status === "new").length} nouveau${feedbacks.filter((f) => f.status === "new").length !== 1 ? "x" : ""}`}
          </p>
        </div>
      </div>

      {/* Statut cards */}
      <div className="grid grid-cols-3 gap-3">
        {statusCounts.map((sc) => (
          <button
            key={sc.status}
            onClick={() => setStatusFilter(statusFilter === sc.status ? "Tous" : sc.status)}
            className={`rounded-xl p-3 border text-left transition hover:scale-105 ${statusFilter === sc.status ? "ring-2 ring-white/20" : ""} ${STATUS_COLORS[sc.status]}`}
          >
            <div className="text-xs font-semibold mb-0.5">{STATUS_DISPLAY[sc.status]}</div>
            <div className="text-2xl font-bold tabular-nums">{sc.count}</div>
          </button>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3">
        <input
          className="flex-1 rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 focus:outline-none focus:border-amber-400 text-white placeholder-gray-400 text-sm"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="Tous">Tous les statuts</option>
          {STATUS_KEYS.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement des feedbacks…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {feedbacks.length === 0 ? "Aucun feedback reçu pour l'instant." : "Aucun résultat pour ce filtre."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((f) => (
            <div key={f.id} className="bg-white/10 rounded-2xl border border-white/10 p-5 flex gap-4 hover:bg-white/15 transition">
              {/* Type badge */}
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-xs px-2 py-1 rounded-lg bg-white/10 text-gray-300">
                  {TYPE_LABELS[f.type] ?? f.type}
                </span>
              </div>

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[f.status] ?? "bg-white/10 text-gray-400 border-white/10"}`}>
                    {STATUS_LABELS[f.status] ?? f.status}
                  </span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed mb-3">{f.message}</p>
                {f.note && (
                  <p className="text-xs text-gray-400 italic border-l-2 border-white/10 pl-3 mb-3">{f.note}</p>
                )}
                {f.creatorUpdate && (
                  <p className="text-xs text-sky-300 border-l-2 border-sky-500/30 pl-3 mb-3">
                    Update demandé par le créateur: {f.creatorUpdate}
                  </p>
                )}
                {f.adminComment && (
                  <p className="text-xs text-amber-200 border-l-2 border-amber-500/30 pl-3 mb-3">
                    Commentaire staff: {f.adminComment}
                  </p>
                )}
                {f.resolutionSummary && (
                  <p className="text-xs text-emerald-200 border-l-2 border-emerald-500/30 pl-3 mb-3">
                    Résumé résolution: {f.resolutionSummary}
                  </p>
                )}
                {f.creatorReply && (
                  <p className="text-xs text-cyan-200 border-l-2 border-cyan-500/30 pl-3 mb-3">
                    Réponse au créateur: {f.creatorReply}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="font-medium text-gray-400">{f.name ?? "Anonyme"}</span>
                  <span>#{f.id}</span>
                  <span>{formatDate(f.date)}</span>
                  {f.url && (
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline truncate max-w-[200px]">
                      {f.url}
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                <select
                  className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs text-gray-300 focus:outline-none"
                  value={f.status}
                  onChange={(e) => changeStatus(f.id, e.target.value)}
                >
                  {STATUS_KEYS.map((st) => (
                    <option key={st} value={st}>{STATUS_LABELS[st]}</option>
                  ))}
                </select>
                <textarea
                  rows={2}
                  placeholder="Commentaire staff"
                  className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs text-gray-300 focus:outline-none"
                  value={drafts[f.id]?.adminComment ?? f.adminComment ?? ""}
                  onChange={(e) => updateDraft(f.id, { adminComment: e.target.value })}
                />
                <textarea
                  rows={2}
                  placeholder="Résumé de résolution"
                  className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs text-gray-300 focus:outline-none"
                  value={drafts[f.id]?.resolutionSummary ?? f.resolutionSummary ?? ""}
                  onChange={(e) => updateDraft(f.id, { resolutionSummary: e.target.value })}
                />
                <textarea
                  rows={2}
                  placeholder="Réponse au créateur"
                  className="rounded-lg px-2 py-1.5 bg-white/10 border border-white/10 text-xs text-gray-300 focus:outline-none"
                  value={drafts[f.id]?.creatorReply ?? f.creatorReply ?? ""}
                  onChange={(e) => updateDraft(f.id, { creatorReply: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
