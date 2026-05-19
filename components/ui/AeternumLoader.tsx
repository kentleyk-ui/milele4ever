export function AeternumLoader() {
  return (
    <div className="flex items-center justify-center">
      <div className="relative w-16 h-16">
        {/* Cercle externe */}
        <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 animate-spin-slow"></div>

        {/* Glow interne */}
        <div className="absolute inset-2 rounded-full bg-blue-500/40 blur-xl animate-pulse-glow"></div>

        {/* Noyau */}
        <div className="absolute inset-4 rounded-full bg-blue-400/80 shadow-[0_0_20px_rgba(0,150,255,0.8)]"></div>
      </div>
    </div>
  );
}
