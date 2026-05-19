export default function StaffLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="flex flex-col items-center gap-5">
        <div
          className="h-12 w-12 rounded-full border-2 animate-spin"
          style={{
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
            borderTopColor: "var(--primary)",
          }}
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold tracking-wide" style={{ color: "var(--foreground)" }}>
            Portail staff
          </span>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            Vérification des accès…
          </span>
        </div>
      </div>
    </div>
  )
}
