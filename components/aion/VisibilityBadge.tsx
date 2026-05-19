"use client"

import { Eye, EyeOff, Users, Globe } from "lucide-react"
import type { VisibilityLevel } from "@/types/aion"

const CONFIG: Record<VisibilityLevel, { label: string; icon: React.ElementType; className: string }> = {
  intime: {
    label: "Intime",
    icon: EyeOff,
    className: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  famille: {
    label: "Famille",
    icon: Eye,
    className: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  amis: {
    label: "Amis",
    icon: Users,
    className: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  public: {
    label: "Public",
    icon: Globe,
    className: "bg-green-500/20 text-green-300 border-green-500/30",
  },
}

interface VisibilityBadgeProps {
  level: VisibilityLevel
  size?: "sm" | "md"
}

export default function VisibilityBadge({ level, size = "sm" }: VisibilityBadgeProps) {
  const cfg = CONFIG[level]
  const Icon = cfg.icon
  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5"
  const iconSize = size === "sm" ? 11 : 13

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${cfg.className} ${sizeClass}`}
    >
      <Icon size={iconSize} />
      {cfg.label}
    </span>
  )
}
