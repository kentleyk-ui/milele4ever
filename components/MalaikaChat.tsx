"use client";

import { useEffect, useRef, useState } from "react";
import { File as FileIcon, Paperclip, Sparkles, X } from "lucide-react";
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";
import { supabase } from "@/lib/supabaseClient";

type Mode = "staff" | "public";

type Message = {
  id: string;
  role: "user" | "assistant";
  message: string;
};

type MalaikaChatProps = {
  mode?: Mode;
  open?: boolean;
  onClose?: () => void;
};

const PUBLIC_MALAIKA_MEMORY_ENABLED = false;
const PUBLIC_MALAIKA_UID_KEY = "milele_public_malaika_uid_v2";

function getPublicUserId(): string {
  if (typeof window === "undefined") return "public-anon";
  const existing = localStorage.getItem(PUBLIC_MALAIKA_UID_KEY);
  if (existing) return existing;
  const created = `public-${crypto.randomUUID()}`;
  localStorage.setItem(PUBLIC_MALAIKA_UID_KEY, created);
  return created;
}

export function MalaikaChat({ mode = "public", open, onClose }: MalaikaChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>("public-anon");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles((prev) => [...prev, ...files].slice(0, 6));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const isFloating = typeof open === "boolean";
  const isOpen = open ?? true;

  useEffect(() => {
    if (mode !== "staff") return;
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        message: "Malaïka, assistante Milele, est prête. Dis-moi ce que tu veux accomplir maintenant.",
      },
    ]);
  }, [mode]);

  useEffect(() => {
    if (mode !== "public") return;
    setUserId(getPublicUserId());
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        message: "Salut ! 💚 Je suis Malaïka — \"ange\" en swahili — ton assistante sur Milele, créée par Kent Ley. Je suis là pour t'aider avec n'importe quoi : créer un profil, partager des publications, explorer la plateforme, gérer tes sous-comptes... Qu'est-ce que tu aimerais faire en premier ?",
      },
    ]);
  }, [mode]);

  async function sendMessage() {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;
    setLoading(true);

    const outgoingUserMessage: Message = { id: crypto.randomUUID(), role: "user", message: trimmedInput };
    setMessages((prev) => [...prev, outgoingUserMessage]);
    setInput("");

    try {
      if (mode === "staff") {
        const history = [...messages, outgoingUserMessage].map((m) => ({
          role: m.role,
          content: m.message,
        }));

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              message: "Session expirée. Reconnecte-toi pour utiliser Malaïka Staff.",
            },
          ]);
          return;
        }

        let res: Response;
        if (selectedFiles.length > 0) {
          const fd = new FormData();
          fd.append("messages", JSON.stringify(history));
          selectedFiles.forEach((f) => fd.append("files", f));
          setSelectedFiles([]);
          res = await fetch("/api/staff/malaika", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        } else {
          res = await fetch("/api/staff/malaika", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ messages: history }),
          });
        }

        const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
        const reply = data.reply ?? data.error ?? "Je n'ai pas pu répondre pour le moment.";

        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", message: reply }]);
        return;
      }

      const payload = {
        mode,
        message: trimmedInput,
        userId,
        memory: PUBLIC_MALAIKA_MEMORY_ENABLED,
        recentMessages: [...messages, outgoingUserMessage].slice(-10).map((m) => ({
          role: m.role,
          content: m.message,
        })),
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const res = await fetch("/api/malaika", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "Je n'ai pas pu répondre pour le moment.";

      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "assistant", message: reply }]);
    } catch {
      const errorMessages = [
        "Zut, une petite hiccup technique ! 🌊 Réessaie dans un instant, je reviens plus forte.",
        "Oups, je perds ma connexion ! 📡 Attends une seconde, je me reconnecte...",
        "Mon lien avec Milele a un petit lag ! ⚡ Essaie à nouveau, je suis presque là.",
      ]
      const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)]
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", message: randomError },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (mode === "staff") return;
    if (!isOpen) return;
    if (!PUBLIC_MALAIKA_MEMORY_ENABLED) return;

    async function loadHistory() {
      const payload: {
        mode: Mode;
        history: boolean;
        userId?: string;
      } = { mode, history: true };

      if (mode === "public") {
        payload.userId = userId;
      }

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);
        const res = await fetch("/api/malaika", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const data = await res.json();

        if (Array.isArray(data.history)) {
          setMessages(
            data.history.map((m: { id: string; role: "user" | "assistant"; message: string }) => ({
              id: m.id,
              role: m.role,
              message: m.message,
            })),
          );
        }
      } catch {
        // Ne bloque pas l'UI si l'historique échoue.
      }
    }

    void loadHistory();
  }, [mode, userId, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className={
        (isFloating
          ? "fixed right-4 bottom-40 sm:bottom-24 z-50 w-[92vw] max-w-[420px] h-[66vh] max-h-[580px] "
          : "w-full h-full max-h-[80vh] ") +
        "flex flex-col rounded-2xl border p-4 gap-4 transition-colors backdrop-blur-xl " +
        (mode === "public"
          ? "bg-emerald-900/25 border-emerald-400/40"
          : "bg-sky-900/25 border-sky-400/40")
      }
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles size={18} className={mode === "staff" ? "text-sky-300" : "text-emerald-300"} />
          {mode === "staff"
            ? "Malaïka — Assistante Milele (mémoire totale)"
            : "Malaïka — Assistante Milele"}
        </h2>

        {mode === "public" && (
          <div className="flex items-center gap-2">
            {isFloating && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border text-sm font-bold"
                style={{
                  borderColor: "color-mix(in srgb, var(--primary) 28%, transparent)",
                  color: "var(--muted-foreground)",
                }}
                aria-label="Fermer Malaika"
              >
                ×
              </button>
            )}
          </div>
        )}

        {mode === "staff" && isFloating && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border text-sm font-bold"
            style={{
              borderColor: "color-mix(in srgb, var(--primary) 28%, transparent)",
              color: "var(--muted-foreground)",
            }}
            aria-label="Fermer Malaika"
          >
            ×
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 rounded-xl bg-black/20 p-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              "max-w-[80%] px-3 py-2 rounded-lg text-sm " +
              (m.role === "user"
                ? "ml-auto bg-emerald-500/70 text-black"
                : "mr-auto bg-white/10 text-white")
            }
          >
            {m.message}
          </div>
        ))}
      </div>

      {mode === "staff" && selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1">
          {selectedFiles.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-sky-500/20 border border-sky-400/30 text-sky-200"
            >
              <FileIcon size={11} />
              <span className="max-w-[100px] truncate">{f.name}</span>
              <button onClick={() => removeFile(i)} className="hover:text-white transition-colors">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {mode === "staff" && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.csv,.json,.md,.log,.yaml,.yml,.xml"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl border border-white/20 bg-black/40 text-white/60 hover:text-sky-300 hover:border-sky-400/50 transition-colors disabled:opacity-40"
              aria-label="Joindre un fichier"
            >
              <Paperclip size={15} />
            </button>
          </>
        )}
        <input
          className="flex-1 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-sm"
          placeholder="Écris un message pour Malaïka…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void sendMessage();
          }}
          disabled={loading}
        />
        <LiquidMetalButton
          label={loading ? "..." : "Envoyer"}
          width={112}
          height={40}
          fontSize={13}
          tinted
          onClick={() => void sendMessage()}
          disabled={loading}
        />
      </div>
    </div>
  );
}

export default MalaikaChat
