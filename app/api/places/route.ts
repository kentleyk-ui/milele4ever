import { NextRequest, NextResponse } from "next/server"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

/**
 * Searches for real nearby places using OpenStreetMap Overpass API.
 * Query params: lat, lng, category (funeraires|fleuristes|notaires|animaux|traiteurs|transport), radius (meters, default 10000)
 */

const CATEGORY_TAGS: Record<string, string> = {
  // OSM: shop=funeral_directors est le tag standard pour les pompes funèbres
  funeraires: '["shop"="funeral_directors"]["amenity"="funeral_directors"]',
  fleuristes: '["shop"="florist"]',
  // office=notary est le tag OSM standard pour les notaires
  notaires: '["office"="notary"]["office"="lawyer"]',
  // Vétérinaires et animaleries pour accompagnement des animaux de compagnie
  animaux: '["amenity"="veterinary"]["shop"="pet"]["shop"="pet_food"]',
  // Traiteurs et services de restauration pour repas funèbres
  traiteurs: '["shop"="catering"]["amenity"="restaurant"]["amenity"="cafe"]',
  transport: '["amenity"="taxi"]["amenity"="car_rental"]["amenity"="car_sharing"]',
}

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
]

const CATEGORY_SEARCH_TERMS: Record<string, string> = {
  funeraires: "pompes funebres",
  fleuristes: "fleuriste",
  notaires: "notaire",
  animaux: "veterinaire",
  traiteurs: "traiteur",
  transport: "taxi",
}

// Build Overpass QL for a category
function buildQuery(lat: number, lng: number, category: string, radius: number): string {
  const tags = CATEGORY_TAGS[category]
  if (!tags) return ""

  // Split multiple tag options (separated by "]["  patterns → each is a separate nwr)
  const tagOptions = tags.match(/\["[^"]+?"="[^"]+?"\]/g) || []

  const nwrs = tagOptions
    .map((tag) => `nwr${tag}(around:${radius},${lat},${lng});`)
    .join("\n  ")

  return `[out:json][timeout:10];
(
  ${nwrs}
);
out center 20;`
}

function toPlacesFromOverpass(elements: any[]) {
  return (elements || [])
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (!elLat || !elLng) return null
      return {
        id: String(el.id),
        name: el.tags?.name || el.tags?.["name:fr"] || el.tags?.operator || null,
        lat: elLat,
        lng: elLng,
        address: [el.tags?.["addr:street"], el.tags?.["addr:city"]].filter(Boolean).join(", ") || null,
        phone: el.tags?.phone || el.tags?.["contact:phone"] || null,
        website: el.tags?.website || el.tags?.["contact:website"] || null,
      }
    })
    .filter((p: any) => p && p.name)
    .slice(0, 20)
}

function buildViewBox(lat: number, lng: number, radiusMeters: number) {
  const latDelta = radiusMeters / 111_320
  const lngDelta = radiusMeters / (111_320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.1))
  const left = lng - lngDelta
  const right = lng + lngDelta
  const top = lat + latDelta
  const bottom = lat - latDelta
  return `${left},${top},${right},${bottom}`
}

async function fetchNominatimFallback(lat: number, lng: number, category: string, radius: number) {
  const query = CATEGORY_SEARCH_TERMS[category] ?? category
  const viewbox = buildViewBox(lat, lng, Math.min(radius, 25000))
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("q", query)
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "20")
  url.searchParams.set("addressdetails", "1")
  url.searchParams.set("viewbox", viewbox)
  url.searchParams.set("bounded", "1")

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "Accept-Language": "fr",
      "User-Agent": "milele4ever/1.0 (support@milele4ever.com)",
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!res.ok) {
    throw new Error(`Nominatim error ${res.status}`)
  }

  const data = await res.json() as Array<Record<string, unknown>>
  return (data || [])
    .map((item) => {
      const displayName = String(item.display_name ?? "").trim()
      const name = displayName.split(",")[0] || displayName
      const latValue = Number(item.lat)
      const lngValue = Number(item.lon)
      if (!name || Number.isNaN(latValue) || Number.isNaN(lngValue)) return null

      return {
        id: `${item.osm_type ?? "osm"}-${item.osm_id ?? Math.random()}`,
        name,
        lat: latValue,
        lng: lngValue,
        address: displayName || null,
        phone: null,
        website: null,
      }
    })
    .filter((p): p is { id: string; name: string; lat: number; lng: number; address: string | null; phone: null; website: null } => !!p)
    .slice(0, 20)
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = parseFloat(searchParams.get("lat") || "")
  const lng = parseFloat(searchParams.get("lng") || "")
  const category = searchParams.get("category") || ""
  const radius = parseInt(searchParams.get("radius") || "10000", 10)

  if (isNaN(lat) || isNaN(lng) || !category) {
    void sendTelegramErrorAlert({
      route: "/api/places:GET",
      message: "Missing lat/lng/category",
      statusCode: 400,
    })
    return NextResponse.json({ error: "Missing lat, lng, or category" }, { status: 400 })
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    void sendTelegramErrorAlert({
      route: "/api/places:GET",
      message: "lat/lng hors limites",
      statusCode: 400,
    })
    return NextResponse.json({ error: "lat ou lng hors limites" }, { status: 400 })
  }

  if (!CATEGORY_TAGS[category]) {
    void sendTelegramErrorAlert({
      route: "/api/places:GET",
      message: "Invalid category",
      details: category,
      statusCode: 400,
    })
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  const query = buildQuery(lat, lng, category, Math.min(radius, 50000))

  let overpassError = ""
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: AbortSignal.timeout(12000),
      })

      if (!res.ok) {
        overpassError = `${endpoint} -> ${res.status}`
        continue
      }

      const data = await res.json()
      const places = toPlacesFromOverpass(data.elements || [])
      return NextResponse.json({ places, source: "overpass" })
    } catch (error) {
      overpassError = `${endpoint} -> ${String(error)}`
    }
  }

  try {
    const places = await fetchNominatimFallback(lat, lng, category, radius)
    void sendTelegramErrorAlert({
      route: "/api/places:GET",
      message: "Overpass indisponible, fallback Nominatim actif",
      details: overpassError,
      statusCode: 206,
    })
    return NextResponse.json({ places, source: "nominatim-fallback", degraded: true })
  } catch (fallbackError) {
    void sendTelegramErrorAlert({
      route: "/api/places:GET",
      message: "Overpass + fallback en erreur",
      details: `${overpassError} | fallback=${String(fallbackError)}`,
      statusCode: 502,
    })
    return NextResponse.json({ error: "Service places temporairement indisponible" }, { status: 502 })
  }
}
