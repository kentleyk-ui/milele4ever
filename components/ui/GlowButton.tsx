"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";

export function GlowButton({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: unknown }) {
  const pathname = usePathname();
  const isStaffContext = pathname?.startsWith("/staff") || pathname?.startsWith("/admin");
  const hoverShadow = isStaffContext
    ? "0 0 24px #3b82f6, 0 0 8px #fff"
    : "0 0 24px #16a34a, 0 0 8px #fff";
  const gradient = isStaffContext
    ? "bg-gradient-to-br from-blue-500 to-blue-700 border-blue-400/40 focus:ring-blue-400"
    : "bg-gradient-to-br from-green-500 to-emerald-700 border-emerald-400/40 focus:ring-emerald-400";
  const glowStart = isStaffContext ? "0 0 16px 4px #3b82f6, 0 0 4px #fff" : "0 0 16px 4px #16a34a, 0 0 4px #fff";
  const glowEnd = isStaffContext ? "0 0 40px 16px #60a5fa, 0 0 16px #fff" : "0 0 40px 16px #34d399, 0 0 16px #fff";

  return (
    <motion.button
      whileHover={{ scale: 1.04, boxShadow: hoverShadow }}
      whileTap={{ scale: 0.97 }}
      className={`relative w-full max-w-full overflow-hidden px-4 sm:px-6 py-3 rounded-xl font-semibold text-white shadow-lg border focus:outline-none focus:ring-2 transition-all duration-200 ${gradient} ${className}`}
      {...props}
    >
      <span className="absolute inset-0 pointer-events-none z-0 animate-glow" />
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <style jsx>{`
        .animate-glow {
          box-shadow: ${glowStart};
          opacity: 0.5;
          border-radius: 1rem;
          animation: glow 2s infinite alternate;
        }
        @keyframes glow {
          0% { opacity: 0.5; box-shadow: ${glowStart}; }
          100% { opacity: 1; box-shadow: ${glowEnd}; }
        }
      `}</style>
    </motion.button>
  );
}
