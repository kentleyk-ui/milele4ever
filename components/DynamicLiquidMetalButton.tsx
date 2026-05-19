"use client"

import dynamic from "next/dynamic"

// Fallback CSS-only pour éviter le layout shift pendant le chargement
function LiquidButtonFallback({ width = 160, height = 44 }: { width?: number; height?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 100,
        background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 80%, transparent), var(--primary))",
        opacity: 0.85,
      }}
    />
  )
}

export const LiquidMetalButton = dynamic(
  () => import("./liquid-metal-button").then((m) => m.LiquidMetalButton),
  { ssr: false, loading: () => <LiquidButtonFallback /> },
)
