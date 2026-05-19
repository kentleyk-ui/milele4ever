export function GeometricLogo() {
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 p-2 sm:p-2.5 md:p-3 border-2 border-white/30 rounded-xl sm:rounded-2xl">
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Top row */}
        <circle cx="16.67" cy="16.67" r="13" stroke="white" strokeWidth="2.5" />
        <circle cx="50" cy="16.67" r="13" stroke="white" strokeWidth="2.5" />
        <circle cx="83.33" cy="16.67" r="13" stroke="white" strokeWidth="2.5" />

        {/* Middle row */}
        <circle cx="16.67" cy="50" r="13" stroke="white" strokeWidth="2.5" />
        <circle cx="50" cy="50" r="13" stroke="white" strokeWidth="2.5" />
        <circle cx="83.33" cy="50" r="13" stroke="white" strokeWidth="2.5" />

        {/* Bottom row */}
        <circle cx="16.67" cy="83.33" r="13" stroke="white" strokeWidth="2.5" />
        <circle cx="50" cy="83.33" r="13" stroke="white" strokeWidth="2.5" />
        <circle cx="83.33" cy="83.33" r="13" stroke="white" strokeWidth="2.5" />
      </svg>
    </div>
  )
}
