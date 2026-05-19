"use client";

import React from "react";
import clsx from "clsx";

export default function LiquidButton({ children, onClick, className }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "relative px-6 py-3 rounded-xl font-semibold transition-all",
        "bg-gradient-to-br from-white/70 to-white/20 backdrop-blur-md",
        "border border-white/40 shadow-[inset_0_0_20px_rgba(255,255,255,0.6)]",
        "hover:scale-[1.03] active:scale-[0.98]",
        "dark:from-white/10 dark:to-white/5 dark:border-white/10",
        className
      )}
    >
      <span className="text-black dark:text-white drop-shadow">{children}</span>
    </button>
  );
}
