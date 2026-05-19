"use client";

import { motion } from "framer-motion";

type ShaderButtonProps = Omit<React.ComponentProps<"button">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart">

export function ShaderButton({ children, ...props }: ShaderButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className="liquid-btn animate-liquid-3d px-6 py-3 rounded-xl font-semibold min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={typeof children === 'string' ? children : undefined}
      tabIndex={0}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

export default ShaderButton;
