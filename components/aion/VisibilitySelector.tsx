"use client"

import { EyeOff, Eye, Users, Globe } from "lucide-react"
import type { VisibilityLevel } from "@/types/aion"

const OPTIONS: { level: VisibilityLevel; label: string; desc: string; icon: React.ElementType }[] = [
  { level: "intime", label: "Intime", desc: "Moi uniquement", icon: EyeOff },
  { level: "famille", label: "Famille", desc: "Mon cercle familial", icon: Eye },
  { level: "amis", label: "Amis", desc: "Famille et amis proches", icon: Users },
  { level: "public", label: "Public", desc: "Visible par tous", icon: Globe },
]

const COLORS: Record<VisibilityLevel, string> = {
  intime: "#8B5CF6",
  famille: "#F59E0B",
  amis: "#3B82F6",
  public: "#10B981",
}

interface VisibilitySelectorProps {
  value: VisibilityLevel
  onChange: (level: VisibilityLevel) => void
}

export default function VisibilitySelector({ value, onChange }: VisibilitySelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        const isSelected = value === opt.level
        const color = COLORS[opt.level]
        return (
          <button
            key={opt.level}
            type="button"
            onClick={() => onChange(opt.level)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all active:scale-95 touch-manipulation"
            style={{
              border: `2px solid ${isSelected ? color : "var(--border)"}`,
              background: isSelected
                ? `color-mix(in srgb, ${color} 12%, var(--card))`
                : "var(--card)",
              minHeight: 72,
            }}
          >
            <Icon
              size={16}
              style={{ color: isSelected ? color : "var(--muted-foreground)" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: isSelected ? color : "var(--foreground)" }}
            >
              {opt.label}
            </span>
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
              {opt.desc}
            </span>
          </button>
        )
      })}
    </div>
  )
}
