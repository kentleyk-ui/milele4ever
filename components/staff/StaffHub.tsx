"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton";
import MonarkIcon from "./MonarkIcon";

const KentDashboard = dynamic(() => import("./KentDashboard"), { ssr: false });
const Dashboard = dynamic(() => import("./Dashboard"), { ssr: false });
const Tickets = dynamic(() => import("./Tickets"), { ssr: false });
const Team = dynamic(() => import("./Team"), { ssr: false });
const Permissions = dynamic(() => import("./Permissions"), { ssr: false });
const Chat = dynamic(() => import("./Chat"), { ssr: false });
const Analytics = dynamic(() => import("./Analytics"), { ssr: false });
const Settings = dynamic(() => import("./Settings"), { ssr: false });
const OrgChart = dynamic(() => import("./OrgChart"), { ssr: false });
const Malaika = dynamic(() => import("./Malaika"), { ssr: false });
const Suggestions = dynamic(() => import("./Suggestions"), { ssr: false });
const Notifications = dynamic(() => import("./Notifications"), { ssr: false });
const MonarkQuickAssistant = dynamic(() => import("./MonarkQuickAssistant"), { ssr: false });

const KENT_EMAIL = "kentleyk@gmail.com";

const STAFF_VIEWS = [
  "dashboard",
  "tickets",
  "team",
  "permissions",
  "chat",
  "notifications",
  "malaika",
  "suggestions",
  "orgchart",
  "analytics",
  "settings",
] as const;

type StaffView = (typeof STAFF_VIEWS)[number];

const STAFF_VIEW_SET = new Set<StaffView>(STAFF_VIEWS);

function isStaffView(value: string): value is StaffView {
  return STAFF_VIEW_SET.has(value as StaffView);
}

function formatSystemTime(date = new Date()) {
  return date.toLocaleTimeString("fr-FR", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatSystemDate(date = new Date()) {
  return date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

type PresenceStatus = "online" | "busy" | "offline" | "away";

const PRESENCE_META: Record<PresenceStatus, { label: string; dot: string; badge: string }> = {
  online: {
    label: "En ligne",
    dot: "#22c55e",
    badge: "text-emerald-200 border-emerald-500/35 bg-emerald-500/15",
  },
  busy: {
    label: "Occupé",
    dot: "#f59e0b",
    badge: "text-amber-200 border-amber-500/35 bg-amber-500/15",
  },
  away: {
    label: "Absent",
    dot: "#60a5fa",
    badge: "text-sky-200 border-sky-500/35 bg-sky-500/15",
  },
  offline: {
    label: "Hors ligne",
    dot: "#94a3b8",
    badge: "text-slate-200 border-slate-400/35 bg-slate-500/15",
  },
};

function extractAvatarUrl(accent: unknown) {
  if (!accent || typeof accent !== "object" || !("profile" in accent)) {
    return null;
  }

  const profile = (accent as { profile?: { avatar_url?: string | null } }).profile;
  return profile?.avatar_url ?? null;
}

type ProfileAvatarProps = {
  sizeClass: string;
  avatarUrl: string | null;
  name: string;
  isKent: boolean;
  initial: string;
};

const ProfileAvatar = React.memo(function ProfileAvatar({ sizeClass, avatarUrl, name, isKent, initial }: ProfileAvatarProps) {
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shadow overflow-hidden`}
      style={{ background: isKent ? "linear-gradient(135deg,#d4a853,#b8892d)" : "#3b82f6" }}
    >
      {avatarUrl ? (
        <Image src={avatarUrl} alt={name} width={96} height={96} sizes="96px" className="w-full h-full object-cover" />
      ) : (
        isKent ? "⚜" : initial
      )}
    </div>
  );
});

export default function StaffHub() {
  const router = useRouter();
  const [view, setViewRaw] = useState<StaffView>("dashboard");
  const setView = useCallback((key: string) => {
    if (isStaffView(key)) {
      setViewRaw(key);
    }
  }, []);
  const [staffUserId, setStaffUserId] = useState<string | null>(null);
  const [profileName, setProfileName] = useState("Staff");
  const [profileRole, setProfileRole] = useState("Rôle non défini");
  const [profileEmail, setProfileEmail] = useState<string>("");
  const [profileStatus, setProfileStatus] = useState<string>("approved");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string | null>(null);
  const [isKent, setIsKent] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [notificationBadge, setNotificationBadge] = useState(0);
  const [clockNow, setClockNow] = useState<Date>(new Date());
  const [presenceStatus, setPresenceStatus] = useState<PresenceStatus>("online");
  const [presenceUpdatedAt, setPresenceUpdatedAt] = useState<string>(formatSystemTime());
  const [sessionBrief, setSessionBrief] = useState<string | null>(null);
  const [sessionJoke, setSessionJoke] = useState<string | null>(null);
  const [isLowPowerMode, setIsLowPowerMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mobile = window.matchMedia("(max-width: 768px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setIsLowPowerMode(mobile.matches || reducedMotion.matches);
    };
    update();
    mobile.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      mobile.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const requestedView = new URLSearchParams(window.location.search).get("view");
    if (!requestedView) return;

    if (isStaffView(requestedView)) {
      setViewRaw(requestedView);
    }
  }, []);

  useEffect(() => {
    async function applyProfile(user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) {
      if (!user) return;
      setStaffUserId(user.id);
      const meta = user.user_metadata ?? {};
      const fullName = (meta.full_name as string) || (meta.name as string) || user.email?.split("@")[0] || "Staff";
      const kent = user.email === KENT_EMAIL;
      setIsKent(kent);
      setProfileEmail(user.email ?? "");

      // Lire le rôle depuis staff_profiles
      const { data: sp } = await supabase
        .from("staff_profiles")
        .select("role_name, full_name, accent_color, status")
        .eq("user_id", user.id)
        .single();

      const profile = sp as { role_name: string | null; full_name: string | null; accent_color?: unknown; status?: string | null } | null;

      setProfileName(profile?.full_name ?? fullName);
      setProfileRole(kent ? "Administrateur Suprême" : (profile?.role_name ?? "Rôle non défini"));
      setProfileAvatarUrl(extractAvatarUrl(profile?.accent_color));
      setProfileStatus(profile?.status ?? "approved");

      // Compter les demandes en attente pour le badge Kent
      if (kent) {
        const { count } = await supabase
          .from("staff_profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending_approval");
        setPendingCount(count ?? 0);
      }
    }

    async function refreshCurrentProfile() {
      if (!staffUserId) return;

      const profileReq = supabase
        .from("staff_profiles")
        .select("role_name, full_name, accent_color, status")
        .eq("user_id", staffUserId)
        .single();

      const pendingReq = isKent
        ? supabase
            .from("staff_profiles")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending_approval")
        : Promise.resolve({ count: 0 });

      const [{ data: sp }, pendingData] = await Promise.all([profileReq, pendingReq]);
      const profile = sp as { role_name: string | null; full_name: string | null; accent_color?: unknown; status?: string | null } | null;
      if (profile?.full_name) setProfileName(profile.full_name);
      if (profile?.role_name) setProfileRole(isKent ? "Administrateur Suprême" : profile.role_name);
      setProfileAvatarUrl(extractAvatarUrl(profile?.accent_color));
      setProfileStatus(profile?.status ?? "approved");
      if (isKent) setPendingCount((pendingData as { count?: number }).count ?? 0);
    }

    supabase.auth.getSession().then(({ data }) => applyProfile(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      // Ignorer TOKEN_REFRESHED et SIGNED_OUT (géré par RequireStaffAuth)
      if (event === "TOKEN_REFRESHED" || event === "SIGNED_OUT") return;
      applyProfile(session?.user ?? null);
    });

    // Realtime badge pending
    const channel = supabase
      .channel("hub-pending")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, async () => {
        await refreshCurrentProfile();
      })
      .subscribe();

    return () => {
      listener?.subscription.unsubscribe();
      void supabase.removeChannel(channel);
    };
  }, [isKent, staffUserId]);

  useEffect(() => {
    let isDisposed = false;
    let inFlight = false;
    let queued = false;
    let scheduled: number | null = null;

    async function refreshNotificationBadge() {
      if (isDisposed) return;
      if (inFlight) {
        queued = true;
        return;
      }
      inFlight = true;

      const [pendingRes, criticalRes] = await Promise.all([
        supabase.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("status", "pending_approval"),
        supabase.from("staff_tickets").select("id", { count: "exact", head: true }).eq("priority", "Critique"),
      ]);

      if (pendingRes.error || criticalRes.error) {
        console.error("[StaffHub] Erreur notification badge", {
          pendingError: pendingRes.error,
          criticalError: criticalRes.error,
        });
      } else if (!isDisposed) {
        setNotificationBadge((pendingRes.count ?? 0) + (criticalRes.count ?? 0));
      }

      inFlight = false;
      if (queued && !isDisposed) {
        queued = false;
        void refreshNotificationBadge();
      }
    }

    function scheduleRefresh() {
      if (scheduled) return;
      scheduled = window.setTimeout(() => {
        scheduled = null;
        void refreshNotificationBadge();
      }, 400);
    }

    void refreshNotificationBadge();

    const channelName = `hub-notification-badge-${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, () => {
        scheduleRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_tickets" }, () => {
        scheduleRefresh();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" || status === "TIMED_OUT" || status === "CHANNEL_ERROR") {
          scheduleRefresh();
        }
      });

    return () => {
      isDisposed = true;
      if (scheduled) window.clearTimeout(scheduled);
      void supabase.removeChannel(channel);
    };
  }, []);

  const profileInitial = (profileName?.trim()?.[0] || "S").toUpperCase();
  const profileStatusLabel = profileStatus === "approved"
    ? "Approuvé"
    : profileStatus === "pending_approval"
      ? "En attente"
      : profileStatus === "pending_role"
        ? "Sans rôle"
        : profileStatus === "rejected"
          ? "Refusé"
          : profileStatus;

  const currentViewMeta = useMemo(() => {
    const map: Record<StaffView, { title: string; subtitle: string }> = {
      dashboard: { title: "Cockpit", subtitle: "Vue globale, décisions rapides et rythme d'équipe." },
      tickets: { title: "Tickets", subtitle: "Flux de travail, priorités et suivi opérationnel." },
      team: { title: "Équipe", subtitle: "Coordination, rôles et dynamique collective." },
      permissions: { title: "Permissions", subtitle: "Sécurité, accès et responsabilités." },
      chat: { title: "Chat", subtitle: "Communication interne en temps réel." },
      notifications: { title: "Notifications", subtitle: "Alertes chaudes et signaux critiques." },
      malaika: { title: "Monark", subtitle: "Assistant de travail intelligent pour accélérer le staff." },
      suggestions: { title: "Suggestions", subtitle: "Voix des utilisateurs et opportunités produit." },
      orgchart: { title: "Organigramme", subtitle: "Structure claire pour décider plus vite." },
      analytics: { title: "Stats", subtitle: "Mesures, tendances et impact de l'équipe." },
      settings: { title: "Réglages", subtitle: "Personnalisation et confort de travail." },
    };
    return map[view];
  }, [view]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockNow(new Date());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!staffUserId) return;
    const key = `staff-presence:${staffUserId}`;
    const raw = window.localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { status?: PresenceStatus; updatedAt?: string };
      if (parsed.status && parsed.status in PRESENCE_META) {
        setPresenceStatus(parsed.status);
      }
      if (parsed.updatedAt) {
        setPresenceUpdatedAt(parsed.updatedAt);
      }
    } catch {
      // Ignore les valeurs corrompues en localStorage.
    }
  }, [staffUserId]);

  useEffect(() => {
    if (!staffUserId) return;
    const key = `staff-presence:${staffUserId}`;
    window.localStorage.setItem(
      key,
      JSON.stringify({ status: presenceStatus, updatedAt: presenceUpdatedAt })
    );
  }, [presenceStatus, presenceUpdatedAt, staffUserId]);

  useEffect(() => {
    if (!staffUserId) return;
    const dayKey = new Date().toISOString().slice(0, 10);
    const seenKey = `monark:brief:${staffUserId}:${dayKey}`;
    if (window.localStorage.getItem(seenKey) === "1") return;

    void (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/staff/session-brief", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;

      const data = (await res.json()) as { summary?: string; joke?: string | null };
      if (!data.summary) return;

      setSessionBrief(data.summary);
      setSessionJoke(data.joke ?? null);
      window.localStorage.setItem(seenKey, "1");

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const body = data.joke ? `${data.summary}\n${data.joke}` : data.summary;
        new Notification("Monark", { body });
      }
    })();
  }, [staffUserId]);

  const presenceMeta = PRESENCE_META[presenceStatus];
  const shouldMountQuickAssistant = view === "dashboard" || view === "chat" || view === "malaika";
  const staffShortId = staffUserId ? staffUserId.slice(0, 8).toUpperCase() : "N/A";
  const liquidViewShell = "rounded-3xl border border-white/15 bg-[linear-gradient(145deg,rgba(8,23,49,0.56),rgba(12,35,76,0.44),rgba(9,20,44,0.52))] p-4 md:p-5 shadow-[0_20px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl";

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#07142b] via-[#0a1c3f] to-[#081b38] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {!isLowPowerMode && <div className="staff-orb staff-orb-a" />}
        {!isLowPowerMode && <div className="staff-orb staff-orb-b" />}
        {!isLowPowerMode && <div className="staff-orb staff-orb-c" />}
        <div className="staff-grid" />
        {!isLowPowerMode && <div className="staff-scanline" />}
      </div>

      {/* Sidebar desktop - HIDDEN (navigation moved to /staff home) */}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">

        {/* Header desktop - SIMPLIFIED (navigation moved to /staff home) */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b backdrop-blur-xl shadow-sm"
          style={{
            background: isKent ? "rgba(212,168,83,0.04)" : "rgba(255,255,255,0.03)",
            borderColor: isKent ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.08)",
          }}
        >
          <button
            onClick={() => router.push("/staff")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-white/80 font-semibold text-sm"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour à l'accueil
          </button>
          
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-2 text-right relative overflow-hidden">
              <div className="text-[11px] uppercase tracking-[0.2em] text-sky-200/60 flex items-center justify-end gap-1.5 mb-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" style={{boxShadow:'0 0 5px #38bdf8'}} />
                {profileName}
              </div>
              <div className="text-2xl font-black text-white">{currentViewMeta?.title}</div>
              <div className="text-xs text-white/65 mt-1">{profileRole}</div>
            </div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition text-white/80 text-sm font-semibold"
            >
              Déconnexion
            </button>
          </div>
        </header>

        {/* Header mobile - SIMPLIFIED (navigation moved to /staff home) */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/10 backdrop-blur-xl border-b border-white/10">
          <button
            onClick={() => router.push("/staff")}
            className="flex items-center gap-2 text-white font-semibold text-sm hover:opacity-80 transition"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <span className="text-xs text-white/60">Fermer pour revenir</span>
          <ProfileAvatar sizeClass="w-8 h-8" avatarUrl={profileAvatarUrl} name={profileName} isKent={isKent} initial={profileInitial} />
        </header>

        {/* Vue principale */}
        <div className="flex-1 w-full px-2 md:px-8 py-6 md:py-8 overflow-y-auto pb-24 md:pb-8"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 6.25rem)" }}>
          {(sessionBrief || sessionJoke) && (
            <section className="max-w-6xl mx-auto mb-4">
              <div className="rounded-2xl border border-sky-300/30 bg-sky-500/10 px-4 py-3 shadow-[0_12px_30px_rgba(2,132,199,0.18)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.2em] text-sky-200/70 mb-1">Monark · Résumé session</p>
                    {sessionBrief && <p className="text-sm text-white/90">{sessionBrief}</p>}
                    {sessionJoke && <p className="text-xs text-sky-100/80 mt-1">{sessionJoke}</p>}
                  </div>
                  <button
                    onClick={() => { setSessionBrief(null); setSessionJoke(null); }}
                    className="px-2 py-1 rounded-md text-xs border border-white/15 text-white/70 hover:bg-white/10"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="max-w-6xl mx-auto mb-6 md:mb-8">
            <div className="staff-session-banner rounded-3xl border border-white/15 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(20,184,166,0.1),rgba(30,64,175,0.18))] px-4 md:px-6 py-5 md:py-6 shadow-[0_20px_60px_rgba(2,6,23,0.35)] relative overflow-hidden">
              {/* Shimmer sweep */}
              <div className="staff-banner-shimmer pointer-events-none" />
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 relative z-10">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-sky-100/60 mb-2 flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{boxShadow: '0 0 6px #34d399'}} />
                    Session active
                  </p>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">{currentViewMeta.title}</h2>
                  <p className="text-sm text-sky-100/60 mt-1.5 max-w-2xl">{currentViewMeta.subtitle}</p>
                </div>
              </div>
            </div>
          </section>

          {view === "dashboard" && (
            <section className="max-w-6xl mx-auto space-y-6">
              {isKent && (
                <div className={liquidViewShell}>
                  <div className="text-xs uppercase tracking-[0.2em] text-sky-200/60 mb-3">Dashboard administrateur</div>
                  <KentDashboard />
                </div>
              )}
              <div className={liquidViewShell}>
                <div className="text-xs uppercase tracking-[0.2em] text-sky-200/60 mb-3">Dashboard opérationnel</div>
                <Dashboard onNavigate={setView} />
              </div>
            </section>
          )}

          {view === "tickets" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Tickets /></div></section>
          )}
          {view === "team" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Team /></div></section>
          )}
          {view === "permissions" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Permissions /></div></section>
          )}
          {view === "chat" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Chat /></div></section>
          )}
          {view === "notifications" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Notifications onCountsChange={setNotificationBadge} /></div></section>
          )}
          {view === "malaika" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Malaika /></div></section>
          )}
          {view === "suggestions" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Suggestions /></div></section>
          )}
          {view === "orgchart" && (
            <div className="max-w-5xl mx-auto">
              <div className={liquidViewShell}>
                <OrgChart />
              </div>
            </div>
          )}
          {view === "analytics" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Analytics /></div></section>
          )}
          {view === "settings" && (
            <section className="max-w-6xl mx-auto"><div className={liquidViewShell}><Settings /></div></section>
          )}
        </div>

        {shouldMountQuickAssistant ? <MonarkQuickAssistant /> : null}
      </main>

      <style jsx>{`
        .staff-orb {
          position: absolute;
          border-radius: 9999px;
          filter: blur(60px);
          transform: translateZ(0);
          opacity: 0.55;
        }
        .staff-orb-a {
          width: 28rem;
          height: 28rem;
          left: -8rem;
          top: -7rem;
          background: radial-gradient(circle at 30% 30%, rgba(56, 189, 248, 0.45), rgba(56, 189, 248, 0));
          animation: staffFloatA 18s ease-in-out infinite;
        }
        .staff-orb-b {
          width: 26rem;
          height: 26rem;
          right: -6rem;
          bottom: -8rem;
          background: radial-gradient(circle at 60% 60%, rgba(59, 130, 246, 0.35), rgba(20, 184, 166, 0));
          animation: staffFloatB 22s ease-in-out infinite;
        }
        .staff-grid {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(rgba(125, 211, 252, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(125, 211, 252, 0.07) 1px, transparent 1px);
          background-size: 38px 38px;
          mask-image: radial-gradient(circle at center, black 18%, transparent 72%);
          opacity: 0.3;
        }
        .staff-orb-c {
          width: 20rem;
          height: 20rem;
          left: 50%;
          top: 35%;
          transform: translateX(-50%);
          background: radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.22), rgba(20, 184, 166, 0));
          animation: staffFloatC 28s ease-in-out infinite;
          opacity: 0.45;
        }
        .staff-scanline {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(125, 211, 252, 0.015) 3px,
            rgba(125, 211, 252, 0.015) 4px
          );
          pointer-events: none;
          opacity: 0.6;
        }
        /* Shimmer banner */
        .staff-banner-shimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: staffBannerShimmer 4s ease-in-out infinite;
          border-radius: inherit;
        }
        @keyframes staffFloatA {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          33% { transform: translate3d(22px, 12px, 0) scale(1.06); }
          66% { transform: translate3d(10px, -8px, 0) scale(0.98); }
        }
        @keyframes staffFloatB {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          40% { transform: translate3d(-18px, -16px, 0) scale(1.05); }
          70% { transform: translate3d(-8px, 10px, 0) scale(0.97); }
        }
        @keyframes staffFloatC {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.45; }
          50% { transform: translateX(-50%) scale(1.15); opacity: 0.6; }
        }
        @keyframes staffBannerShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
