export default function AionLoading() {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--background)" }}>
      {/* Sidebar skeleton */}
      <div
        className="hidden md:flex flex-col w-60 shrink-0 border-r p-5 gap-3"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="h-8 w-24 rounded-lg animate-pulse mb-2" style={{ background: "var(--muted)" }} />
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-9 w-full rounded-lg animate-pulse" style={{ background: "var(--muted)", opacity: 1 - i * 0.08 }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div className="flex-1 p-6 flex flex-col gap-6">
        <div className="h-10 w-56 rounded-xl animate-pulse" style={{ background: "var(--muted)" }} />
        <div className="h-5 w-80 rounded animate-pulse" style={{ background: "var(--muted)", opacity: 0.6 }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "var(--muted)" }} />
          ))}
        </div>
      </div>
    </div>
  )
}
