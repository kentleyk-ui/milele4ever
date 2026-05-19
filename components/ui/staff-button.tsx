import * as React from "react";
import { cn } from "@/lib/utils";

export const StaffButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" }
>(({ className, variant = "primary", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "w-full rounded-full px-6 py-3 font-semibold text-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-200/40 flex items-center justify-center gap-2 shadow-[0_4px_24px_0_rgba(37,99,235,0.08)] border",
      variant === "primary"
        ? "bg-white/60 text-blue-900 border-white/80 hover:bg-white/80 hover:shadow-lg backdrop-blur-xl"
        : "bg-white/30 text-blue-900 border-white/60 hover:bg-white/50 backdrop-blur-xl",
      className
    )}
    {...props}
  />
));

StaffButton.displayName = "StaffButton";
