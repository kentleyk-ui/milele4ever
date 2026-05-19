"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Download, Plus, X, Share } from "lucide-react";
import { useLocale } from "@/lib/locale-context";

type Platform = "ios" | "android" | "desktop" | null;

function isStandalone() {
  if (typeof window === "undefined") return false;
  // iOS
  if ((window.navigator as any).standalone) return true;
  // Others
  return window.matchMedia("(display-mode: standalone)").matches;
}


function detectPlatform(): Platform {
  if (typeof window === 'undefined' || !window.navigator) return null;
  const ua = window.navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  if (/windows|macintosh|linux/i.test(ua)) return "desktop";
  return null;
}
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
export default function InstallPrompt() {
  const { t } = useLocale();
  const [platform, setPlatform] = useState<Platform>(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showInstalledBadge, setShowInstalledBadge] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPlatform(detectPlatform());
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isStandalone()) return;

    setShowInstalledBadge(true);
    const timeoutId = window.setTimeout(() => setShowInstalledBadge(false), 5000);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (isStandalone()) return;
    const dismissed = localStorage.getItem("milele-install-dismissed");
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    if (detectPlatform() === "ios") {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (platform === "ios") {
      setShowIOSGuide(true);
    } else if (platform === "desktop") {
      setShowDesktopGuide(true);
    }
  }, [deferredPrompt, platform]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    setShowDesktopGuide(false);
    localStorage.setItem("milele-install-dismissed", Date.now().toString());
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { updateViaCache: "none" })
        .then((reg) => reg.update())
        .catch(() => {});
    }
  }, []);

  if (isStandalone()) {
    if (!showInstalledBadge) return null;
    return (
      <div className="fixed bottom-4 right-4 z-[70]">
        <div
          className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
          style={{
            background: "color-mix(in srgb, var(--primary) 20%, var(--card))",
            color: "var(--primary)",
            border: "1px solid color-mix(in srgb, var(--primary) 30%, var(--border))",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {t("install.badge.installed")}
        </div>
      </div>
    );
  }

  if (!showBanner) return null;

  return (
    <>
      {/* ── Bannière d'installation ── */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[70] sm:max-w-[380px]" style={{ animation: "installSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards", willChange: 'transform, opacity' }}>
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)", border: "1px solid color-mix(in srgb, var(--primary) 15%, var(--border))", boxShadow: "0 16px 48px oklch(0.08 0.04 150 / 0.3), 0 0 0 1px color-mix(in srgb, var(--primary) 5%, transparent)" }}>
          {/* Icône */}
          <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
            <Download size={20} style={{ color: "var(--primary)" }} />
          </div>
          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium leading-tight" style={{ color: "var(--foreground)" }}>{t('install.title')}</p>
            <p className="text-[12px] mt-1 leading-snug" style={{ color: "var(--muted-foreground)" }}>{platform === "ios" ? t('install.desc.ios') : t('install.desc.other')}</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall} className="px-4 py-1.5 rounded-xl text-[12px] font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" style={{ background: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "0 2px 12px oklch(0.42 0.10 152 / 0.3)" }}>{platform === "ios" || (platform === "desktop" && !deferredPrompt) ? t('install.howto') : t('install.install')}</button>
              <button onClick={handleDismiss} className="px-3 py-1.5 rounded-xl text-[12px] transition-colors duration-200" style={{ color: "var(--muted-foreground)", background: "color-mix(in srgb, var(--muted-foreground) 8%, transparent)" }}>{t('install.later')}</button>
            </div>
          </div>
          {/* Bouton fermer */}
          <button onClick={handleDismiss} className="shrink-0 p-1 rounded-lg transition-opacity hover:opacity-70" style={{ color: "var(--muted-foreground)" }} aria-label={t("common.close")}>
            <X size={14} />
          </button>
        </div>
      </div>
      {/* ── Guide iOS overlay ── */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" style={{ background: "oklch(0.05 0.02 150 / 0.6)", backdropFilter: "blur(8px)" }} onClick={handleDismiss}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "color-mix(in srgb, var(--card) 90%, transparent)", backdropFilter: "blur(24px)", border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-center mb-5" style={{ color: "var(--foreground)" }}>{t('install.ios.title')}</h3>
            <div className="flex flex-col gap-4">
              <Step num={1} icon={<Share size={16} />} text={<span dangerouslySetInnerHTML={{ __html: t('install.ios.step1') }} />} />
              <Step num={2} icon={<Plus size={16} />} text={<span dangerouslySetInnerHTML={{ __html: t('install.ios.step2') }} />} />
              <Step num={3} icon={<Download size={16} />} text={<span dangerouslySetInnerHTML={{ __html: t('install.ios.step3') }} />} />
            </div>
            <button onClick={handleDismiss} className="w-full mt-5 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>{t('install.understood')}</button>
          </div>
        </div>
      )}
      {showDesktopGuide && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4" style={{ background: "oklch(0.05 0.02 150 / 0.6)", backdropFilter: "blur(8px)" }} onClick={handleDismiss}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "color-mix(in srgb, var(--card) 90%, transparent)", backdropFilter: "blur(24px)", border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" }} onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-semibold text-center mb-5" style={{ color: "var(--foreground)" }}>{t("install.desktop.title")}</h3>
            <div className="flex flex-col gap-4 text-[13px]" style={{ color: "var(--foreground)" }}>
              <p>{t("install.desktop.step1")}</p>
              <p>{t("install.desktop.step2")}</p>
              <p>{t("install.desktop.step3")}</p>
            </div>
            <button onClick={handleDismiss} className="w-full mt-5 py-2.5 rounded-xl text-[13px] font-medium transition-all hover:scale-[1.01] active:scale-[0.99]" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>{t("install.understood")}</button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes installSlideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

function Step({ num, icon, text }: { num: number; icon: React.ReactNode; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold"
        style={{
          background: "color-mix(in srgb, var(--primary) 12%, transparent)",
          color: "var(--primary)",
        }}
      >
        {num}
      </div>
      <p className="text-[13px] leading-snug pt-0.5" style={{ color: "var(--foreground)" }}>
        {text}
      </p>
    </div>
  )
}

