"use client";
import { useEffect, useState, useRef } from "react";
import { ThemeIcon } from "./ThemeIcon";
import { LiquidMetalButton } from "./DynamicLiquidMetalButton";

const THEME_KEY = "theme-preference";
const MODES = ["light", "dark", "system"] as const;

export default function ThemeSwitcher() {
  const [isPrimaryInstance, setIsPrimaryInstance] = useState(true);
  const [theme, setTheme] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  function applyTheme(mode: string) {
    const html = document.documentElement;
    html.classList.remove("dark");
    if (mode === "dark") html.classList.add("dark");
    if (mode === "system") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        html.classList.add("dark");
      }
    }
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const globalWindow = window as any;
    if (globalWindow.__themeSwitcherMounted) {
      setIsPrimaryInstance(false);
      return;
    }
    globalWindow.__themeSwitcherMounted = true;
    return () => {
      globalWindow.__themeSwitcherMounted = false;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) || "system";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  // Fermer le popover au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleSelect(mode: string) {
    setTheme(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
    setOpen(false);
  }

  if (!isPrimaryInstance) return null;

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Bouton principal — LiquidMetal */}
      <LiquidMetalButton
        viewMode="icon"
        width={44}
        height={44}
        tinted
        iconNode={
          <span className="transition-transform duration-300 group-hover:rotate-45">
            <ThemeIcon theme={theme || "system"} size={18} />
          </span>
        }
        onClick={() => setOpen((v) => !v)}
        label="Changer le thème"
        aria-label="Changer le thème"
        tabIndex={0}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />

      {/* Popover — pill horizontal avec LiquidMetal buttons */}
      <div
        className={`absolute top-full mt-2 right-0 flex items-center gap-1.5 rounded-full p-1 backdrop-blur-2xl border transition-all duration-300 origin-top-right ${
          open
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-90 opacity-0 -translate-y-1 pointer-events-none"
        }`}
        style={{
          background: 'color-mix(in srgb, var(--card) 68%, rgba(59,130,246,0.24))',
          borderColor: 'var(--border)',
          boxShadow: '0 18px 48px rgba(2,6,23,0.42), 0 8px 26px rgba(30,64,175,0.3), 0 0 0 1px rgba(96,165,250,0.25), inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(15,23,42,0.25)',
        }}
      >
        {MODES.map((mode) => {
          const isActive = theme === mode;
          return (
            <div key={mode} className="relative">
              <LiquidMetalButton
                viewMode="icon"
                width={36}
                height={36}
                tinted
                iconNode={<ThemeIcon theme={mode} size={16} />}
                onClick={() => handleSelect(mode)}
                label={mode === "light" ? "Mode clair" : mode === "dark" ? "Mode sombre" : "Mode système"}
                aria-label={mode === "light" ? "Mode clair" : mode === "dark" ? "Mode sombre" : "Mode système"}
                tabIndex={0}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {/* Indicateur actif */}
              {isActive && (
                <div
                  className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                  style={{ background: 'var(--primary)', boxShadow: '0 0 6px var(--primary)' }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
