export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "var(--background)" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 rounded-full border-2 animate-spin"
          style={{
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
            borderTopColor: "var(--primary)",
          }}
        />
        <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          Chargement…
        </span>
      </div>
    </div>
  )
}
