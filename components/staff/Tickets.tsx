"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  StaffEmptyState,
  StaffNotice,
  StaffPanel,
  StaffShell,
} from "@/components/staff/StaffDesignSystem";

// ─── Types ────────────────────────────────────────────────────────────────────

type Ticket = {
  id: string;
  ticket_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  assignee_name: string | null;
  reporter_name: string | null;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: string;
  ticket_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
};

type Attachment = { name: string; url: string };
type AttachmentDraft = { id: string; file: File };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  Ouvert: "bg-sky-500/80 text-white",
  "En cours": "bg-amber-500/80 text-white",
  Résolu: "bg-emerald-500/80 text-white",
  Fermé: "bg-gray-500/60 text-gray-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  Critique: "bg-rose-600/90 text-white",
  Haute: "bg-orange-500/80 text-white",
  Moyenne: "bg-yellow-500/80 text-white",
  Faible: "bg-slate-500/60 text-gray-200",
};

const STATUSES = ["Ouvert", "En cours", "Résolu", "Fermé"];
const PRIORITIES = ["Critique", "Haute", "Moyenne", "Faible"];
const CATEGORIES = ["Mémorial", "Compte", "Paiement", "Technique", "Communication", "Autre"];

const STATUS_TEXT: Record<string, string> = {
  Ouvert: "text-sky-300",
  "En cours": "text-amber-300",
  Résolu: "text-emerald-300",
  Fermé: "text-gray-400",
};

const KANBAN_BORDER: Record<string, string> = {
  Ouvert: "border-sky-500/30 bg-sky-500/5",
  "En cours": "border-amber-500/30 bg-amber-500/5",
  Résolu: "border-emerald-500/30 bg-emerald-500/5",
  Fermé: "border-gray-500/30 bg-gray-500/5",
};

const SETUP_COMMENTS_SQL = `create table if not exists public.ticket_comments (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid not null,
  author_id uuid not null,
  author_name text not null,
  content text not null,
  created_at timestamptz default now() not null
);
alter table public.ticket_comments enable row level security;
create policy "staff can view comments" on public.ticket_comments
  for select using (auth.uid() is not null);
create policy "staff can insert comments" on public.ticket_comments
  for insert with check (auth.uid() is not null);`;

const SETUP_SQL = `create table if not exists public.staff_tickets (
  id uuid default gen_random_uuid() primary key,
  ticket_number bigint generated always as identity,
  title text not null,
  description text,
  status text not null default 'Ouvert',
  priority text not null default 'Moyenne',
  category text not null default 'Autre',
  assignee_id uuid,
  assignee_name text,
  reporter_id uuid,
  reporter_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
alter table public.staff_tickets enable row level security;
create policy "staff can view tickets" on public.staff_tickets
  for select using (auth.uid() is not null);
create policy "staff can insert tickets" on public.staff_tickets
  for insert with check (auth.uid() is not null);
create policy "staff can update tickets" on public.staff_tickets
  for update using (auth.uid() is not null);`;

const STAFF_DEBUG = process.env.NEXT_PUBLIC_STAFF_DEBUG === "1";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function debugLog(label: string, payload?: unknown) {
  if (!STAFF_DEBUG) return;
  if (payload === undefined) console.log(`[TICKETS DEBUG] ${label}`);
  else console.log(`[TICKETS DEBUG] ${label}`, payload);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60 * 60 * 1000) return `il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 24 * 60 * 60 * 1000) return `il y a ${Math.floor(diff / 3600000)}h`;
  if (diff < 3 * 24 * 60 * 60 * 1000) return `il y a ${Math.floor(diff / 86400000)}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const text = String(value ?? "");
  const escaped = text.replace(/"/g, '""');
  return `"${escaped}"`;
}

function parseAttachments(description: string | null): Attachment[] {
  if (!description) return [];
  const match = description.match(/Pièces jointes:\n([\s\S]*?)(?:\n\nFichiers non joints:|$)/);
  if (!match) return [];
  return match[1]
    .split("\n")
    .map((line) => line.match(/^- (.+?): (https?:\/\/.+)$/))
    .filter(Boolean)
    .map((m) => ({ name: m![1].trim(), url: m![2].trim() }));
}

function cleanDescription(description: string | null): string {
  if (!description) return "";
  return description
    .replace(/\n\nPièces jointes:\n[\s\S]*?(?=\n\nFichiers non joints:|$)/, "")
    .replace(/\n\nFichiers non joints:.*$/, "")
    .trim();
}

function isImageUrl(url: string, name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) || /\.(jpg|jpeg|png|gif|webp)/i.test(url);
}

function AttachmentIcon({ name }: { name: string }) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <rect x="1" y="1" width="13" height="13" rx="2" fill="currentColor" opacity="0.2" />
        <path d="M1 10l3.5-3.5 2.5 2.5 2-2 4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="5" cy="5" r="1.3" fill="currentColor" opacity="0.6" />
      </svg>
    );
  }
  if (ext === "pdf") {
    return (
      <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
        <rect x="2" y="1" width="9" height="13" rx="1.5" fill="currentColor" opacity="0.2" />
        <path d="M4 5h6M4 7.5h4M4 10h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M9 1v3.5h3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" fill="none" viewBox="0 0 15 15">
      <rect x="2" y="1" width="9" height="13" rx="1.5" fill="currentColor" opacity="0.2" />
      <path d="M4 5h6M4 8h6M4 11h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── Composant Attachments ────────────────────────────────────────────────────

function AttachmentsViewer({ attachments }: { attachments: Attachment[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  if (attachments.length === 0) return null;
  return (
    <>
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-semibold text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
          <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
            <path d="M10 5.5l-4.5 4.5a3 3 0 01-4.3-4.3l4.5-4.5a1.8 1.8 0 012.6 2.6L3.8 8.3a.6.6 0 01-.9-.9l4.1-4.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          Pièces jointes ({attachments.length})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 hover:bg-white/10 transition group">
              <span className="text-sky-300 shrink-0"><AttachmentIcon name={att.name} /></span>
              <span className="flex-1 text-xs text-gray-200 truncate font-medium" title={att.name}>{att.name}</span>
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition">
                {isImageUrl(att.url, att.name) && (
                  <button onClick={() => setPreview(att.url)}
                    className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/40 text-sky-200 transition" title="Aperçu">
                    <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                      <circle cx="6" cy="6" r="1.8" fill="currentColor" />
                    </svg>
                  </button>
                )}
                <a href={att.url} target="_blank" rel="noopener noreferrer" download
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition" title="Télécharger">
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                    <path d="M6 1v7M3.5 6l2.5 2.5 2.5-2.5M1.5 10.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a href={att.url} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 transition" title="Ouvrir">
                  <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
                    <path d="M6.5 1H11v4.5M5 7L11 1M1 11h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          onClick={() => setPreview(null)}>
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={preview}
              alt="Apercu"
              loading="lazy"
              decoding="async"
              width={1600}
              height={1200}
              className="max-h-[85vh] w-auto max-w-full mx-auto rounded-2xl shadow-2xl"
            />
            <button onClick={() => setPreview(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition">
              ✕
            </button>
            <a href={preview} download onClick={(e) => e.stopPropagation()}
              className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 transition">
              ↓ Télécharger
            </a>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Composant Comments ───────────────────────────────────────────────────────

function CommentsSection({
  ticketId, token, commentsTableExists,
}: {
  ticketId: string;
  token: string | null;
  commentsTableExists: boolean | null;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadComments = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    const res = await fetch(`/api/staff/tickets/${ticketId}/comments`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    });
    if (res.ok) {
      const body = await res.json();
      setComments(body.comments ?? []);
    }
    setLoading(false);
  }, [ticketId, token]);

  useEffect(() => { setLoading(true); setComments([]); void loadComments(); }, [loadComments]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [comments]);

  // Realtime — nouveaux commentaires en direct
  useEffect(() => {
    if (!ticketId || ticketId.startsWith("fallback-")) return;
    const channel = supabase
      .channel(`ticket-comments-${ticketId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_comments", filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        const incoming = payload.new as Comment;
        setComments((prev) => prev.some((c) => c.id === incoming.id) ? prev : [...prev, incoming]);
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [ticketId]);

  async function handlePost() {
    if (!newComment.trim() || posting || !token) return;
    setPosting(true);
    setPostError(null);
    const res = await fetch(`/api/staff/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ content: newComment.trim() }),
      credentials: "include",
    });
    if (res.ok) {
      const { comment } = await res.json() as { comment: Comment };
      setComments((prev) => (prev.some((c) => c.id === comment.id) ? prev : [...prev, comment]));
      setNewComment("");
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setPostError(body.error ?? "Erreur lors de l'envoi.");
    }
    setPosting(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-sky-300 uppercase tracking-wide flex items-center gap-1.5">
        <svg width="12" height="12" fill="none" viewBox="0 0 12 12">
          <path d="M1 2a1.5 1.5 0 011.5-1.5h7A1.5 1.5 0 0111 2v5.5A1.5 1.5 0 019.5 9H5L2 11.5V9H2.5A1.5 1.5 0 011 7.5V2z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        Commentaires ({comments.length})
      </h4>

      {commentsTableExists === false && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 flex flex-col gap-2">
          <p className="text-xs text-amber-200 font-medium">
            Table <code className="bg-amber-500/20 px-1 rounded font-mono text-[10px]">ticket_comments</code> introuvable.
            Exécutez ce SQL dans{" "}
            <a href="https://app.supabase.com/project/ifxamaxcyisbauaiukrc/sql" target="_blank" rel="noopener noreferrer"
              className="underline">Supabase SQL Editor ↗</a>
          </p>
          <div className="relative">
            <pre className="bg-black/40 rounded-lg p-2.5 text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-20 overflow-y-auto">{SETUP_COMMENTS_SQL}</pre>
            <button
              onClick={() => { navigator.clipboard.writeText(SETUP_COMMENTS_SQL); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2500); }}
              className="absolute top-1.5 right-1.5 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 text-[10px] font-medium transition">
              {sqlCopied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-xs text-gray-400 text-center py-3 animate-pulse">Chargement…</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 italic">Aucun commentaire. Soyez le premier à en ajouter.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {c.author_name[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-sky-200">{c.author_name}</span>
                  <span className="text-[10px] text-gray-500" title={formatDateFull(c.created_at)}>{formatDate(c.created_at)}</span>
                </div>
                <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <textarea
          value={newComment}
          onChange={(e) => { setNewComment(e.target.value); setPostError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void handlePost(); }}
          placeholder="Ajouter un commentaire… (Ctrl+Entrée pour envoyer)"
          className="flex-1 rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-sky-400 resize-none min-h-[56px]"
          rows={2}
        />
        <button
          onClick={handlePost}
          disabled={posting || !newComment.trim()}
          className="self-end px-3 py-2 rounded-xl bg-sky-500 text-white text-xs font-semibold hover:bg-sky-600 disabled:opacity-50 transition flex items-center gap-1.5 shrink-0"
          title="Envoyer (Ctrl+Entrée)"
        >
          {posting ? (
            <svg width="13" height="13" viewBox="0 0 13 13" className="animate-spin">
              <circle cx="6.5" cy="6.5" r="5" stroke="white" strokeWidth="2" strokeOpacity="0.25" />
              <path d="M6.5 1.5a5 5 0 015 5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="13" height="13" fill="none" viewBox="0 0 13 13">
              <path d="M1.5 6.5L12 1.5l-4 10-2-4-4.5-1z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
      {postError && <StaffNotice tone="danger" className="text-xs">{postError}</StaffNotice>}
    </div>
  );
}

// ─── Panneau de détail ────────────────────────────────────────────────────────

function TicketDetail({
  ticket, token, commentsTableExists, onClose, onStatusChange, onPriorityChange, onAssigneeChange,
}: {
  ticket: Ticket;
  token: string | null;
  commentsTableExists: boolean | null;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onPriorityChange: (id: string, priority: string) => Promise<void>;
  onAssigneeChange: (id: string, assignee: string) => Promise<void>;
}) {
  const [editingAssignee, setEditingAssignee] = useState(false);
  const [assigneeInput, setAssigneeInput] = useState(ticket.assignee_name ?? "");
  const [savingAssignee, setSavingAssignee] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const attachments = parseAttachments(ticket.description);
  const description = cleanDescription(ticket.description);

  // Reset assignee input when ticket changes
  useEffect(() => {
    setAssigneeInput(ticket.assignee_name ?? "");
    setEditingAssignee(false);
  }, [ticket.id, ticket.assignee_name]);

  async function handleAction(type: "status" | "priority", value: string) {
    setActionLoading(true);
    if (type === "status") await onStatusChange(ticket.id, value);
    else await onPriorityChange(ticket.id, value);
    setActionLoading(false);
  }

  async function saveAssignee() {
    setSavingAssignee(true);
    await onAssigneeChange(ticket.id, assigneeInput.trim());
    setSavingAssignee(false);
    setEditingAssignee(false);
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-sky-300 font-bold text-sm">#{ticket.ticket_number}</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[ticket.status] ?? "bg-gray-500/60 text-gray-200"}`}>
              {ticket.status}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PRIORITY_COLORS[ticket.priority] ?? "bg-slate-500/60 text-gray-200"}`}>
              {ticket.priority}
            </span>
          </div>
          <h2 className="text-sm font-bold text-white leading-snug">{ticket.title}</h2>
        </div>
        <button onClick={onClose}
          className="shrink-0 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-400 hover:text-white transition text-sm"
          aria-label="Fermer">
          ✕
        </button>
      </div>

      {/* Contenu scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

        {/* Actions rapides */}
        <div>
          <p className="text-[10px] font-semibold text-sky-300/70 uppercase tracking-widest mb-2">Actions rapides</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {STATUSES.filter((s) => s !== ticket.status).map((s) => {
              const isFermer = s === "Fermé";
              const isResoudre = s === "Résolu";
              const cls = isFermer
                ? "bg-gray-600/50 hover:bg-gray-600/70 text-gray-200 border-gray-500/30"
                : isResoudre
                ? "bg-emerald-600/50 hover:bg-emerald-600/70 text-emerald-100 border-emerald-500/30"
                : s === "En cours"
                ? "bg-amber-500/40 hover:bg-amber-500/60 text-amber-100 border-amber-400/30"
                : "bg-sky-500/40 hover:bg-sky-500/60 text-sky-100 border-sky-400/30";
              return (
                <button key={s} disabled={actionLoading}
                  onClick={() => handleAction("status", s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition disabled:opacity-50 ${cls}`}>
                  {isFermer ? "🔒 Fermer le ticket" : isResoudre ? "✅ Marquer résolu" : `→ ${s}`}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-gray-500 font-medium">Priorité :</span>
            {PRIORITIES.filter((p) => p !== ticket.priority).map((p) => (
              <button key={p} disabled={actionLoading}
                onClick={() => handleAction("priority", p)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border border-white/10 transition disabled:opacity-50 hover:scale-105 active:scale-95 ${PRIORITY_COLORS[p] ?? "bg-slate-500/60 text-gray-200"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* Métadonnées */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-wide font-medium">Catégorie</span>
            <p className="text-white font-medium mt-0.5">{ticket.category}</p>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-wide font-medium">Rapporteur</span>
            <p className="text-white font-medium mt-0.5">{ticket.reporter_name ?? "—"}</p>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-wide font-medium">Assigné à</span>
            {editingAssignee ? (
              <div className="flex gap-1 mt-0.5">
                <input type="text" value={assigneeInput}
                  onChange={(e) => setAssigneeInput(e.target.value)}
                  className="flex-1 rounded-lg px-2 py-1 bg-white/10 border border-white/20 text-white text-xs focus:outline-none focus:border-sky-400"
                  placeholder="Nom du membre"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") void saveAssignee(); if (e.key === "Escape") setEditingAssignee(false); }}
                />
                <button onClick={saveAssignee} disabled={savingAssignee}
                  className="px-2 rounded-lg bg-sky-500 text-white text-xs disabled:opacity-50 transition">
                  {savingAssignee ? "…" : "OK"}
                </button>
                <button onClick={() => setEditingAssignee(false)}
                  className="px-2 rounded-lg bg-white/10 text-gray-300 text-xs transition hover:bg-white/20">✕</button>
              </div>
            ) : (
              <button
                onClick={() => { setAssigneeInput(ticket.assignee_name ?? ""); setEditingAssignee(true); }}
                className="flex items-center gap-1 mt-0.5 text-white font-medium hover:text-sky-300 transition group">
                {ticket.assignee_name ?? <span className="text-gray-500 italic font-normal">Non assigné</span>}
                <svg width="10" height="10" fill="none" viewBox="0 0 10 10" className="opacity-0 group-hover:opacity-60 transition">
                  <path d="M1 7.5L6.5 2 8 3.5 2.5 9H1V7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase tracking-wide font-medium">Ouvert le</span>
            <p className="text-white font-medium mt-0.5">{formatDateFull(ticket.created_at)}</p>
          </div>
          {ticket.updated_at !== ticket.created_at && (
            <div className="col-span-2">
              <span className="text-gray-500 text-[10px] uppercase tracking-wide font-medium">Mis à jour</span>
              <p className="text-white font-medium mt-0.5">{formatDateFull(ticket.updated_at)}</p>
            </div>
          )}
        </div>

        <div className="border-t border-white/10" />

        {/* Description */}
        {description ? (
          <div>
            <p className="text-[10px] font-semibold text-sky-300/70 uppercase tracking-widest mb-1.5">Description</p>
            <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{description}</p>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">Aucune description fournie.</p>
        )}

        {/* Pièces jointes */}
        {attachments.length > 0 && (
          <>
            <div className="border-t border-white/10" />
            <AttachmentsViewer attachments={attachments} />
          </>
        )}

        <div className="border-t border-white/10" />

        {/* Commentaires */}
        <CommentsSection ticketId={ticket.id} token={token} commentsTableExists={commentsTableExists} />
      </div>
    </div>
  );
}

// ─── Composant Kanban ────────────────────────────────────────────────────────

function KanbanView({
  tickets, selected, onSelect, onStatusChange,
}: {
  tickets: Ticket[];
  selected: string | null;
  onSelect: (id: string) => void;
  onStatusChange: (id: string, status: string) => Promise<void>;
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-3 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4">
        {STATUSES.map((status) => {
          const col = tickets.filter((t) => t.status === status);
          return (
            <div key={status} className={`w-[82vw] sm:w-[48vw] lg:w-auto rounded-2xl border ${KANBAN_BORDER[status] ?? "border-white/20 bg-white/5"} flex flex-col gap-2 p-3 min-h-[200px]`}>
              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className={`text-xs font-bold ${STATUS_TEXT[status] ?? "text-gray-300"}`}>{status}</span>
                <span className="text-xs font-mono text-gray-500 bg-white/5 rounded-full px-2 py-0.5">{col.length}</span>
              </div>
              <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {col.map((t) => (
                  <div key={t.id}
                    onClick={() => onSelect(t.id)}
                    className={`group rounded-xl border p-3 cursor-pointer transition flex flex-col gap-1.5 ${
                      selected === t.id ? "border-sky-400/50 bg-sky-500/10" : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}>
                    <span className="font-mono text-sky-300 text-[10px]">#{t.ticket_number}</span>
                    <p className="text-xs font-medium text-white/90 leading-snug line-clamp-2">{t.title}</p>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[t.priority] ?? "bg-slate-500/60 text-gray-200"}`}>{t.priority}</span>
                      <span className="text-[10px] text-gray-500">{formatDate(t.created_at)}</span>
                    </div>
                    {t.assignee_name && <span className="text-[10px] text-gray-400 truncate">→ {t.assignee_name}</span>}
                    {/* Déplacer vers */}
                    <div className="hidden group-hover:flex gap-1 mt-1">
                      {STATUSES.filter((s) => s !== status).map((s) => (
                        <button key={s}
                          onClick={(e) => { e.stopPropagation(); void onStatusChange(t.id, s); }}
                          title={`Déplacer vers ${s}`}
                          className="flex-1 px-1 py-0.5 rounded-lg text-[9px] font-semibold bg-white/10 hover:bg-white/20 text-gray-300 transition truncate">
                          {s === "Fermé" ? "🔒" : s === "Résolu" ? "✅" : s === "En cours" ? "▶" : "○"} {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {col.length === 0 && (
                  <p className="text-[10px] text-gray-600 text-center py-6 italic">Aucun ticket</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [priorityFilter, setPriorityFilter] = useState("Tous");
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState("Moyenne");
  const [newCategory, setNewCategory] = useState("Autre");
  const [newAssignee, setNewAssignee] = useState("");
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createInfo, setCreateInfo] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const [commentsTableExists, setCommentsTableExists] = useState<boolean | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);
  const [sortBy, setSortBy] = useState<"date" | "priority" | "status">("date");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  // Token Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setToken(data.session?.access_token ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_, s) => setToken(s?.access_token ?? null));
    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const loadTickets = useCallback(async (t: string | null) => {
    if (!t) { setLoading(false); return; }
    debugLog("GET /api/staff/tickets");
    const res = await fetch("/api/staff/tickets", {
      headers: { Authorization: `Bearer ${t}` }, credentials: "include", cache: "no-store",
    });
    if (res.ok) {
      const body = await res.json();
      setTickets(body.tickets ?? []);
      setTableExists(body.tableExists !== false);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (token !== null) void loadTickets(token); }, [token, loadTickets]);

  // Realtime — mises à jour tickets en direct
  useEffect(() => {
    if (!token) return;
    const channel = supabase
      .channel("staff-tickets-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "staff_tickets" }, (payload) => {
        const updated = payload.new as Ticket;
        setTickets((prev) => prev.map((t) => t.id === updated.id ? updated : t));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "staff_tickets" }, (payload) => {
        const inserted = payload.new as Ticket;
        setTickets((prev) => prev.some((t) => t.id === inserted.id) ? prev : [inserted, ...prev]);
      })
      .subscribe((status) => setRealtimeConnected(status === "SUBSCRIBED"));
    return () => { void supabase.removeChannel(channel); };
  }, [token]);

  // Raccourcis clavier
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName ?? "";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;
      if (e.key === "Escape") { setSelected(null); setCreating(false); return; }
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) { setCreating(true); }
      if (e.key === "k" && !e.ctrlKey && !e.metaKey && !e.altKey) { setViewMode((v) => v === "list" ? "kanban" : "list"); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Sonder l'existence de la table comments
  useEffect(() => {
    if (!token || tickets.length === 0 || commentsTableExists !== null) return;
    const firstId = tickets[0]?.id;
    if (!firstId || firstId.startsWith("fallback-")) return;
    fetch(`/api/staff/tickets/${firstId}/comments`, {
      headers: { Authorization: `Bearer ${token}` }, credentials: "include",
    }).then(async (res) => {
      if (res.ok) {
        const body = await res.json();
        setCommentsTableExists(body.tableExists !== false);
      }
    });
  }, [token, tickets, commentsTableExists]);

  const filtered = tickets
    .filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        String(t.ticket_number).includes(search) ||
        (t.reporter_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (t.assignee_name ?? "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "Tous" || t.status === statusFilter;
      const matchPriority = priorityFilter === "Tous" || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      if (sortBy === "priority") {
        const ord = ["Critique", "Haute", "Moyenne", "Faible"];
        return ord.indexOf(a.priority) - ord.indexOf(b.priority);
      }
      if (sortBy === "status") {
        const ord = ["Ouvert", "En cours", "Résolu", "Fermé"];
        return ord.indexOf(a.status) - ord.indexOf(b.status);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const stats = [
    { label: "Total", value: tickets.length, color: "from-sky-500 to-blue-600", filterKey: "" },
    { label: "Ouverts", value: tickets.filter((t) => t.status === "Ouvert").length, color: "from-sky-400 to-sky-600", filterKey: "Ouvert" },
    { label: "En cours", value: tickets.filter((t) => t.status === "En cours").length, color: "from-amber-400 to-amber-600", filterKey: "En cours" },
    { label: "Critiques", value: tickets.filter((t) => t.priority === "Critique").length, color: "from-rose-500 to-rose-700", filterKey: "Critique" },
    { label: "Résolus", value: tickets.filter((t) => t.status === "Résolu").length, color: "from-emerald-400 to-emerald-600", filterKey: "Résolu" },
  ];

  const selectedTicket = selected ? tickets.find((t) => t.id === selected) ?? null : null;

  function addFiles(files: File[]) {
    const n = files.filter((f) => f.size > 0).slice(0, 6).map((f) => ({ id: `${Date.now()}-${Math.random()}`, file: f }));
    setAttachments((prev) => [...prev, ...n].slice(0, 6));
  }

  async function handlePasteCapture(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files: File[] = [];
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.kind === "file") { const f = item.getAsFile(); if (f) files.push(f); }
    }
    if (files.length > 0) { e.preventDefault(); addFiles(files); setCreateInfo("Capture ajoutée depuis le presse-papiers."); }
  }

  async function handleCreate() {
    if (!newTitle.trim() || newTitle.trim().length < 3 || submitting || !token) return;
    setSubmitting(true); setCreateError(null);
    const formData = new FormData();
    formData.set("title", newTitle);
    formData.set("description", newDescription);
    formData.set("priority", newPriority);
    formData.set("category", newCategory);
    if (newAssignee.trim()) formData.set("assignee_name", newAssignee.trim());
    attachments.forEach((a) => formData.append("attachments", a.file));
    const res = await fetch("/api/staff/tickets", {
      method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData, credentials: "include",
    });
    if (res.ok) {
      const { ticket, failedUploads } = await res.json() as { ticket: Ticket; failedUploads?: string[] };
      setTickets((prev) => [ticket, ...prev]);
      setNewTitle(""); setNewDescription(""); setNewAssignee(""); setAttachments([]);
      setCreating(false);
      setCreateInfo(failedUploads?.length ? `Ticket créé. Non joints : ${failedUploads.join(", ")}` : "Ticket créé avec succès.");
      setSelected(ticket.id);
    } else {
      const body = await res.json().catch(() => ({})) as { error?: string };
      setCreateError(body.error ?? "Impossible de créer le ticket.");
    }
    setSubmitting(false);
  }

  async function updateTicketField(id: string, updates: Record<string, string>) {
    if (!token) return;
    const res = await fetch("/api/staff/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, ...updates }),
      credentials: "include",
    });
    if (res.ok) {
      const { ticket } = await res.json() as { ticket: Ticket };
      setTickets((prev) => prev.map((t) => (t.id === id ? ticket : t)));
    }
  }

  function exportCSV() {
    const rows = [
      ["#", "Titre", "Statut", "Priorité", "Catégorie", "Rapporteur", "Assigné", "Créé le"],
      ...filtered.map((t) => [
        escapeCsvCell(t.ticket_number),
        escapeCsvCell(t.title),
        escapeCsvCell(t.status),
        escapeCsvCell(t.priority),
        escapeCsvCell(t.category),
        escapeCsvCell(t.reporter_name),
        escapeCsvCell(t.assignee_name),
        escapeCsvCell(formatDateFull(t.created_at)),
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const hasDetail = !!selectedTicket;

  return (
    <StaffShell maxWidthClass="max-w-[1400px]">

      {/* Banner table manquante */}
      {tableExists === false && (
        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0 text-rose-300">
              <svg width="20" height="20" fill="none" viewBox="0 0 20 20"><path d="M10 3a7 7 0 100 14A7 7 0 0010 3zm0 4v4m0 2.5v.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
            </div>
            <div className="flex-1">
              <p className="font-bold text-rose-200 text-sm">Table <code className="bg-rose-500/20 px-1.5 py-0.5 rounded text-xs font-mono">staff_tickets</code> introuvable</p>
              <p className="text-rose-300/80 text-xs mt-1">Copiez le SQL ci-dessous et exécutez-le dans le SQL Editor Supabase.</p>
            </div>
            <a href="https://app.supabase.com/project/ifxamaxcyisbauaiukrc/sql" target="_blank" rel="noopener noreferrer"
              className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 border border-rose-400/40 text-rose-200 text-xs font-semibold transition">
              SQL Editor ↗
            </a>
          </div>
          <div className="relative">
            <pre className="bg-black/40 border border-white/10 rounded-xl p-4 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{SETUP_SQL}</pre>
            <button onClick={() => { navigator.clipboard.writeText(SETUP_SQL); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 2500); }}
              className="absolute top-2 right-2 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/70 text-xs font-medium transition">
              {sqlCopied ? "✓ Copié" : "Copier"}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Tickets Support</h1>
            <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
              {loading ? "Chargement…" : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ${filtered.length} affiché${filtered.length !== 1 ? "s" : ""}`}
              {!loading && (
                <span title={realtimeConnected ? "Realtime connecté" : "Realtime déconnecté"}
                  className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${realtimeConnected ? "bg-emerald-400" : "bg-gray-600"}`} />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vue toggle */}
          <div className="flex rounded-xl border border-white/20 overflow-hidden">
            <button onClick={() => setViewMode("list")} title="Vue liste (L)" aria-pressed={viewMode === "list"}
              className={`px-3 py-2 text-xs font-semibold transition flex items-center gap-1.5 ${
                viewMode === "list" ? "bg-sky-500/30 text-sky-200" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <path d="M1 3h12M1 7h12M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Liste
            </button>
            <button onClick={() => setViewMode("kanban")} title="Vue Kanban (K)" aria-pressed={viewMode === "kanban"}
              className={`px-3 py-2 text-xs font-semibold transition flex items-center gap-1.5 border-l border-white/20 ${
                viewMode === "kanban" ? "bg-sky-500/30 text-sky-200" : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}>
              <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
                <rect x="1" y="1" width="3.5" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <rect x="5.25" y="1" width="3.5" height="8" rx="1" stroke="currentColor" strokeWidth="1.3" />
                <rect x="9.5" y="1" width="3.5" height="10" rx="1" stroke="currentColor" strokeWidth="1.3" />
              </svg>
              Kanban
            </button>
          </div>
          {/* Export CSV */}
          <button onClick={exportCSV} disabled={filtered.length === 0} title="Exporter en CSV"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/20 text-gray-300 text-xs font-semibold hover:bg-white/10 hover:text-white disabled:opacity-40 transition">
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14">
              <path d="M7 1v8M4.5 7l2.5 2.5 2.5-2.5M1.5 12h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            CSV
          </button>
          {/* Nouveau ticket */}
          <button
            onClick={() => { setCreating(true); setCreateError(null); setCreateInfo(null); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-lg hover:scale-105 transition">
            <svg width="16" height="16" fill="none"><line x1="8" y1="2" x2="8" y2="14" stroke="white" strokeWidth="2" strokeLinecap="round" /><line x1="2" y1="8" x2="14" y2="8" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            Nouveau Ticket
          </button>
        </div>
      </div>

      {createInfo && !creating && <StaffNotice tone="success">{createInfo}</StaffNotice>}

      {/* Stats cliquables */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {stats.map((s) => (
          <button key={s.label}
            onClick={() => {
              if (!s.filterKey) { setStatusFilter("Tous"); setPriorityFilter("Tous"); }
              else if (s.label === "Critiques") setPriorityFilter((p) => p === "Critique" ? "Tous" : "Critique");
              else setStatusFilter((f) => f === s.filterKey ? "Tous" : s.filterKey);
            }}
            className={`rounded-xl p-4 bg-gradient-to-br ${s.color} text-white shadow-lg flex flex-col text-left transition hover:scale-[1.02] active:scale-[0.98]`}>
            <span className="text-xs opacity-75 font-medium">{s.label}</span>
            <span className="text-3xl font-bold tabular-nums mt-1">{s.value}</span>
          </button>
        ))}
      </div>

      {/* Formulaire création */}
      {creating && (
        <StaffPanel className="border-sky-500/30 p-5 flex flex-col gap-4">
          <h2 className="font-bold text-white text-base">Nouveau ticket</h2>
          <input
            className="rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-sky-400"
            placeholder="Titre du ticket (min 3 caractères)…"
            value={newTitle}
            onChange={(e) => { setNewTitle(e.target.value); setCreateError(null); }}
            autoFocus
          />
          <textarea
            className="rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-sky-400 min-h-[100px] resize-none"
            placeholder="Description détaillée, étapes de reproduction, impact utilisateur…"
            value={newDescription}
            onChange={(e) => { setNewDescription(e.target.value); setCreateError(null); setCreateInfo(null); }}
            onPaste={handlePasteCapture}
          />
          <div className="flex gap-3 flex-wrap">
            <select className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white text-sm focus:outline-none" value={newPriority} onChange={(e) => setNewPriority(e.target.value)}>
              {PRIORITIES.map((p) => <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>)}
            </select>
            <select className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white text-sm focus:outline-none" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c} value={c} className="bg-slate-900 text-white">{c}</option>)}
            </select>
            <input
              className="rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-sky-400 flex-1 min-w-[140px]"
              placeholder="Assigner à… (optionnel)"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-sky-200 cursor-pointer">
              <input type="file" className="hidden" multiple onChange={(e) => { addFiles(Array.from(e.target.files ?? [])); e.currentTarget.value = ""; }} />
              <span className="px-3 py-1.5 rounded-lg border border-sky-500/30 bg-sky-500/15 hover:bg-sky-500/25 transition text-xs font-medium">📎 Joindre des fichiers</span>
              <span className="text-xs text-gray-400">ou collez une capture (Ctrl+V)</span>
            </label>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((item) => (
                  <span key={item.id} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-gray-200">
                    {item.file.name}
                    <button type="button" onClick={() => setAttachments((prev) => prev.filter((a) => a.id !== item.id))} className="text-rose-300 hover:text-rose-200" aria-label={`Retirer ${item.file.name}`}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={submitting || newTitle.trim().length < 3}
              className="px-5 py-2 rounded-xl bg-sky-500 text-white font-semibold text-sm hover:bg-sky-600 disabled:opacity-50 transition">
              {submitting ? "Création…" : "Créer le ticket"}
            </button>
            <button onClick={() => { setCreating(false); setCreateError(null); }}
              className="px-5 py-2 rounded-xl bg-white/10 text-gray-300 font-semibold text-sm hover:bg-white/20 transition">
              Annuler
            </button>
          </div>
          {createInfo && <StaffNotice tone="success">{createInfo}</StaffNotice>}
          {createError && <StaffNotice tone="danger">{createError}</StaffNotice>}
        </StaffPanel>
      )}

      {/* Filtres & tri */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          className="rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 focus:outline-none focus:border-sky-400 text-white placeholder-gray-400 text-sm lg:col-span-2"
          placeholder="Rechercher par titre, numéro, rapporteur, assigné…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="Tous" className="bg-slate-900">Tous les statuts</option>
          {STATUSES.map((s) => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
        </select>
        <div className="flex gap-2">
          <select className="flex-1 rounded-xl px-4 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="Tous" className="bg-slate-900">Toutes priorités</option>
            {PRIORITIES.map((p) => <option key={p} value={p} className="bg-slate-900">{p}</option>)}
          </select>
          <select className="rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-xs focus:outline-none" value={sortBy} onChange={(e) => setSortBy(e.target.value as "date" | "priority" | "status")}>
            <option value="date" className="bg-slate-900">↓ Date</option>
            <option value="priority" className="bg-slate-900">↓ Priorité</option>
            <option value="status" className="bg-slate-900">↓ Statut</option>
          </select>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <StaffEmptyState title="Chargement des tickets" description="Récupération des tickets en cours…" />
      ) : tickets.length === 0 ? (
        <StaffEmptyState
          title="Aucun ticket pour l'instant"
          description="Créez le premier ticket pour structurer le support opérationnel de l'équipe."
          actionSlot={
            <button onClick={() => setCreating(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-105">
              <svg width="14" height="14" fill="none"><line x1="7" y1="2" x2="7" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round" /><line x1="2" y1="7" x2="12" y2="7" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
              Nouveau ticket
            </button>
          }
        />
      ) : viewMode === "kanban" ? (
        <div className="flex gap-4 items-start">
          <div className={`flex-1 min-w-0 transition-all duration-300 ${hasDetail ? "hidden lg:block" : "w-full"}`}>
            <KanbanView
              tickets={filtered}
              selected={selected}
              onSelect={(id) => setSelected((prev) => prev === id ? null : id)}
              onStatusChange={async (id, status) => { await updateTicketField(id, { status }); }}
            />
          </div>
          {selectedTicket && (
            <div className="flex-1 min-w-0 rounded-2xl border border-white/20 bg-[rgba(8,18,44,0.75)] backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ maxHeight: "calc(100vh - 180px)", minHeight: "520px", display: "flex", flexDirection: "column" }}>
              <TicketDetail
                ticket={selectedTicket}
                token={token}
                commentsTableExists={commentsTableExists}
                onClose={() => setSelected(null)}
                onStatusChange={async (id, status) => { await updateTicketField(id, { status }); }}
                onPriorityChange={async (id, priority) => { await updateTicketField(id, { priority }); }}
                onAssigneeChange={async (id, assignee_name) => { await updateTicketField(id, { assignee_name }); }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-4 items-start">

          {/* ── Liste ── */}
          <div className={`flex-1 min-w-0 flex flex-col gap-3 transition-all duration-300 ${hasDetail ? "hidden lg:flex lg:max-w-[480px]" : "w-full"}`}>

            {/* Table desktop */}
            <StaffPanel className="p-0 overflow-hidden hidden md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {["#", "Titre", "Statut", "Priorité", "Catégorie", "Assigné", "Date"].map((h) => (
                      <th key={h} className="px-3 py-3 text-left text-[10px] font-semibold text-sky-300 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}
                      className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${selected === t.id ? "bg-sky-500/10" : ""}`}
                      onClick={() => setSelected((prev) => prev === t.id ? null : t.id)}>
                      <td className="px-3 py-2.5 font-mono text-sky-300 font-semibold text-xs whitespace-nowrap">#{t.ticket_number}</td>
                      <td className="px-3 py-2.5 font-medium text-white/90 max-w-[160px] truncate text-xs">{t.title}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_COLORS[t.status] ?? "bg-gray-500/60 text-gray-200"}`}>{t.status}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${PRIORITY_COLORS[t.priority] ?? "bg-slate-500/60 text-gray-200"}`}>{t.priority}</span>
                      </td>
                      <td className="px-3 py-2.5 text-gray-300 text-xs">{t.category}</td>
                      <td className="px-3 py-2.5 text-gray-300 text-xs max-w-[80px] truncate">{t.assignee_name ?? "—"}</td>
                      <td className="px-3 py-2.5 text-gray-400 text-xs whitespace-nowrap">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400 text-sm">Aucun ticket ne correspond aux filtres</td></tr>
                  )}
                </tbody>
              </table>
            </StaffPanel>

            {/* Cards mobile */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((t) => (
                <div key={t.id}
                  className={`rounded-2xl border p-4 flex flex-col gap-2 cursor-pointer transition backdrop-blur-xl shadow ${selected === t.id ? "border-sky-400/50 bg-sky-500/10" : "border-white/20 bg-white/10 hover:bg-white/15"}`}
                  onClick={() => setSelected((prev) => prev === t.id ? null : t.id)}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sky-300 font-semibold text-xs">#{t.ticket_number}</span>
                    <span className="text-xs text-gray-400">{formatDate(t.created_at)}</span>
                  </div>
                  <div className="font-medium text-white/90 text-sm leading-snug">{t.title}</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full px-2.5 py-0.5 font-bold ${STATUS_COLORS[t.status] ?? "bg-gray-500/60 text-gray-200"}`}>{t.status}</span>
                    <span className={`rounded-full px-2.5 py-0.5 font-bold ${PRIORITY_COLORS[t.priority] ?? "bg-slate-500/60 text-gray-200"}`}>{t.priority}</span>
                    <span className="rounded-full px-2.5 py-0.5 bg-white/10 text-gray-300">{t.category}</span>
                  </div>
                  {t.assignee_name && <div className="text-xs text-gray-400">Assigné à : {t.assignee_name}</div>}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Aucun ticket ne correspond aux filtres</p>
              )}
            </div>
          </div>

          {/* ── Panneau détail ── */}
          {selectedTicket && (
            <div className="flex-1 min-w-0 rounded-2xl border border-white/20 bg-[rgba(8,18,44,0.75)] backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{ maxHeight: "calc(100vh - 180px)", minHeight: "520px", display: "flex", flexDirection: "column" }}>
              <TicketDetail
                ticket={selectedTicket}
                token={token}
                commentsTableExists={commentsTableExists}
                onClose={() => setSelected(null)}
                onStatusChange={async (id, status) => { await updateTicketField(id, { status }); }}
                onPriorityChange={async (id, priority) => { await updateTicketField(id, { priority }); }}
                onAssigneeChange={async (id, assignee_name) => { await updateTicketField(id, { assignee_name }); }}
              />
            </div>
          )}
        </div>
      )}
    </StaffShell>
  );
}
