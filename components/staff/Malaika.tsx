"use client";
import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import MonarkIcon from "./MonarkIcon";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  time: string;
};

type MemoryMode = "memory" | "incognito";

const SUGGESTED = [
  "Resume les feedbacks recents",
  "Combien de membres dans l'équipe ?",
  "Quels feedbacks sont en attente ?",
  "Transmets au groupe staff: Reunion rapide a 14h",
  "Envoie a kentleyk@gmail.com: Merci de valider les tickets critiques",
];

function getInitialMessages(memoryMode: MemoryMode): Message[] {
  return [
    {
      id: 1,
      role: "assistant",
      text:
        memoryMode === "incognito"
          ? "Bonjour ! Je suis **Monark** ⚙️. Le **mode incognito** est actif: cette session n'est pas enregistrée dans la mémoire persistante."
          : "Bonjour ! Je suis **Monark** ⚙️, votre assistant de travail staff. Je vous aide à piloter les opérations, résumer les feedbacks, suivre les tickets et accélérer les décisions d'équipe. Dites-moi ce dont vous avez besoin.",
      time: "maintenant",
    },
  ];
}

function formatText(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="bg-white/10 px-1 rounded text-sky-300 text-xs font-mono">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

type SizeMode = "normal" | "large" | "fullscreen";

const SIZE_CYCLE: SizeMode[] = ["normal", "large", "fullscreen"];

export default function Malaika() {
  const [memoryMode, setMemoryMode] = useState<MemoryMode>("memory");
  const [messages, setMessages] = useState<Message[]>(getInitialMessages("memory"));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInitials, setUserInitials] = useState("?");
  const [sizeMode, setSizeMode] = useState<SizeMode>("normal");
  const endRef = useRef<HTMLDivElement>(null);

  function cycleSize() {
    setSizeMode((prev) => {
      const idx = SIZE_CYCLE.indexOf(prev);
      return SIZE_CYCLE[(idx + 1) % SIZE_CYCLE.length];
    });
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    async function loadUserInitials() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) return;
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("full_name, email")
        .eq("user_id", userId)
        .single();
      const name =
        (profile as { full_name: string | null; email: string } | null)?.full_name ??
        (profile as { full_name: string | null; email: string } | null)?.email ??
        sessionData.session?.user?.email ?? "?";
      const parts = name.split(/[\s@]/);
      const initials = parts
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase() ?? "")
        .join("");
      setUserInitials(initials || "?");
    }
    loadUserInitials();
  }, []);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const history = messages.map((m) => ({ role: m.role, content: m.text }));
    const userMsg: Message = { id: Date.now(), role: "user", text: msg, time: now };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            text: "Session expirée. Reconnecte-toi pour utiliser Monark.",
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
        return;
      }

      const res = await fetch("/api/staff/monark", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [...history, { role: "user", content: msg }],
          memoryMode,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as { reply?: string; error?: string };
      const replyText = payload.reply ?? payload.error;

      if (res.ok) {
        const aiMsg: Message = {
          id: Date.now() + 1,
          role: "assistant",
          text: replyText ?? "Je n'ai pas pu generer une reponse.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            role: "assistant",
            text: replyText ?? "Desolee, une erreur s'est produite. Veuillez reessayer.",
            time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Connexion impossible. Verifiez votre reseau et reessayez.",
          time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
    setLoading(false);
  }

  const sizeLabel = sizeMode === "normal" ? "Agrandir" : sizeMode === "large" ? "Plein écran" : "Réduire";
  const SizeIcon = sizeMode === "fullscreen"
    ? () => (
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path d="M5 2H2v3M11 2h3v3M5 14H2v-3M11 14h3v-3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    : () => (
        <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
          <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );

  const wrapperClass = sizeMode === "fullscreen"
    ? "fixed inset-0 z-50 flex flex-col bg-[#07142b]/55 backdrop-blur-xl p-4 md:p-6"
    : sizeMode === "large"
      ? "w-full max-w-5xl mx-auto flex flex-col gap-4 transition-all duration-300"
      : "w-full max-w-3xl mx-auto flex flex-col gap-4 transition-all duration-300";

  const chatHeight = sizeMode === "fullscreen"
    ? "flex-1"
    : sizeMode === "large"
      ? "h-[calc(100vh-220px)] min-h-[600px]"
      : "h-[calc(100vh-280px)] min-h-[480px]";

  return (
    <div className={wrapperClass}>
      <div className="flex items-center gap-4 px-1">
        <div className="w-11 h-11 rounded-2xl bg-white/[0.06] border border-white/20 flex items-center justify-center shadow-lg shadow-black/35">
          <MonarkIcon size={26} />
        </div>
        <div>
          <div className="font-bold text-lg text-white">Monark</div>
          <div className="text-xs text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
            Assistant de travail - {memoryMode === "incognito" ? "Incognito" : "Mémoire"}
          </div>
        </div>
        <button
          onClick={() => {
            setMemoryMode((prev) => {
              const next = prev === "memory" ? "incognito" : "memory";
              setMessages(getInitialMessages(next));
              return next;
            });
          }}
          className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
          title="Basculer mémoire/incognito"
        >
          {memoryMode === "memory" ? "Passer en incognito" : "Revenir en mémoire"}
        </button>
        <button
          onClick={cycleSize}
          className="text-xs text-gray-300 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
          title={sizeLabel}
        >
          <SizeIcon />
          <span>{sizeLabel}</span>
        </button>
        <button
          onClick={() => setMessages(getInitialMessages(memoryMode))}
          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition"
        >
          Reinitialiser
        </button>
      </div>

      <div className={`${chatHeight} overflow-y-auto flex flex-col gap-3 bg-white/[0.025] rounded-2xl border border-white/10 backdrop-blur-xl p-4`}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/20 flex-shrink-0 flex items-center justify-center shadow">
                <MonarkIcon size={18} />
              </div>
            )}
            <div className={`max-w-[80%] flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow ${msg.role === "user" ? "bg-gradient-to-br from-sky-500/85 to-indigo-600/85 text-white rounded-br-sm" : "bg-white/[0.055] text-white/90 border border-white/15 rounded-bl-sm"}`}>
                {msg.text.split("\n").map((line, i) => (
                  <span key={i}>{formatText(line)}{i < msg.text.split("\n").length - 1 && <br />}</span>
                ))}
              </div>
              <span className="text-[10px] text-gray-600 mt-1 px-1">{msg.time}</span>
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-xl bg-sky-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow">{userInitials}</div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-white/[0.06] border border-white/20 flex-shrink-0 flex items-center justify-center shadow">
              <MonarkIcon size={18} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white/[0.055] border border-white/15 flex gap-1.5 items-center">
              {[0, 1, 2].map((i) => (<span key={i} className="w-2 h-2 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 flex-wrap">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => send(s)} disabled={loading} className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-gray-300 hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-200 transition disabled:opacity-40">{s}</button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          className="flex-1 rounded-xl px-4 py-3 bg-white/10 border border-white/20 focus:outline-none focus:border-sky-400 text-white placeholder-gray-500 text-sm"
          placeholder="Posez une question a Monark..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={loading}
        />
        <button onClick={() => send()} disabled={loading || !input.trim()} className="px-4 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition disabled:opacity-40 disabled:scale-100">
          <svg width="18" height="18" fill="none" viewBox="0 0 18 18"><path d="M2 9l14-7-7 14V9H2z" fill="white"/></svg>
        </button>
      </div>
    </div>
  );
}
