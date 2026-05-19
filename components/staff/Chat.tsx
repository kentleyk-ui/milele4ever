
import React, { useRef, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: number;
  user_id: string;
  content: string;
  sender_name: string | null;
  created_at: string;
}

const MONARK_PRIVATE_PREFIX = "[MONARK_PRIVATE]";

interface TypingPayload {
  userId: string;
  name: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

export default function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("Moi");
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastTypingSent = useRef<number>(0);
  const currentUserIdRef = useRef<string | null>(null);
  const currentUserNameRef = useRef<string>("Moi");

  // Scroll auto vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Gestion swipe pour ouvrir la sidebar sur mobile
  useEffect(() => {
    let startX = 0;
    function handleTouchStart(e: TouchEvent) { startX = e.touches[0].clientX; }
    function handleTouchMove(e: TouchEvent) {
      if (e.touches[0].clientX - startX > 60) setSidebarOpen(true);
    }
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Charger l'utilisateur courant
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setCurrentUserId(user.id);
      currentUserIdRef.current = user.id;
      // Chercher son nom dans staff_profiles
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single();
      const name =
        (profile as { full_name: string | null; email: string | null } | null)?.full_name
        ?? user.email?.split("@")[0]
        ?? "Moi";
      setCurrentUserName(name);
      currentUserNameRef.current = name;
    });
  }, []);

  // Présence en ligne (Supabase Presence)
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel("staff-presence", {
      config: { presence: { key: currentUserId } },
    });
    presenceChannelRef.current = channel;

    function syncPresence() {
      const state = channel.presenceState<{ name: string }>();
      const map = new Map<string, string>();
      Object.entries(state).forEach(([key, presences]) => {
        const p = presences[0];
        if (p?.name) map.set(key, p.name);
      });
      setOnlineUsers(map);
    }

    channel
      .on("presence", { event: "sync" }, syncPresence)
      .on("presence", { event: "join" }, syncPresence)
      .on("presence", { event: "leave" }, syncPresence)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ name: currentUserNameRef.current });
        }
      });

    return () => { void supabase.removeChannel(channel); };
  }, [currentUserId]);

  // Canal typing (Supabase Broadcast)
  useEffect(() => {
    const channel = supabase.channel("staff-chat-typing");
    typingChannelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const { userId, name } = payload as TypingPayload;
        if (userId === currentUserIdRef.current) return;

        setTypingUsers(prev => new Map(prev).set(userId, name));

        // Auto-clear après 3s
        const existing = typingTimeouts.current.get(userId);
        if (existing) clearTimeout(existing);
        const timer = setTimeout(() => {
          setTypingUsers(prev => { const m = new Map(prev); m.delete(userId); return m; });
          typingTimeouts.current.delete(userId);
        }, 3000);
        typingTimeouts.current.set(userId, timer);
      })
      .subscribe();

    const typingTimeoutMap = typingTimeouts.current;

    return () => {
      void supabase.removeChannel(channel);
      typingTimeoutMap.forEach(clearTimeout);
      typingTimeoutMap.clear();
    };
  }, []);

  // Charger les messages + Realtime
  const loadMessages = useCallback(async () => {
    const { data } = await supabase
      .from("staff_messages")
      .select("id, user_id, content, sender_name, created_at")
      .order("created_at", { ascending: true })
      .limit(100);
    const visible = ((data as Message[]) ?? []).filter((m) => !(m.content ?? "").startsWith(MONARK_PRIVATE_PREFIX));
    setMessages(visible);
  }, []);

  useEffect(() => {
    void loadMessages();
    const channel = supabase
      .channel("staff-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "staff_messages" },
        (payload) => {
          const incoming = payload.new as Message;
          if ((incoming.content ?? "").startsWith(MONARK_PRIVATE_PREFIX)) return;
          setMessages(prev => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [loadMessages]);

  async function sendMessage() {
    if (!input.trim() || !currentUserId) return;
    const content = input.trim();
    const optimisticId = -Date.now();
    const optimistic: Message = {
      id: optimisticId,
      user_id: currentUserId,
      content,
      sender_name: currentUserName,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(true);
    const { data, error } = await supabase.from("staff_messages").insert({
      user_id: currentUserId,
      content,
      sender_name: currentUserName,
    }).select("id, user_id, content, sender_name, created_at").single();

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(content);
      setSending(false);
      return;
    }

    const saved = data as Message;
    setMessages((prev) => prev.map((m) => (m.id === optimisticId ? saved : m)));
    setSending(false);
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 min-h-[80vh] relative bg-gradient-to-br from-emerald-50 via-white to-violet-100 dark:from-black dark:via-gray-900 dark:to-violet-950 rounded-3xl shadow-2xl overflow-hidden">
      {/* Overlay mobile */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-4/5 max-w-xs bg-white/90 dark:bg-black/90 border-r border-white/20 shadow-2xl p-4 transition-transform duration-300 md:static md:w-64 md:bg-white/10 md:dark:bg-white/10 md:rounded-2xl md:shadow-xl md:border md:border-white/20 flex-shrink-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        aria-label="Conversations"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Canal général</h2>
          <button className="md:hidden p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10" onClick={() => setSidebarOpen(false)}>×</button>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">#</div>
            <div>
              <div className="text-sm font-semibold text-white">général</div>
              <div className="text-xs text-white/40">Chat global du Staff</div>
            </div>
          </div>
        </div>

        {/* Membres en ligne */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]"></span>
            <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">En ligne</span>
            <span className="ml-auto text-xs font-bold text-emerald-400">{onlineUsers.size}</span>
          </div>
          <ul className="flex flex-col gap-1" aria-label="Membres en ligne">
            {onlineUsers.size === 0 && (
              <li className="text-xs text-white/30 px-2 py-1">Aucun membre connecté</li>
            )}
            {Array.from(onlineUsers.entries()).map(([uid, name]) => (
              <li key={uid} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 transition">
                <div className="relative flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-violet-500/30 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-300">
                    {getInitials(name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black" aria-hidden="true"></span>
                </div>
                <span className="text-xs text-white/80 font-medium truncate">
                  {uid === currentUserId ? `${name} (moi)` : name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Bouton ouvrir sidebar mobile */}
      <button
        className="md:hidden fixed z-30 left-3 top-3 bg-emerald-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg active:scale-95"
        onClick={() => setSidebarOpen(true)}
        aria-label="Ouvrir menu"
      >
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
      </button>

      {/* Messages */}
      <section className="flex-1 bg-white/30 dark:bg-white/10 backdrop-blur-xl rounded-2xl p-2 sm:p-4 border border-white/30 dark:border-white/20 shadow-xl flex flex-col gap-2 sm:gap-4 min-h-[60vh]">
        <h2 className="text-lg font-bold mb-2"># général</h2>
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto min-h-[200px] pb-32 sm:pb-24" style={{ WebkitOverflowScrolling: "touch" }}>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-32 text-white/30 text-sm">
              Aucun message pour l&apos;instant. Sois le premier à écrire !
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.user_id === currentUserId;
            const name = msg.sender_name ?? "Staff";
            return (
              <div key={msg.id} className={`flex items-end gap-2 sm:gap-3 group ${isMe ? "justify-end" : "justify-start"}`}>
                {!isMe && (
                  <div className="w-9 h-9 rounded-full bg-violet-500/30 border border-violet-500/40 flex items-center justify-center font-bold text-violet-300 text-sm flex-shrink-0">
                    {getInitials(name)}
                  </div>
                )}
                <div className={`flex flex-col max-w-[80vw] sm:max-w-md ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    {!isMe && <span className="text-xs font-bold text-violet-300">{name}</span>}
                    <span className="text-[11px] text-white/30">{formatTime(msg.created_at)}</span>
                  </div>
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm font-medium whitespace-pre-line ${
                      isMe
                        ? "bg-gradient-to-br from-emerald-500/80 to-emerald-600/90 text-white rounded-br-md"
                        : "bg-white/10 dark:bg-violet-900/40 text-white border border-white/10 rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
                {isMe && (
                  <div className="w-9 h-9 rounded-full bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center font-bold text-emerald-300 text-sm flex-shrink-0">
                    {getInitials(currentUserName)}
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Indicateur de frappe (3 points) */}
        {typingUsers.size > 0 && (
          <div className="flex items-center gap-2 px-2 pb-1" aria-live="polite" aria-label="Quelqu'un est en train d'écrire">
            <div className="flex items-center gap-2 bg-white/10 rounded-2xl rounded-bl-sm px-4 py-2 max-w-fit">
              <span className="text-xs text-white/50 italic">
                {Array.from(typingUsers.values()).join(", ")} est en train d&apos;écrire
              </span>
              <div className="flex gap-0.5 items-center">
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="fixed bottom-0 left-0 w-full z-20 bg-gradient-to-t from-white/90 dark:from-black/90 via-white/60 dark:via-black/60 to-transparent p-2 sm:static sm:bg-none sm:p-0 flex gap-2 items-end max-w-5xl mx-auto">
          <input
            className="flex-1 rounded-xl px-4 py-3 bg-white/10 border border-white/20 focus:outline-none focus:border-emerald-500/50 text-white placeholder:text-white/30 text-sm"
            placeholder="Écrire un message…"
            style={{ minHeight: 48 }}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              // Broadcast typing (throttlé à 2s)
              const now = Date.now();
              if (now - lastTypingSent.current > 2000 && currentUserIdRef.current && typingChannelRef.current) {
                lastTypingSent.current = now;
                void typingChannelRef.current.send({
                  type: "broadcast",
                  event: "typing",
                  payload: { userId: currentUserIdRef.current, name: currentUserNameRef.current },
                });
              }
            }}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && void sendMessage()}
            disabled={sending}
          />
          <button
            className="px-5 py-3 rounded-xl font-semibold text-white bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-40 text-sm"
            onClick={sendMessage}
            disabled={sending || !input.trim()}
          >
            Envoyer
          </button>
        </div>
      </section>
    </div>
  );
}
