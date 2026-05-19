"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText, Paperclip, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import MonarkIcon from "./MonarkIcon";
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";

type Message = {
  id: string | number;
  role: "user" | "assistant";
  text: string;
};

type PendingMessage = {
  id: string;
  seq: number;
  content: string;
  files: File[];
  status: "sending" | "sent" | "error";
  timestamp: number;
  memoryMode: MemoryMode;
  history: Array<{ role: "user" | "assistant"; content: string }>;
};

type PanelSize = "normal" | "large" | "wide";
type MemoryMode = "memory" | "incognito";
const MAX_PENDING = 5;
const MAX_FILES_BYTES = 20 * 1024 * 1024; // 20 MB total par envoi

export default function MonarkQuickAssistant() {
  const [open, setOpen] = useState(false);
  const [panelSize, setPanelSize] = useState<PanelSize>("normal");
  const [memoryMode, setMemoryMode] = useState<MemoryMode>("memory");
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: "assistant", text: "Monark prêt. Que voulez-vous accomplir maintenant ?" },
  ]);
  const [userId, setUserId] = useState<string>("");
  const messagesRef = useRef<Message[]>(messages);
  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Garantit l'ordre strict des réponses assistant même en envois parallèles
  const nextSeqRef = useRef<number>(0); // prochain slot à afficher
  const seqCounterRef = useRef<number>(0); // compteur assigné à chaque envoi
  const pendingRepliesRef = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [pendingMessages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    async function resolveUser() {
      const { data: sessionData } = await supabase.auth.getSession();
      const id = sessionData.session?.user?.id ?? "";
      setUserId(id);
    }
    void resolveUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/chat/history?userId=${encodeURIComponent(userId)}&days=30`);
        const result = await response.json().catch(() => ({})) as {
          success?: boolean;
          conversations?: Array<{ id: string; message: string; role: "user" | "assistant"; created_at?: string }>;
        };

        if (result.success && Array.isArray(result.conversations)) {
          const mapped = result.conversations
            .filter((conv) => conv && (conv.role === "user" || conv.role === "assistant"))
            .map((conv) => ({
              id: conv.id,
              text: conv.message,
              role: conv.role,
            }));

          if (mapped.length > 0) {
            setMessages(mapped);
            messagesRef.current = mapped;
            // Rebase de l'ordre assistant après rechargement historique
            nextSeqRef.current = 0;
            seqCounterRef.current = 0;
            pendingRepliesRef.current.clear();
          }
        }
      } catch (error) {
        console.error("Erreur chargement historique:", error);
      }
    };

    void loadHistory();
  }, [userId]);

  async function resetMemory() {
    if (resetting) return;
    setResetting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;
      await fetch("/api/staff/malaika", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([{ id: Date.now(), role: "assistant", text: "Mémoire réinitialisée. Je repars de zéro." }]);
    } finally {
      setResetting(false);
    }
  }

  function cyclePanelSize() {
    setPanelSize((prev) => {
      if (prev === "normal") return "large";
      if (prev === "large") return "wide";
      return "normal";
    });
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 6));
    event.target.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  const panelSizeClass =
    panelSize === "normal"
      ? "w-[92vw] max-w-[390px] h-[560px]"
      : panelSize === "large"
        ? "w-[95vw] max-w-[560px] h-[72vh]"
        : "w-[97vw] max-w-[980px] h-[86vh]";

  // Flush les réponses en attente dans l'ordre séquentiel
  function flushOrderedReplies() {
    const map = pendingRepliesRef.current;
    while (map.has(nextSeqRef.current)) {
      const reply = map.get(nextSeqRef.current)!;
      map.delete(nextSeqRef.current);
      nextSeqRef.current += 1;
      setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role: "assistant", text: reply }]);
    }
  }

  async function dispatchPendingMessage(item: PendingMessage) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setPendingMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: "error" } : m)));
        pendingRepliesRef.current.set(item.seq, "Session expirée. Reconnecte-toi pour continuer.");
        flushOrderedReplies();
        return;
      }

      await fetch("/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: item.content,
          role: "user",
          files: item.files.map((f) => f.name),
          userId,
        }),
      });

      const res = item.files.length > 0
        ? await (async () => {
            const formData = new FormData();
            formData.append("messages", JSON.stringify(item.history));
            formData.append("memoryMode", item.memoryMode);
            item.files.forEach((file) => formData.append("files", file));

            return fetch("/api/staff/malaika", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            });
          })()
        : await fetch("/api/staff/malaika", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messages: item.history,
              memoryMode: item.memoryMode,
            }),
          });

      if (!res.ok) {
        throw new Error("Erreur serveur");
      }

      const payload = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply = payload.reply ?? payload.error ?? "Je n'ai pas pu répondre pour le moment.";

      await fetch("/api/chat/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: reply,
          role: "assistant",
          files: [],
          userId,
        }),
      });

      // Enregistre la réponse à sa position séquentielle, puis flush
      pendingRepliesRef.current.set(item.seq, reply);
      flushOrderedReplies();

      setPendingMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: "sent" } : m)));
      setTimeout(() => {
        setPendingMessages((prev) => prev.filter((m) => m.id !== item.id));
      }, 2000);
    } catch {
      setPendingMessages((prev) => prev.map((m) => (m.id === item.id ? { ...m, status: "error" } : m)));
      pendingRepliesRef.current.set(item.seq, "Connexion impossible, réessayez dans un instant.");
      flushOrderedReplies();
    }
  }

  async function send() {
    const content = input.trim();
    if (!content && selectedFiles.length === 0) return;
    if (!userId) {
      window.alert("Session introuvable. Reconnecte-toi puis réessaie.");
      return;
    }
    if (pendingMessages.length >= MAX_PENDING) {
      window.alert(`Attends ! ${pendingMessages.length} messages en cours d'envoi.`);
      return;
    }

    // Vérification taille totale des fichiers
    const totalBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);
    if (totalBytes > MAX_FILES_BYTES) {
      const mb = (totalBytes / 1024 / 1024).toFixed(1);
      setFileSizeError(`Fichiers trop volumineux (${mb} MB). Limite : 20 MB par envoi.`);
      return;
    }
    setFileSizeError(null);

    const seq = seqCounterRef.current++;
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const filesToSend = [...selectedFiles];
    const effectiveContent = content || "Analyse les fichiers joints.";
    const outgoingPreview = [effectiveContent, ...filesToSend.map((file) => `📎 ${file.name}`)].join("\n");

    const userMessage: Message = { id: Date.now(), role: "user", text: outgoingPreview };
    let pendingHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
    setMessages((prev) => {
      const next = [...prev, userMessage];
      messagesRef.current = next;
      pendingHistory = next.map((m) => ({ role: m.role, content: m.text }));
      return next;
    });

    setInput("");
    setSelectedFiles([]);
    textareaRef.current?.focus();

    const pendingItem: PendingMessage = {
      id: messageId,
      seq,
      content: effectiveContent,
      files: filesToSend,
      status: "sending",
      timestamp: Date.now(),
      memoryMode,
      history: pendingHistory,
    };

    setPendingMessages((prev) => [...prev, pendingItem]);
    void dispatchPendingMessage(pendingItem);
  }

  function retryMessage(messageId: string) {
    const msg = pendingMessages.find((m) => m.id === messageId);
    if (!msg) return;

    setInput(msg.content);
    setSelectedFiles(msg.files);
    setPendingMessages((prev) => prev.filter((m) => m.id !== messageId));
  }
  const sendingCount = pendingMessages.filter((m) => m.status === "sending").length;

  return (
    <div className="fixed right-4 bottom-24 md:bottom-6 z-40">
      {open ? (
        <div className={`${panelSizeClass} rounded-[1.8rem] border border-cyan-400/[0.08] bg-[linear-gradient(160deg,rgba(4,10,24,0.58),rgba(7,18,40,0.42),rgba(3,9,20,0.68))] backdrop-blur-3xl shadow-[0_20px_80px_rgba(0,0,0,0.38),0_0_0_1px_rgba(255,255,255,0.03)] flex flex-col overflow-hidden`}
          style={{ WebkitBackdropFilter: "blur(48px)" }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2.5 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]">
            <MonarkIcon size={26} />
            <div>
              <div className="text-sm font-bold text-white drop-shadow-sm">Monark</div>
              <div className="text-[11px] text-sky-200/60">{memoryMode === "incognito" ? "Mode incognito" : "Mode mémoire"}</div>
            </div>
            <button
              onClick={() => setMemoryMode((prev) => (prev === "memory" ? "incognito" : "memory"))}
              className="px-2.5 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.11] text-[11px] font-semibold text-white/65 hover:text-white transition"
              aria-label="Basculer mode mémoire incognito"
              title="Basculer mode mémoire/incognito"
            >
              {memoryMode === "memory" ? "Incognito" : "Mémoire"}
            </button>
            <button
              onClick={() => void resetMemory()}
              disabled={resetting}
              className="px-2.5 h-8 rounded-lg bg-red-500/[0.12] hover:bg-red-500/[0.25] text-[11px] font-semibold text-red-300/80 hover:text-red-200 transition disabled:opacity-40"
              aria-label="Réinitialiser la mémoire Monark"
              title="Effacer toute la mémoire de Monark"
            >
              {resetting ? "…" : "Réinit."}
            </button>
            <button
              onClick={cyclePanelSize}
              className="px-2.5 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.11] text-[11px] font-semibold text-white/65 hover:text-white transition"
              aria-label="Agrandir Monark"
              title="Changer la taille"
            >
              {panelSize === "normal" ? "Agrandir" : panelSize === "large" ? "Panoramique" : "Normal"}
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.12] text-white/55 hover:text-white transition"
              aria-label="Réduire Monark"
            >
              −
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[84%] rounded-[1.45rem] px-3.5 py-2.5 text-sm leading-relaxed backdrop-blur-xl shadow-[0_12px_34px_rgba(2,8,22,0.24)] border ${
                  m.role === "user"
                    ? "bg-[linear-gradient(145deg,rgba(14,165,233,0.40),rgba(37,99,235,0.28),rgba(14,165,233,0.18))] text-white border-cyan-300/10 rounded-br-sm"
                    : "bg-[linear-gradient(145deg,rgba(255,255,255,0.08),rgba(56,189,248,0.10),rgba(15,23,42,0.32))] text-white border-white/[0.08] rounded-bl-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sendingCount > 0 && <div className="text-xs text-sky-200/60 animate-pulse">Monark réfléchit…</div>}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(255,255,255,0.03))] space-y-3">
            {fileSizeError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-300/25 bg-red-500/12 px-3 py-2 text-[11px] text-red-100">
                <AlertCircle size={13} className="shrink-0 text-red-300" />
                <span className="flex-1">{fileSizeError}</span>
                <button
                  type="button"
                  onClick={() => setFileSizeError(null)}
                  className="shrink-0 text-red-200/60 hover:text-red-100"
                  aria-label="Fermer"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${file.size}-${index}`} className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/80">
                    <FileText size={13} className="text-sky-200" />
                    <span className="max-w-[180px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Retirer ${file.name}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {pendingMessages.length > 0 && (
              <div className="text-[11px] text-sky-200/80 rounded-full px-3 py-1 w-fit border border-sky-300/20 bg-sky-500/15 animate-pulse">
                📤 {pendingMessages.length} message(s) en cours d'envoi...
              </div>
            )}

            {pendingMessages.length > 0 && (
              <div className="space-y-1.5">
                {pendingMessages.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/85"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      {m.status === "sending" && <Clock size={13} className="text-sky-200" />}
                      {m.status === "sent" && <CheckCircle2 size={13} className="text-emerald-300" />}
                      {m.status === "error" && <AlertCircle size={13} className="text-red-300" />}
                      <span className="truncate max-w-[240px]">{m.content || "Fichiers joints"}</span>
                      <span className="text-[10px] text-white/45">{new Date(m.timestamp).toLocaleTimeString()}</span>
                    </div>

                    {m.status === "error" && (
                      <button
                        type="button"
                        onClick={() => retryMessage(m.id)}
                        className="rounded-md border border-red-200/30 px-2 py-0.5 text-[10px] font-semibold text-red-100 hover:bg-red-400/20"
                      >
                        Reessayer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sky-200 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-40"
                aria-label="Joindre des fichiers"
                title="Joindre des fichiers"
              >
                <Paperclip size={18} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.log,.csv,.json,.md,.jpg,.jpeg,.png,.gif,.webp"
                className="hidden"
                onChange={handleFileSelect}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={
                  sendingCount > 0
                    ? `${sendingCount} message(s) en cours d'envoi...`
                    : (memoryMode === "incognito" ? "Demandez en mode incognito…" : "Demandez une action à Monark…")
                }
                rows={1}
                disabled={false}
                className="flex-1 max-h-28 min-h-11 resize-none rounded-xl px-3 py-2.5 bg-white/[0.04] border border-white/10 text-white placeholder:text-white/28 text-sm focus:outline-none focus:border-sky-400/45 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
              />
              <div className={`${!input.trim() && selectedFiles.length === 0 ? "opacity-40 pointer-events-none" : ""} drop-shadow-[0_0_14px_rgba(56,189,248,0.45)]`}>
                <LiquidMetalButton
                  label="Go"
                  tinted
                  onClick={() => void send()}
                  width={84}
                  height={44}
                  fontSize={13}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Bouton fermé — vrai Liquid Metal shader */
        <div className="shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          <LiquidMetalButton
            label="Monark"
            tinted
            onClick={() => setOpen(true)}
            width={160}
            height={52}
            fontSize={13}
            leftIcon={<MonarkIcon size={18} />}
          />
        </div>
      )}
    </div>
  );
}
