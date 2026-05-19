"use client"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { useLocale } from "@/lib/locale-context"

const GEO_KEY = "milele-geo-asked"

const TEXTS = {
  fr: { title: "Localisation", desc: "Autoriser la géolocalisation pour trouver les services proches de chez vous.", allow: "Autoriser", later: "Plus tard" },
  en: { title: "Location", desc: "Allow location access to find services near you.", allow: "Allow", later: "Later" },
  es: { title: "Ubicación", desc: "Permitir la geolocalización para encontrar servicios cerca de ti.", allow: "Permitir", later: "Más tarde" },
  sw: { title: "Mahali", desc: "Ruhusu eneo ili kupata huduma karibu nawe.", allow: "Ruhusu", later: "Baadaye" },
}

export function GeolocationPrompt() {
  const { lang, settings } = useLocale()
  const { requestGeolocation } = useLocale()
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already asked or coords already available
    if (settings.coords) return
    const asked = localStorage.getItem(GEO_KEY)
    if (asked) return
    // Show after a short delay (after theme modal closes)
    const timer = setTimeout(() => setShow(true), 1500)
    return () => clearTimeout(timer)
  }, [settings.coords])

  if (!show) return null

  const txt = TEXTS[lang]

  const handleAllow = async () => {
    localStorage.setItem(GEO_KEY, "1")
    await requestGeolocation()
    setShow(false)
  }

  const handleLater = () => {
    localStorage.setItem(GEO_KEY, "1")
    setShow(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="rounded-2xl border p-5 w-64 max-w-[calc(100vw-2rem)] animate-in zoom-in-95 fade-in slide-in-from-bottom-2 duration-300"
        style={{
          background: "color-mix(in srgb, var(--card) 85%, transparent)",
          backdropFilter: "blur(20px)",
          borderColor: "color-mix(in srgb, var(--primary) 15%, var(--border))",
          boxShadow: "0 8px 40px oklch(0.10 0.03 150 / 0.18), 0 0 0 1px oklch(0.42 0.10 152 / 0.06)",
          willChange: 'transform, opacity',
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
          >
            <MapPin size={20} style={{ color: "var(--primary)" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {txt.title}
          </p>
          <p className="text-xs text-center leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
            {txt.desc}
          </p>
          <div className="flex gap-2 mt-1 w-full">
            <button
              onClick={handleAllow}
              className="flex-1 py-2 min-h-[44px] rounded-xl text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                boxShadow: "0 2px 12px oklch(0.42 0.10 152 / 0.3)",
              }}
              aria-label={txt.allow}
              tabIndex={0}
            >
              {txt.allow}
            </button>
            <button
              onClick={handleLater}
              className="flex-1 py-2 min-h-[44px] rounded-xl text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              style={{
                color: "var(--muted-foreground)",
                background: "color-mix(in srgb, var(--muted-foreground) 8%, transparent)",
              }}
              aria-label={txt.later}
              tabIndex={0}
            >
              {txt.later}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
