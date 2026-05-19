"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type StaffView = "dashboard" | "tickets" | "team" | "permissions" | "chat" | "notifications" | "malaika" | "suggestions" | "orgchart" | "analytics" | "settings";

type StaffTool = {
  label: string;
  icon: string;
  href: string;
  description: string;
};

const STAFF_TOOLS: StaffTool[] = [
  { label: "Bord", icon: "📊", href: "/staff?view=dashboard", description: "Vue d'ensemble du tableau de bord" },
  { label: "Tickets", icon: "🎫", href: "/staff?view=tickets", description: "Gestion des tickets et demandes" },
  { label: "Équipe", icon: "👥", href: "/staff?view=team", description: "Gestion de l'équipe" },
  { label: "Permissions", icon: "🔐", href: "/staff?view=permissions", description: "Gestion des permissions" },
  { label: "Chat", icon: "💬", href: "/staff?view=chat", description: "Canal de communication" },
  { label: "Notifications", icon: "🔔", href: "/staff?view=notifications", description: "Notifications et alertes" },
  { label: "Monark", icon: "🤖", href: "/staff?view=malaika", description: "Assistant IA Monark" },
  { label: "Suggestions", icon: "💡", href: "/staff?view=suggestions", description: "Gestion des suggestions" },
  { label: "Organigramme", icon: "🏢", href: "/staff?view=orgchart", description: "Structure organisationnelle" },
  { label: "Stats", icon: "📈", href: "/staff?view=analytics", description: "Analyse et statistiques" },
  { label: "Réglages", icon: "⚙️", href: "/staff?view=settings", description: "Paramètres" },
  { label: "Liquid Dash", icon: "💧", href: "/staff/liquid-dash", description: "Dashboard Liquid avancé" },
  { label: "Liquid Dash Data", icon: "🗂️", href: "/staff/liquid-dash/data", description: "Données détaillées du dashboard Liquid" },
  { label: "Malaika", icon: "🌟", href: "/staff/malaika", description: "Interface Malaika" },
];

export default function StaffDashboardHome() {
  const router = useRouter();
  const [staffInfo, setStaffInfo] = useState<{
    name: string;
    role: string;
    isKent: boolean;
  }>({ name: "Staff", role: "Rôle", isKent: false });

  useEffect(() => {
    const getStaffInfo = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user?.email) return;

      const isKent = user.email === "kentleyk@gmail.com";
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("full_name, role_name")
        .eq("user_id", user.id)
        .single();

      setStaffInfo({
        name: profile?.full_name ?? user.email.split("@")[0],
        role: isKent ? "Administrateur Suprême" : profile?.role_name ?? "Rôle",
        isKent,
      });
    };

    void getStaffInfo();
  }, []);

  const handleNavigate = (tool: StaffTool) => {
    router.push(tool.href);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/staff");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#07142b] via-[#0a1c3f] to-[#081b38] relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="staff-orb staff-orb-a" />
        <div className="staff-orb staff-orb-b" />
        <div className="staff-orb staff-orb-c" />
        <div className="staff-grid" />
        <div className="staff-scanline" />
      </div>

      {/* Header */}
      <header
        className="relative z-10 border-b backdrop-blur-xl shadow-sm p-6"
        style={{
          background: staffInfo.isKent ? "rgba(212,168,83,0.04)" : "rgba(255,255,255,0.03)",
          borderColor: staffInfo.isKent ? "rgba(212,168,83,0.12)" : "rgba(255,255,255,0.08)",
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2">Staff Portal</h1>
            <p className="text-sm text-white/60">
              Bienvenue, <span className="font-semibold text-white">{staffInfo.name}</span> •{" "}
              <span style={{ color: staffInfo.isKent ? "#d4a853" : "#7dd3fc" }}>{staffInfo.role}</span>
            </p>
          </div>
          <button
            onClick={() => handleLogout()}
            className="px-6 py-2 rounded-xl border text-sm font-semibold transition-all hover:opacity-80"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.8)",
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          {/* Title Section */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Tous les outils du Staff</h2>
            <p className="text-white/60">Chaque bouton ouvre une page Staff existante, sans menu intermédiaire.</p>
          </section>

          {/* Tools Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
            {STAFF_TOOLS.map((tool) => (
              <button
                key={`${tool.label}-${tool.href}`}
                onClick={() => handleNavigate(tool)}
                className="group relative rounded-2xl p-4 transition-all duration-300 hover:scale-105 active:scale-95 text-left"
                style={{
                  background: "linear-gradient(135deg, rgba(56,189,248,0.1), rgba(20,184,166,0.05))",
                  border: "1px solid rgba(56,189,248,0.2)",
                }}
              >
                {/* Hover effect */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(56,189,248,0.2), transparent 70%)",
                  }}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-3xl mb-3">{tool.icon}</div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-sky-200 transition-colors">{tool.label}</h3>
                  <p className="text-xs text-white/60 group-hover:text-white/80 transition-colors">{tool.description}</p>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                  <svg
                    className="w-5 h-5 text-sky-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </button>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
