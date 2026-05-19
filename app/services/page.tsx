"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "@/lib/locale-context"
import { supabase } from "@/lib/supabaseClient"
import { ArrowLeft, Search, MapPin, Phone, Globe, Star, Clock, ExternalLink, LocateFixed } from "lucide-react"

/* ═══════════════════════════════════════════
   Annuaire de services funéraires
   ═══════════════════════════════════════════ */

interface Prestataire {
  nom: string
  categorie: string
  description: string
  ville: string
  telephone?: string
  site?: string
  horaires?: string
  note?: number
}

const CATEGORY_META = [
  { id: "funeraires", emoji: "🏠", labelKey: "services.funeraires" },
  { id: "fleuristes", emoji: "💐", labelKey: "services.fleuristes" },
  { id: "notaires", emoji: "📜", labelKey: "services.notaires" },
  { id: "animaux", emoji: "🐾", labelKey: "services.animaux" },
  { id: "traiteurs", emoji: "☕", labelKey: "services.traiteurs" },
  { id: "transport", emoji: "🚐", labelKey: "services.transport" },
]

/* Données de démonstration — à remplacer par une API */
const DEMO_PRESTATAIRES: Prestataire[] = [
  { nom: "Pompes Funèbres Générales", categorie: "funeraires", description: "Accompagnement complet pour les obsèques, organisation de cérémonies civiles et religieuses.", ville: "Paris", telephone: "+33 1 23 45 67 89", site: "https://example.com", horaires: "24h/24, 7j/7", note: 4.5 },
  { nom: "Maison du Souvenir", categorie: "funeraires", description: "Salon funéraire intimiste, soins de présentation, chambre funéraire.", ville: "Lyon", telephone: "+33 4 56 78 90 12", horaires: "8h-20h", note: 4.8 },
  { nom: "Fleurs & Recueillement", categorie: "fleuristes", description: "Compositions florales de deuil, gerbes, couronnes et bouquets de condoléances.", ville: "Paris", telephone: "+33 1 34 56 78 90", site: "https://example.com", note: 4.6 },
  { nom: "Au Jardin Éternel", categorie: "fleuristes", description: "Fleurs de saison pour cérémonies, livraison au domicile et au lieu de cérémonie.", ville: "Marseille", note: 4.3 },
  { nom: "Me Dupont — Notaire", categorie: "notaires", description: "Succession, testament, donation. Accompagnement juridique après décès.", ville: "Paris", telephone: "+33 1 45 67 89 01", horaires: "9h-18h du lundi au vendredi", note: 4.7 },
  { nom: "Étude Martin & Associés", categorie: "notaires", description: "Règlement de successions, actes notariés, conseil patrimonial.", ville: "Bordeaux", telephone: "+33 5 67 89 01 23", note: 4.4 },
  { nom: "Au Paradis des Animaux", categorie: "animaux", description: "Crémation et inhumation pour animaux de compagnie, urnes personnalisées.", ville: "Nantes", telephone: "+33 2 34 56 78 90", note: 4.9 },
  { nom: "Traiteur de l'Hommage", categorie: "traiteurs", description: "Buffets et collations pour cérémonies de recueillement et réceptions funéraires.", ville: "Paris", telephone: "+33 1 56 78 90 12", note: 4.5 },
  { nom: "Saveurs & Mémoire", categorie: "traiteurs", description: "Repas de funérailles, cocktails dinatoires, options végétariennes et halal.", ville: "Toulouse", note: 4.2 },
  { nom: "Transports Funéraires Express", categorie: "transport", description: "Transport du défunt, rapatriement national et international.", ville: "Paris", telephone: "+33 1 67 89 01 23", horaires: "24h/24", note: 4.6 },
  { nom: "Convoy Dignité", categorie: "transport", description: "Véhicules funéraires, organisation de convois, rapatriement.", ville: "Lille", telephone: "+33 3 78 90 12 34", note: 4.3 },
]

export default function ServicesPage() {
  return (
    <Suspense>
      <ServicesContent />
    </Suspense>
  )
}

interface PlaceResult {
  id: string
  name: string
  address?: string
  phone?: string
  website?: string
}

function ServicesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { settings, t, requestGeolocation } = useLocale()
  const [selectedCat, setSelectedCat] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [realPlaces, setRealPlaces] = useState<PlaceResult[]>([])
  const [placesSource, setPlacesSource] = useState<"overpass" | "nominatim-fallback" | "mixed" | null>(null)
  const [degradedSource, setDegradedSource] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [locating, setLocating] = useState(false)
  const categories = CATEGORY_META.map((cat) => ({ ...cat, label: t(cat.labelKey) }))

  const handleUseMyPosition = async () => {
    setLocating(true)
    await requestGeolocation()
    setLocating(false)
  }

  // Pré-sélectionner la catégorie depuis l'URL
  useEffect(() => {
    const cat = searchParams.get("cat")
    if (cat && CATEGORY_META.some(c => c.id === cat)) {
      setSelectedCat(cat)
    }
  }, [searchParams])

  // Fetch des lieux réels: une catégorie ciblée ou toutes les catégories en mode "Tous".
  useEffect(() => {
    if (!settings.coords) return

    setLoading(true)
    setHasSearched(true)

    const categoriesToLoad = selectedCat ? [selectedCat] : categories.map((cat) => cat.id)

    Promise.all(
      categoriesToLoad.map((catId) =>
        fetch(`/api/places?lat=${settings.coords?.lat}&lng=${settings.coords?.lng}&category=${catId}&radius=15000`)
          .then((res) => res.json())
          .then((data) => ({
            places: (data.places || []) as PlaceResult[],
            source: data.source === "nominatim-fallback" ? "nominatim-fallback" : "overpass",
            degraded: Boolean(data.degraded),
          }))
          .catch(() => ({
            places: [] as PlaceResult[],
            source: null as "overpass" | "nominatim-fallback" | null,
            degraded: false,
          }))
      )
    )
      .then((results) => {
        const unique = new Map<string, PlaceResult>()
        for (const result of results) {
          for (const place of result.places) {
            const key = `${place.id}-${(place.name || "").toLowerCase()}-${(place.address || "").toLowerCase()}`
            if (!unique.has(key)) unique.set(key, place)
          }
        }

        const sources = new Set(results.map((r) => r.source).filter(Boolean))
        setRealPlaces(Array.from(unique.values()))
        setDegradedSource(results.some((r) => r.degraded))

        if (sources.size === 0) {
          setPlacesSource(null)
        } else if (sources.size === 1) {
          setPlacesSource(Array.from(sources)[0] as "overpass" | "nominatim-fallback")
        } else {
          setPlacesSource("mixed")
        }
      })
      .finally(() => setLoading(false))
  }, [selectedCat, settings.coords, categories])

  // Filter demo data only when no real places
  const filtered = (!hasSearched || realPlaces.length === 0)
    ? DEMO_PRESTATAIRES.filter(p => {
        const matchCat = !selectedCat || p.categorie === selectedCat
        const matchSearch = !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.ville.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
      })
    : []

  const isAnimaux = selectedCat === "animaux"

  return (
    <div className="min-h-screen relative" style={{ background: "var(--background)" }}>
      {/* Background Sultan pour animaux */}
      {isAnimaux && (
        <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700"
            style={{
              backgroundImage: "url('/sultan.png')",
              opacity: 0.13,
              filter: "grayscale(0.2) blur(1px)",
            }}
          />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, var(--background) 80%)" }} />
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 px-4 sm:px-6 py-4 flex items-center gap-4"
        style={{ background: isAnimaux ? "color-mix(in srgb, var(--background) 60%, transparent)" : "color-mix(in srgb, var(--background) 75%, transparent)", backdropFilter: "blur(20px) saturate(1.4)", WebkitBackdropFilter: "blur(20px) saturate(1.4)", borderBottom: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))" }}>
        <button
          onClick={async () => {
            const { data } = await supabase.auth.getSession()
            router.push(data.session?.user ? "/espace/profil" : "/")
          }}
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: "var(--primary)" }}
        >
          <ArrowLeft size={16} /> Retour
        </button>
        <h1 className="text-base font-semibold" style={{ color: "var(--foreground)" }}>{t("services.directory")}</h1>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Info locale */}
        <div className="flex items-center justify-between gap-3 text-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
          <div className="flex items-center gap-2 min-w-0">
            <MapPin size={12} />
            <span>{t("services.resultsFor")} {settings.country} · {settings.currency}</span>
          </div>
          <button
            onClick={() => void handleUseMyPosition()}
            disabled={locating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60"
            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <LocateFixed size={12} />
            {locating ? t("services.activating") : t("services.useMyPosition")}
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t("services.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none"
            style={{
              background: isAnimaux ? "color-mix(in srgb, var(--card) 50%, transparent)" : "var(--card)",
              border: isAnimaux ? "1px solid color-mix(in srgb, var(--primary) 15%, color-mix(in srgb, white 8%, transparent))" : "1px solid var(--border)",
              color: "var(--foreground)",
              backdropFilter: isAnimaux ? "blur(16px) saturate(1.4)" : undefined,
              WebkitBackdropFilter: isAnimaux ? "blur(16px) saturate(1.4)" : undefined,
            }}
          />
        </div>

        {/* Catégories */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCat(null)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: !selectedCat ? "var(--primary)" : "var(--card)",
              color: !selectedCat ? "var(--primary-foreground)" : "var(--muted-foreground)",
              border: "1px solid var(--border)",
            }}
          >
            {t("services.all")}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: selectedCat === cat.id ? "var(--primary)" : "var(--card)",
                color: selectedCat === cat.id ? "var(--primary-foreground)" : "var(--muted-foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Activation géolocalisation */}
        {!settings.coords && selectedCat && !loading && (
          <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "color-mix(in srgb, #F59E0B 10%, var(--card))", border: "1px solid color-mix(in srgb, #F59E0B 30%, transparent)" }}>
            <MapPin size={15} style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{t("services.geoDisabledTitle")}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{t("services.geoDisabledDesc")}</p>
              <button
                onClick={() => void handleUseMyPosition()}
                disabled={locating}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold disabled:opacity-60"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                <LocateFixed size={12} />
                {locating ? t("services.activating") : t("services.useMyPosition")}
              </button>
            </div>
          </div>
        )}

        {/* Résultats réels depuis géolocalisation */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            <p className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>{t("services.searching")}</p>
          </div>
        )}

        {!loading && realPlaces.length > 0 && (
          <div className="flex flex-col gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                📍 {realPlaces.length} {t("services.nearbyResults")}
              </p>
              {placesSource && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: degradedSource
                      ? "color-mix(in srgb, #F59E0B 15%, var(--card))"
                      : "color-mix(in srgb, #16A34A 15%, var(--card))",
                    color: degradedSource ? "#F59E0B" : "#16A34A",
                    border: degradedSource
                      ? "1px solid color-mix(in srgb, #F59E0B 25%, transparent)"
                      : "1px solid color-mix(in srgb, #16A34A 25%, transparent)",
                  }}
                >
                  {placesSource === "overpass"
                    ? t("services.source.overpass")
                    : placesSource === "nominatim-fallback"
                    ? t("services.source.fallback")
                    : t("services.source.mixed")}
                </span>
              )}
            </div>
            {realPlaces.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())).map((p) => (
              <div
                key={p.id}
                className="rounded-2xl p-5 transition-all hover:scale-[1.005]"
                style={{
                  background: isAnimaux
                    ? "color-mix(in srgb, var(--card) 45%, transparent)"
                    : "color-mix(in srgb, var(--card) 80%, transparent)",
                  backdropFilter: isAnimaux ? "blur(18px) saturate(1.6)" : "blur(12px)",
                  WebkitBackdropFilter: isAnimaux ? "blur(18px) saturate(1.6)" : "blur(12px)",
                  border: isAnimaux
                    ? "1px solid color-mix(in srgb, var(--primary) 18%, color-mix(in srgb, white 10%, transparent))"
                    : "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))",
                  boxShadow: isAnimaux ? "0 8px 32px color-mix(in srgb, var(--primary) 6%, transparent)" : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.name}</h3>
                    {p.address && <p className="text-xs mt-1 flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}><MapPin size={10} /> {p.address}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    {p.phone && (
                      <a href={`tel:${p.phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02]"
                        style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                        <Phone size={11} /> {t("services.call")}
                      </a>
                    )}
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02]"
                        style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                        <Globe size={11} /> {t("services.website")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Résultats démo (fallback) */}
        {(!hasSearched || realPlaces.length === 0) && (
          <div className="flex flex-col gap-3">
            {filtered.length > 0 && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{ background: "color-mix(in srgb, #F59E0B 15%, var(--card))", color: "#F59E0B", border: "1px solid color-mix(in srgb, #F59E0B 25%, transparent)" }}>
                  {t("services.examples")}
                </span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{t("services.enablePositionForReal")}</span>
              </div>
            )}
          {filtered.length === 0 && hasSearched && realPlaces.length === 0 && (
            <div className="text-center py-16">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{t("services.noneFound")}</p>
            </div>
          )}
          {filtered.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 transition-all hover:scale-[1.005]"
              style={{
                background: isAnimaux
                  ? "color-mix(in srgb, var(--card) 45%, transparent)"
                  : "color-mix(in srgb, var(--card) 80%, transparent)",
                backdropFilter: isAnimaux ? "blur(18px) saturate(1.6)" : "blur(12px)",
                WebkitBackdropFilter: isAnimaux ? "blur(18px) saturate(1.6)" : "blur(12px)",
                border: isAnimaux
                  ? "1px solid color-mix(in srgb, var(--primary) 18%, color-mix(in srgb, white 10%, transparent))"
                  : "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))",
                boxShadow: isAnimaux ? "0 8px 32px color-mix(in srgb, var(--primary) 6%, transparent)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{categories.find(c => c.id === p.categorie)?.emoji}</span>
                    <h3 className="text-sm font-semibold truncate" style={{ color: "var(--foreground)" }}>{p.nom}</h3>
                  </div>
                  <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--muted-foreground)" }}>{p.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    <span className="flex items-center gap-1"><MapPin size={10} /> {p.ville}</span>
                    {p.horaires && <span className="flex items-center gap-1"><Clock size={10} /> {p.horaires}</span>}
                    {p.note && (
                      <span className="flex items-center gap-1" style={{ color: "var(--primary)" }}>
                        <Star size={10} fill="currentColor" /> {p.note}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {p.telephone && (
                    <a href={`tel:${p.telephone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02]"
                      style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                      <Phone size={11} /> {t("services.call")}
                    </a>
                  )}
                  {p.site && (
                    <a href={p.site} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02]"
                      style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                      <ExternalLink size={11} /> {t("services.website")}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Note */}
        <div className="mt-12 text-center">
          <p className="text-xs" style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>
            {settings.coords
              ? t("services.noteWithGeo")
              : t("services.noteNoGeo")}
          </p>
        </div>
      </div>
    </div>
  )
}
