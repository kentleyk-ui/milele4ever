import { createContext, useContext, useEffect, useState } from "react";

const COLORS = {
  blue: {
    name: "Bleu",
    bg: "from-blue-900 via-indigo-900 to-slate-900 dark:from-black dark:via-blue-950 dark:to-slate-900",
    card: "from-white/30 via-blue-200/20 to-blue-900/20 dark:from-black/40 dark:via-blue-900/30 dark:to-slate-900/40",
    ring: "ring-blue-400/30",
    accent: "text-blue-200",
    button: "from-blue-500 via-indigo-500 to-purple-600",
  },
  red: {
    name: "Rouge",
    bg: "from-red-900 via-rose-900 to-zinc-900 dark:from-black dark:via-red-950 dark:to-zinc-900",
    card: "from-white/30 via-red-200/20 to-red-900/20 dark:from-black/40 dark:via-red-900/30 dark:to-zinc-900/40",
    ring: "ring-red-400/30",
    accent: "text-red-200",
    button: "from-red-500 via-rose-500 to-orange-600",
  },
  green: {
    name: "Vert",
    bg: "from-green-900 via-emerald-900 to-slate-900 dark:from-black dark:via-green-950 dark:to-slate-900",
    card: "from-white/30 via-green-200/20 to-green-900/20 dark:from-black/40 dark:via-green-900/30 dark:to-slate-900/40",
    ring: "ring-green-400/30",
    accent: "text-green-200",
    button: "from-green-500 via-emerald-500 to-teal-600",
  },
  purple: {
    name: "Violet",
    bg: "from-purple-900 via-fuchsia-900 to-slate-900 dark:from-black dark:via-purple-950 dark:to-slate-900",
    card: "from-white/30 via-purple-200/20 to-purple-900/20 dark:from-black/40 dark:via-purple-900/30 dark:to-slate-900/40",
    ring: "ring-purple-400/30",
    accent: "text-purple-200",
    button: "from-purple-500 via-fuchsia-500 to-violet-600",
  },
};

const DEFAULT = "blue";

const StaffThemeContext = createContext({
  color: DEFAULT,
  setColor: (c: string) => {},
  colors: COLORS,
});

export function useStaffTheme() {
  return useContext(StaffThemeContext);
}

export function StaffThemeProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<string>(DEFAULT);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("staffThemeColor") : null;
    if (stored && COLORS[stored as keyof typeof COLORS]) setColor(stored);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("staffThemeColor", color);
  }, [color]);

  return (
    <StaffThemeContext.Provider value={{ color, setColor, colors: COLORS }}>
      {children}
    </StaffThemeContext.Provider>
  );
}
