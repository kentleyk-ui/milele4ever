"use client";
import { useEffect, useState } from "react";
import { LiquidMetalButton } from "./DynamicLiquidMetalButton";
import { ThemeIcon } from "./ThemeIcon";
import { useLocale } from "@/lib/locale-context";

const THEME_KEY = "theme-preference";

const MODES = ["light", "dark", "system"] as const;

export default function ThemeModal() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<string | null>(null);

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
    const saved = localStorage.getItem(THEME_KEY);
    if (!saved) setOpen(true);
    else {
      setTheme(saved);
      applyTheme(saved);
    }
  }, []);

  function handleSelect(mode: string) {
    setTheme(mode);
    localStorage.setItem(THEME_KEY, mode);
    applyTheme(mode);
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="rounded-2xl border p-4 w-56 max-w-[calc(100vw-2rem)] animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-300"
        style={{
          background: "color-mix(in srgb, var(--card) 85%, transparent)",
          backdropFilter: "blur(20px)",
          borderColor: "color-mix(in srgb, var(--primary) 15%, var(--border))",
          boxShadow: "0 8px 40px oklch(0.10 0.03 150 / 0.18), 0 0 0 1px oklch(0.42 0.10 152 / 0.06)",
          willChange: 'transform, opacity',
        }}
      >
        <p
          className="text-xs font-medium tracking-wider text-center mb-3"
          style={{ color: "var(--primary)", opacity: 0.7 }}
        >
          {t('theme.title')}
        </p>
        <div className="flex items-center justify-center gap-2">
          {MODES.map((key) => {
            const label = t(`theme.${key}`);
            return (
            <div key={key} className="flex flex-col items-center gap-1">
              <LiquidMetalButton
                viewMode="icon"
                width={44}
                height={44}
                tinted
                iconNode={<ThemeIcon theme={key} size={18} />}
                onClick={() => handleSelect(key)}
                label={label}
                aria-label={label}
                tabIndex={0}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <span
                className="text-[9px] font-medium tracking-wide"
                style={{ color: "var(--foreground)", opacity: 0.5 }}
              >
                {label}
              </span>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
