"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { ROLE_CATEGORIES } from "@/lib/roles";
import { supabase } from "@/lib/supabaseClient";

interface StaffMember {
  user_id: string;
  role_id: string | null;
  role_name: string | null;
  role_category: string | null;
  full_name: string | null;
  email: string | null;
  status: string;
  accent_color: {
    profile?: {
      avatar_url?: string | null;
      phone_number?: string | null;
      personal_email?: string | null;
      professional_email?: string | null;
      telegram_username?: string | null;
    };
  } | null;
}

function extractProfileMeta(accentColor: StaffMember["accent_color"]) {
  return accentColor?.profile ?? {};
}

function formatStatus(status: string) {
  switch (status) {
    case "approved":
      return "Approuve";
    case "pending_approval":
      return "En attente";
    case "rejected":
      return "Refuse";
    default:
      return "Role a choisir";
  }
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;

  return (
    <div className="text-[11px] text-white/55 truncate">
      <span className="text-white/35">{label}:</span> {value}
    </div>
  );
}

function Avatar({ name, imageUrl, size = 40, color = "#3b82f6" }: { name: string; imageUrl?: string | null; size?: number; color?: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div
      className="rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0 overflow-hidden"
      style={{ width: size, height: size, background: `${color}30`, border: `1.5px solid ${color}60`, fontSize: size * 0.35 }}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={name} width={size} height={size} sizes={`${size}px`} className="w-full h-full object-cover transition-opacity duration-300" />
      ) : (
        initials || "?"
      )}
    </div>
  );
}

export default function OrgChart() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("staff_profiles")
        .select("user_id, role_id, role_name, role_category, full_name, email, status, accent_color")
        .eq("status", "approved");
      setStaff((data as StaffMember[]) ?? []);
      setLoading(false);
    }

    void load();

    const channel = supabase
      .channel("orgchart-staff")
      .on("postgres_changes", { event: "*", schema: "public", table: "staff_profiles" }, () => {
        void load();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const kent = staff.find(m => m.role_id === "admin-supreme");
  const totalRoles = ROLE_CATEGORIES.reduce((acc, c) => acc + c.roles.length, 0);
  const available = totalRoles - staff.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#d4a853]/40 border-t-[#d4a853] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Rôles totaux", value: totalRoles, color: "#d4a853" },
          { label: "Occupés", value: staff.length, color: "#10b981" },
          { label: "Disponibles", value: available, color: "#6b7280" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center border border-white/10 bg-white/5">
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-white/40 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Kent — nœud racine */}
      <div className="flex justify-center">
        <div className="max-w-xs w-full rounded-2xl p-5 border flex items-center gap-4"
          style={{
            background: "rgba(212,168,83,0.05)",
            borderColor: "rgba(212,168,83,0.4)",
            boxShadow: "0 0 30px rgba(212,168,83,0.1)",
          }}
        >
          <Avatar
            name={kent?.full_name ?? kent?.email ?? "Kent"}
            imageUrl={extractProfileMeta(kent?.accent_color ?? null).avatar_url}
            size={52}
            color="#d4a853"
          />
          <div>
            <div className="font-bold text-white text-base">{kent?.full_name ?? kent?.email ?? "Kent"}</div>
            <div className="text-[#d4a853] text-sm font-medium">⚜️ Administrateur Suprême</div>
            <div className="mt-1 space-y-1">
              <InfoLine label="Telephone" value={extractProfileMeta(kent?.accent_color ?? null).phone_number} />
              <InfoLine label="Courriel perso" value={extractProfileMeta(kent?.accent_color ?? null).personal_email} />
              <InfoLine label="Courriel pro" value={extractProfileMeta(kent?.accent_color ?? null).professional_email ?? kent?.email} />
              <InfoLine label="Telegram" value={extractProfileMeta(kent?.accent_color ?? null).telegram_username} />
              <InfoLine label="Statut" value={kent ? formatStatus(kent.status) : undefined} />
            </div>
          </div>
        </div>
      </div>

      {/* Catégories */}
      {ROLE_CATEGORIES.map(category => {
        const categoryMembers = staff.filter(m => m.role_category === category.id && m.role_id !== "admin-supreme");
        return (
          <div key={category.id}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-semibold"
                style={{ background: category.color + "15", borderColor: category.color + "40", color: category.color }}
              >
                <span>{category.emoji}</span>
                <span>{category.name}</span>
                <span className="text-white/30 text-xs font-normal ml-1">{categoryMembers.length}/{category.roles.length}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 ml-4">
              {category.roles.map(role => {
                if ("locked" in role && role.locked) return null;
                const member = staff.find(m => m.role_id === role.id);
                const profileMeta = extractProfileMeta(member?.accent_color ?? null);
                return (
                  <div key={role.id} className="rounded-xl p-3 border transition-all"
                    style={{
                      background: member ? category.color + "08" : "rgba(255,255,255,0.02)",
                      borderColor: member ? category.color + "30" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {member ? (
                        <Avatar name={member.full_name ?? member.email ?? "?"} imageUrl={profileMeta.avatar_url} size={36} color={category.color} />
                      ) : (
                        <div className="w-9 h-9 rounded-xl border border-dashed border-white/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-white/20 text-xs">✦</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-white text-xs truncate">{member?.role_name ?? role.name}</div>
                        {member
                          ? (
                            <div className="mt-1 space-y-1 min-w-0">
                              <div className="text-white/85 text-sm truncate">{member.full_name ?? member.email}</div>
                              <InfoLine label="Telephone" value={profileMeta.phone_number} />
                              <InfoLine label="Courriel perso" value={profileMeta.personal_email} />
                              <InfoLine label="Courriel pro" value={profileMeta.professional_email ?? member.email} />
                              <InfoLine label="Telegram" value={profileMeta.telegram_username} />
                              <InfoLine label="Statut" value={formatStatus(member.status)} />
                            </div>
                          )
                          : <div className="text-white/20 text-xs">Disponible</div>
                        }
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
