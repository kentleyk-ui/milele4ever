import React from "react"

export const STAFF_FOCUS_RING = "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
export const STAFF_INPUT = `rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-400 transition ${STAFF_FOCUS_RING}`
export const STAFF_BUTTON_PRIMARY = `rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] disabled:opacity-60 ${STAFF_FOCUS_RING}`
export const STAFF_BUTTON_GHOST = `rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/15 ${STAFF_FOCUS_RING}`
export const STAFF_BUTTON_DANGER = `rounded-xl bg-gradient-to-r from-rose-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.99] ${STAFF_FOCUS_RING}`

type StaffShellProps = {
  children: React.ReactNode
  maxWidthClass?: string
}

export function StaffShell({ children, maxWidthClass = "max-w-6xl" }: StaffShellProps) {
  return (
    <div className={`w-full ${maxWidthClass} mx-auto flex flex-col gap-6`}>
      {children}
    </div>
  )
}

type StaffPanelProps = {
  children: React.ReactNode
  className?: string
}

export function StaffPanel({ children, className = "" }: StaffPanelProps) {
  return (
    <section
      className={`rounded-2xl border border-white/20 bg-white/10 p-6 shadow-[0_16px_40px_rgba(4,10,24,0.28)] backdrop-blur-xl ${className}`}
    >
      {children}
    </section>
  )
}

type StaffPanelHeaderProps = {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  rightSlot?: React.ReactNode
}

export function StaffPanelHeader({ icon, title, subtitle, rightSlot }: StaffPanelHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sky-200">
              {icon}
            </span>
          ) : null}
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        {subtitle ? <p className="mt-1 text-xs text-gray-400">{subtitle}</p> : null}
      </div>
      {rightSlot}
    </div>
  )
}

type StaffNoticeProps = {
  children: React.ReactNode
  tone?: "info" | "success" | "danger"
  className?: string
}

export function StaffNotice({ children, tone = "info", className = "" }: StaffNoticeProps) {
  const toneClass =
    tone === "danger"
      ? "border-rose-500/35 bg-rose-500/10 text-rose-100"
      : tone === "success"
        ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-100"
        : "border-sky-500/35 bg-sky-500/10 text-sky-100"

  return <div className={`rounded-xl border px-4 py-3 text-sm ${toneClass} ${className}`}>{children}</div>
}

type StaffEmptyStateProps = {
  title: string
  description: string
  actionSlot?: React.ReactNode
}

export function StaffEmptyState({ title, description, actionSlot }: StaffEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-6 py-12 text-center">
      <p className="text-base font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
      {actionSlot ? <div className="mt-5">{actionSlot}</div> : null}
    </div>
  )
}
