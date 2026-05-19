export default function EspaceLoading() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      {/* Sidebar skeleton */}
      <div
        className="hidden md:flex flex-col w-56 shrink-0 border-r p-4 gap-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="h-8 w-3/4 rounded-lg animate-pulse" style={{ background: "var(--muted)" }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-9 w-full rounded-lg animate-pulse" style={{ background: "var(--muted)", opacity: 1 - i * 0.1 }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="h-10 w-48 rounded-xl animate-pulse" style={{ background: "var(--muted)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      </div>
    </div>
  )
}
