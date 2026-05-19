import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { useAccentColor } from "@/hooks/useAccentColor";
import { getRoleById } from "@/lib/roles";
import { loadSmartNotificationSettings, saveSmartNotificationSettings, type SmartNotificationLevel } from "@/lib/local-preferences";
import { StaffNotice, StaffPanel, StaffShell } from "@/components/staff/StaffDesignSystem";

type ProfileMeta = {
  avatar_url?: string | null;
  phone_number?: string | null;
  personal_email?: string | null;
  professional_email?: string | null;
  telegram_username?: string | null;
};

type AccentPayload = {
  h?: number;
  s?: number;
  l?: number;
  profile?: ProfileMeta;
  [key: string]: unknown;
} | null;

function normalizeText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractProfileMeta(accent: unknown): ProfileMeta {
  if (!accent || typeof accent !== "object" || !("profile" in accent)) {
    return {};
  }

  const profile = (accent as { profile?: ProfileMeta }).profile;
  return profile && typeof profile === "object" ? profile : {};
}

function isValidHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function toUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

type ResetScope = "all" | "malaika" | "monark" | "connections" | "circle" | "private" | "staff";
type ResetState = "idle" | "confirming" | "running" | "done" | "error";

export default function Settings() {
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifLevel, setNotifLevel] = useState<SmartNotificationLevel>("priority");
  const [digestHour, setDigestHour] = useState(9);
  const [autoSave, setAutoSave] = useState(true);
  const [maintenance, setMaintenance] = useState(false);
  const [lang, setLang] = useState("fr");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("Staff");
  const [accountEmail, setAccountEmail] = useState("");
  const [personalEmail, setPersonalEmail] = useState("");
  const [professionalEmail, setProfessionalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [status, setStatus] = useState("pending_role");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [photoUrlInput, setPhotoUrlInput] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [staffRoleId, setStaffRoleId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accentSnapshot, setAccentSnapshot] = useState<AccentPayload>(null);
  const [pushPermission, setPushPermission] = useState<string>("unsupported");

  const { color, selectColor, presets } = useAccentColor();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [resetState, setResetState] = useState<ResetState>("idle");
  const [resetScope, setResetScope] = useState<ResetScope>("all");
  const [resetResults, setResetResults] = useState<string[]>([]);

  useEffect(() => {
    if (saveState !== "saved") return;
    const timeoutId = window.setTimeout(() => {
      setSaveState("idle");
      setSaveMessage(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [saveState]);

  useEffect(() => {
    const smart = loadSmartNotificationSettings();
    setNotifEmail(smart.email);
    setNotifPush(smart.push);
    setNotifLevel(smart.level);
    setDigestHour(smart.dailyDigestHour);

    if (typeof window !== "undefined" && "Notification" in window) {
      setPushPermission(Notification.permission);
    }

    supabase.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user;
      if (!user) return;
      setAccountEmail(user.email ?? "");
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("staff_profiles")
        .select("full_name, role_id, status, accent_color")
        .eq("user_id", user.id)
        .single();

      const p = profile as {
        full_name: string | null;
        role_id: string | null;
        status: string | null;
        accent_color: AccentPayload;
      } | null;

      const profileMeta = extractProfileMeta(p?.accent_color);
      setFullName(p?.full_name ?? user.email?.split("@")[0] ?? "Staff");
      setStaffRoleId(p?.role_id ?? null);
      setStatus(p?.status ?? "pending_role");
      setPersonalEmail(profileMeta.personal_email ?? "");
      setProfessionalEmail(profileMeta.professional_email ?? user.email ?? "");
      setPhoneNumber(profileMeta.phone_number ?? "");
      setTelegramUsername(profileMeta.telegram_username ?? "");
      setAvatarUrl(profileMeta.avatar_url ?? "");
      setPhotoUrlInput(profileMeta.avatar_url ?? "");
      setAccentSnapshot(p?.accent_color ?? null);
    });
  }, []);

  useEffect(() => {
    saveSmartNotificationSettings({
      email: notifEmail,
      push: notifPush,
      level: notifLevel,
      dailyDigestHour: digestHour,
    });
  }, [notifEmail, notifPush, notifLevel, digestHour]);

  const roleInfo = staffRoleId ? getRoleById(staffRoleId) : null;
  const profileInitials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "ST";

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      setSaveState("error");
      setSaveMessage("Choisis une image valide.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSaveState("error");
      setSaveMessage("La photo doit faire moins de 5 Mo.");
      return;
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setSaveState("error");
      setSaveMessage("Session introuvable pour l'upload de la photo.");
      return;
    }

    setUploadingPhoto(true);
    setSaveState("idle");
    setSaveMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/staff/profile-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.publicUrl) {
        throw new Error(result.error ?? "Upload impossible");
      }

      setAvatarUrl(result.publicUrl as string);
      setPhotoUrlInput(result.publicUrl as string);
      setSaveMessage("Photo chargee. Clique sur Sauvegarder pour publier le profil.");
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Upload impossible");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    await uploadPhoto(file);
  }

  function applyPhotoUrl() {
    const nextUrl = photoUrlInput.trim();
    if (!nextUrl) {
      setAvatarUrl("");
      setSaveState("idle");
      setSaveMessage("Photo retiree. Clique sur Sauvegarder pour valider.");
      return;
    }

    if (!isValidHttpUrl(nextUrl)) {
      setSaveState("error");
      setSaveMessage("L'URL de photo doit commencer par http:// ou https://");
      return;
    }

    setAvatarUrl(nextUrl);
    setSaveState("idle");
    setSaveMessage("Lien photo applique. Clique sur Sauvegarder pour publier le profil.");
  }

  async function handleSave() {
    if (!userId) {
      setSaveState("error");
      setSaveMessage("Utilisateur introuvable.");
      return;
    }

    if (photoUrlInput.trim() && avatarUrl !== photoUrlInput.trim()) {
      setSaveState("error");
      setSaveMessage("Applique d'abord l'URL de photo avant de sauvegarder.");
      return;
    }

    setSaveState("saving");
    setSaveMessage(null);

    const currentAccent = accentSnapshot && typeof accentSnapshot === "object" ? accentSnapshot : {};
    const nextAccent = {
      ...currentAccent,
      h: color.h,
      s: color.s,
      l: color.l,
      profile: {
        ...(currentAccent.profile && typeof currentAccent.profile === "object" ? currentAccent.profile : {}),
        avatar_url: normalizeText(avatarUrl),
        phone_number: normalizeText(phoneNumber),
        personal_email: normalizeText(personalEmail),
        professional_email: normalizeText(professionalEmail) ?? accountEmail,
        telegram_username: normalizeText(telegramUsername),
        notifications: {
          email: notifEmail,
          push: notifPush,
          level: notifLevel,
          daily_digest_hour: digestHour,
        },
      },
    };

    const { error } = await supabase
      .from("staff_profiles")
      .upsert({
        user_id: userId,
        role: staffRoleId ?? "member",
        role_id: staffRoleId,
        role_name: roleInfo?.name ?? null,
        role_category: roleInfo?.category.id ?? null,
        status,
        full_name: fullName.trim() || accountEmail.split("@")[0] || "Staff",
        email: accountEmail,
        accent_color: nextAccent,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      setSaveState("error");
      setSaveMessage(error.message);
      return;
    }

    setAccentSnapshot(nextAccent);
    setSaveState("saved");
    setSaveMessage("Profil staff mis a jour.");
  }

  const saveButtonClass = saveState === "saved"
    ? "bg-emerald-500 text-white"
    : saveState === "saving"
      ? "bg-slate-600 text-white cursor-wait"
      : "bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:scale-105";

  const statusLabel = {
    pending_role: "Role a choisir",
    pending_approval: "En attente de validation",
    approved: "Approuve",
    rejected: "Refuse",
  }[status] ?? status;

  async function askPushPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setPushPermission(permission);
    if (permission === "granted") {
      new Notification("Aeternum", {
        body: "Notifications intelligentes actives.",
      });

      // Activer aussi l'abonnement push navigateur (mode app fermée) si possible.
      try {
        if (!("serviceWorker" in navigator)) return;
        const registration = await navigator.serviceWorker.ready;
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey || !("PushManager" in window)) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: toUint8Array(vapidPublicKey),
        });

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) return;

        await fetch("/api/staff/push-subscription", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(subscription),
        });
      } catch {
        // L'abonnement push peut échouer selon navigateur/configuration; on garde la permission locale.
      }
    }
  }

  return (
    <StaffShell maxWidthClass="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Paramètres</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configuration de la plateforme Aeternum</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveState === "saving" || uploadingPhoto}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold shadow-lg transition text-sm disabled:opacity-70 disabled:hover:scale-100 ${saveButtonClass}`}
        >
          {saveState === "saved" ? (
            <><svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2 7l4 4 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Sauvegardé</>
          ) : saveState === "saving" ? (
            <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sauvegarde...</>
          ) : (
            <><svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M2 2h8l2 2v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2z" stroke="white" strokeWidth="1.4"/><rect x="4" y="8" width="6" height="4" rx="0.5" stroke="white" strokeWidth="1.2"/><rect x="4" y="2" width="5" height="3" rx="0.5" stroke="white" strokeWidth="1.2"/></svg>Sauvegarder</>
          )}
        </button>
      </div>

      {saveMessage && (
        <StaffNotice tone={saveState === "error" ? "danger" : "success"}>
          {saveMessage}
        </StaffNotice>
      )}

      {/* Profil */}
      <StaffPanel className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400">
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2 12c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          Profil
        </h2>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileChange} />
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <div className="w-24 h-24 rounded-3xl overflow-hidden border border-white/15 bg-white/5 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={fullName} width={96} height={96} sizes="96px" className="w-full h-full object-cover transition-opacity duration-300" />
              ) : (
                profileInitials
              )}
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-sm font-semibold text-white">Photo de profil staff</div>
                <p className="text-xs text-white/45 mt-1">
                  Les membres peuvent prendre une photo avec le telephone, choisir un fichier local ou coller une URL d'une autre plateforme.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => cameraInputRef.current?.click()} className="px-3 py-2 rounded-xl border border-sky-400/30 bg-sky-500/10 text-sky-200 text-sm font-medium hover:bg-sky-500/20 transition">
                  Prendre une photo
                </button>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 rounded-xl border border-white/15 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition">
                  Choisir un fichier
                </button>
                <button type="button" onClick={() => { setAvatarUrl(""); setPhotoUrlInput(""); setSaveMessage("Photo retiree. Clique sur Sauvegarder pour valider."); setSaveState("idle"); }} className="px-3 py-2 rounded-xl border border-rose-400/25 bg-rose-500/10 text-rose-200 text-sm font-medium hover:bg-rose-500/20 transition">
                  Retirer
                </button>
              </div>
              {uploadingPhoto && <p className="text-xs text-sky-200">Upload de la photo en cours...</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">URL de photo externe</label>
              <input value={photoUrlInput} onChange={(e) => setPhotoUrlInput(e.target.value)} placeholder="https://..." className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400" />
            </div>
            <button type="button" onClick={applyPhotoUrl} className="sm:self-end px-4 py-2.5 rounded-xl bg-white/10 border border-white/15 text-white text-sm font-medium hover:bg-white/15 transition">
              Utiliser l'URL
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Nom complet</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Statut</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white">
              <span className={`inline-flex w-2.5 h-2.5 rounded-full ${status === "approved" ? "bg-emerald-400" : status === "rejected" ? "bg-rose-400" : "bg-amber-400"}`} />
              {statusLabel}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Rôle Aeternum</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
              {roleInfo ? (
                <>
                  <span>{roleInfo.category.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: roleInfo.category.color }}>
                    {roleInfo.name}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Rôle non défini</span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Telephone</label>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+243 ..." className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Courriel personnel</label>
            <input type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} placeholder="personnel@..." className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Courriel professionnel</label>
            <input type="email" value={professionalEmail} onChange={(e) => setProfessionalEmail(e.target.value)} placeholder="pro@..." className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Courriel du compte</label>
            <input value={accountEmail} readOnly className="w-full rounded-xl px-3 py-2.5 bg-white/5 border border-white/10 text-gray-400 text-sm cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Telegram</label>
            <input value={telegramUsername} onChange={(e) => setTelegramUsername(e.target.value)} placeholder="@pseudo" className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Langue</label>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none">
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </StaffPanel>

      {/* Apparence */}
      <StaffPanel className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/><path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          Apparence — Couleur d'accent
        </h2>
        <div>
          <label className="block text-xs text-gray-400 mb-3">
            Choisis ta couleur personnelle (12 préréglages Aeternum)
          </label>
          <div className="flex flex-wrap gap-3">
            {presets.map((p) => {
              const isSelected = color.h === p.h && color.s === p.s && color.l === p.l;
              const hsl = `hsl(${p.h}, ${p.s}%, ${p.l}%)`;
              return (
                <button
                  key={p.name}
                  title={p.name}
                  onClick={() => selectColor(p)}
                  className="w-9 h-9 rounded-full transition-all relative"
                  style={{
                    background: hsl,
                    boxShadow: isSelected ? `0 0 0 3px rgba(255,255,255,0.2), 0 0 12px ${hsl}` : "none",
                    transform: isSelected ? "scale(1.15)" : "scale(1)",
                    outline: isSelected ? `2px solid ${hsl}` : "none",
                    outlineOffset: "2px",
                  }}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xs">✓</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-white/30 mt-2">
            Préréglage actuel : <span style={{ color: `hsl(${color.h},${color.s}%,${color.l}%)` }}>
              {presets.find(p => p.h === color.h && p.s === color.s && p.l === color.l)?.name ?? "Personnalisé"}
            </span>
          </p>
        </div>
      </StaffPanel>

      {/* Notifications */}
      <StaffPanel className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><path d="M7 1a4 4 0 00-4 4v2.5L1.5 9h11L11 7.5V5a4 4 0 00-4-4zM5.5 9.5a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          Notifications
        </h2>
        {[
          { label: "Notifications email", sub: "Recevoir les alertes par email", val: notifEmail, set: setNotifEmail },
          { label: "Notifications push", sub: "Alertes en temps réel dans le navigateur", val: notifPush, set: setNotifPush },
        ].map((item) => (
          <label key={item.label} className="flex items-center justify-between cursor-pointer group">
            <div>
              <div className="text-sm font-medium text-white/90">{item.label}</div>
              <div className="text-xs text-gray-500">{item.sub}</div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? "bg-sky-500" : "bg-white/20"}`}
              onClick={() => item.set(!item.val)}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.val ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </label>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Mode intelligent</label>
            <select
              value={notifLevel}
              onChange={(e) => setNotifLevel(e.target.value as SmartNotificationLevel)}
              className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none"
            >
              <option value="all">Tout notifier</option>
              <option value="priority">Priorite seulement</option>
              <option value="digest">Resume quotidien</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Heure du digest</label>
            <input
              type="number"
              min={0}
              max={23}
              value={digestHour}
              onChange={(e) => setDigestHour(Math.max(0, Math.min(23, Number(e.target.value) || 0)))}
              className="w-full rounded-xl px-3 py-2.5 bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/90 font-medium">Permission push navigateur</div>
            <div className="text-xs text-gray-500">Etat actuel: {pushPermission}</div>
          </div>
          <button
            type="button"
            onClick={askPushPermission}
            className="px-3 py-2 rounded-xl border border-sky-400/30 bg-sky-500/10 text-sky-200 text-xs font-semibold hover:bg-sky-500/20"
          >
            Tester / activer
          </button>
        </div>
      </StaffPanel>

      {/* Système */}
      <StaffPanel className="flex flex-col gap-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-slate-500/20 flex items-center justify-center text-slate-400">
            <svg width="14" height="14" fill="none" viewBox="0 0 14 14"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </span>
          Système
        </h2>
        {[
          { label: "Sauvegardes automatiques", sub: "Sauvegarder l'état toutes les heures", val: autoSave, set: setAutoSave },
          { label: "Mode maintenance", sub: "Désactive l'accès public à la plateforme", val: maintenance, set: setMaintenance, danger: true },
        ].map((item) => (
          <label key={item.label} className="flex items-center justify-between cursor-pointer">
            <div>
              <div className={`text-sm font-medium ${item.danger ? "text-rose-300" : "text-white/90"}`}>{item.label}</div>
              <div className="text-xs text-gray-500">{item.sub}</div>
            </div>
            <div
              className={`w-11 h-6 rounded-full transition-colors relative ${item.val ? (item.danger ? "bg-rose-500" : "bg-sky-500") : "bg-white/20"}`}
              onClick={() => item.set(!item.val)}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.val ? "translate-x-5" : "translate-x-0.5"}`} />
            </div>
          </label>
        ))}
      </StaffPanel>

      {/* Danger zone */}
      <StaffPanel className="bg-rose-900/20 border-rose-500/20 flex flex-col gap-4">
        <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
          <svg width="16" height="16" fill="none" viewBox="0 0 16 16"><path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          Zone dangereuse
        </h2>

        {/* Sélecteur de scope */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wide">Périmètre de réinitialisation</div>
          <div className="flex flex-wrap gap-2">
            {([
              { key: "all", label: "Tout" },
              { key: "malaika", label: "Malaïka (mémoire)" },
              { key: "monark", label: "Monark (messages)" },
              { key: "connections", label: "Connexions test" },
              { key: "circle", label: "Cercle test" },
            ] as { key: ResetScope; label: string }[]).map(s => (
              <button
                key={s.key}
                onClick={() => setResetScope(s.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition"
                style={{
                  borderColor: resetScope === s.key ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)",
                  background: resetScope === s.key ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.03)",
                  color: resetScope === s.key ? "#fca5a5" : "rgba(255,255,255,0.45)",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bouton + confirmation */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-white/80">Réinitialiser les données de test</div>
            <div className="text-xs text-gray-500">Efface les données temporaires sans toucher au code ni à la structure.</div>
          </div>

          {resetState === "idle" && (
            <button
              onClick={() => setResetState("confirming")}
              className="px-4 py-2 rounded-xl text-sm font-semibold border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 transition whitespace-nowrap"
            >
              Réinitialiser
            </button>
          )}

          {resetState === "confirming" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-300">Confirmer ?</span>
              <button
                onClick={async () => {
                  setResetState("running");
                  setResetResults([]);
                  try {
                    const { data: s } = await supabase.auth.getSession();
                    const token = s.session?.access_token;
                    const res = await fetch("/api/admin/reset-test-data", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ scope: resetScope }),
                    });
                    const data = await res.json() as { ok?: boolean; results?: string[]; error?: string };
                    setResetResults(data.results ?? [data.error ?? "Erreur inconnue"]);
                    if (data.ok && (resetScope === "all" || resetScope === "private")) {
                      localStorage.removeItem("milele-dossier");
                      localStorage.removeItem("milele-local-only-mode");
                      localStorage.removeItem("milele-secure-vault");
                      localStorage.removeItem("milele_public_malaika_uid");
                      sessionStorage.removeItem("milele-vault-session-passphrase");
                    }
                    setResetState(data.ok ? "done" : "error");
                  } catch {
                    setResetResults(["Connexion impossible."]);
                    setResetState("error");
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 border border-rose-500/50 text-rose-300 hover:bg-rose-500/30 transition"
              >
                Oui, effacer
              </button>
              <button
                onClick={() => setResetState("idle")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white/40 hover:bg-white/5 transition"
              >
                Annuler
              </button>
            </div>
          )}

          {resetState === "running" && (
            <span className="flex items-center gap-2 text-xs text-rose-300">
              <span className="w-3 h-3 rounded-full border-2 border-rose-400/30 border-t-rose-400 animate-spin" />
              Réinitialisation...
            </span>
          )}

          {(resetState === "done" || resetState === "error") && (
            <button
              onClick={() => { setResetState("idle"); setResetResults([]); }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-white/10 text-white/50 hover:bg-white/5 transition"
            >
              Fermer
            </button>
          )}
        </div>

        {/* Résultats */}
        {resetResults.length > 0 && (
          <div className={`rounded-xl border p-3 flex flex-col gap-1 text-xs ${
            resetState === "done"
              ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-200"
              : "bg-rose-500/8 border-rose-500/20 text-rose-200"
          }`}>
            {resetResults.map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <span className="mt-0.5 opacity-60">{resetState === "done" ? "✓" : "✗"}</span>
                <span>{r}</span>
              </div>
            ))}
          </div>
        )}
      </StaffPanel>
    </StaffShell>
  );
}
