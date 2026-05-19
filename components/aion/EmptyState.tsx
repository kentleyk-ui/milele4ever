"use client"

import { Plus } from "lucide-react"

interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
        style={{ background: "var(--secondary)" }}
      >
        {icon}
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--foreground)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-95 touch-manipulation"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
            minHeight: 44,
          }}
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
