"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react"
import { getTranslation, resolveLang, type Lang } from "./translations"

/* ═══════════════════════════════════════════════════════════════
   Locale Context — Détection automatique des paramètres système
   Langue, pays, devise, fuseau horaire, format date/nombre
   ═══════════════════════════════════════════════════════════════ */

export interface LocaleSettings {
  /* Détecté automatiquement */
  language: string        // "fr", "en", "es", "ar", etc.
  country: string         // "FR", "BE", "CA", "US", "MA", etc.
  locale: string          // "fr-FR", "en-US", etc.
  timezone: string        // "Europe/Paris", "America/New_York", etc.
  currency: string        // "EUR", "USD", "MAD", "XOF", etc.
  currencySymbol: string  // "€", "$", "د.م.", "CFA", etc.
  dateFormat: string      // "dd/MM/yyyy", "MM/dd/yyyy", etc.
  isRTL: boolean          // true pour arabe, hébreu, etc.
  /* Géolocalisation (optionnelle) */
  coords?: { lat: number; lng: number }
}

/* ── Mapping pays → devise ── */
const COUNTRY_CURRENCY: Record<string, { code: string; symbol: string }> = {
  FR: { code: "EUR", symbol: "€" },
  BE: { code: "EUR", symbol: "€" },
  LU: { code: "EUR", symbol: "€" },
  DE: { code: "EUR", symbol: "€" },
  IT: { code: "EUR", symbol: "€" },
  ES: { code: "EUR", symbol: "€" },
  PT: { code: "EUR", symbol: "€" },
  NL: { code: "EUR", symbol: "€" },
  AT: { code: "EUR", symbol: "€" },
  IE: { code: "EUR", symbol: "€" },
  FI: { code: "EUR", symbol: "€" },
  GR: { code: "EUR", symbol: "€" },
  CH: { code: "CHF", symbol: "CHF" },
  CA: { code: "CAD", symbol: "$CA" },
  US: { code: "USD", symbol: "$" },
  GB: { code: "GBP", symbol: "£" },
  MA: { code: "MAD", symbol: "د.م." },
  TN: { code: "TND", symbol: "د.ت" },
  DZ: { code: "DZD", symbol: "د.ج" },
  SN: { code: "XOF", symbol: "CFA" },
  CI: { code: "XOF", symbol: "CFA" },
  CM: { code: "XAF", symbol: "FCFA" },
  CD: { code: "CDF", symbol: "FC" },
  MG: { code: "MGA", symbol: "Ar" },
  JP: { code: "JPY", symbol: "¥" },
  CN: { code: "CNY", symbol: "¥" },
  IN: { code: "INR", symbol: "₹" },
  BR: { code: "BRL", symbol: "R$" },
  MX: { code: "MXN", symbol: "$MX" },
  AE: { code: "AED", symbol: "د.إ" },
  SA: { code: "SAR", symbol: "ر.س" },
  KE: { code: "KES", symbol: "KSh" },
  TZ: { code: "TZS", symbol: "TSh" },
  NG: { code: "NGN", symbol: "₦" },
  ZA: { code: "ZAR", symbol: "R" },
  EG: { code: "EGP", symbol: "ج.م" },
}

/* ── Langues RTL ── */
const RTL_LANGUAGES = ["ar", "he", "fa", "ur"]

/* ── Format date par pays ── */
const DATE_FORMAT_BY_COUNTRY: Record<string, string> = {
  US: "MM/dd/yyyy",
  CA: "yyyy-MM-dd",
  JP: "yyyy/MM/dd",
  CN: "yyyy-MM-dd",
  KR: "yyyy.MM.dd",
}

/* ── Timezone → pays (fallback) ── */
function countryFromTimezone(tz: string): string | null {
  const map: Record<string, string> = {
    "Europe/Paris": "FR",
    "Europe/Brussels": "BE",
    "Europe/Zurich": "CH",
    "Europe/London": "GB",
    "Europe/Berlin": "DE",
    "Europe/Madrid": "ES",
    "Europe/Rome": "IT",
    "Europe/Amsterdam": "NL",
    "Europe/Lisbon": "PT",
    "America/New_York": "US",
    "America/Chicago": "US",
    "America/Los_Angeles": "US",
    "America/Toronto": "CA",
    "America/Montreal": "CA",
    "America/Mexico_City": "MX",
    "America/Sao_Paulo": "BR",
    "Africa/Casablanca": "MA",
    "Africa/Tunis": "TN",
    "Africa/Algiers": "DZ",
    "Africa/Dakar": "SN",
    "Africa/Abidjan": "CI",
    "Africa/Douala": "CM",
    "Africa/Kinshasa": "CD",
    "Africa/Nairobi": "KE",
    "Africa/Dar_es_Salaam": "TZ",
    "Africa/Lagos": "NG",
    "Africa/Johannesburg": "ZA",
    "Africa/Cairo": "EG",
    "Asia/Tokyo": "JP",
    "Asia/Shanghai": "CN",
    "Asia/Kolkata": "IN",
    "Asia/Dubai": "AE",
    "Asia/Riyadh": "SA",
  }
  return map[tz] || null
}

/* ═══ Détection automatique ═══ */
function detectLocale(): LocaleSettings {
  // Valeurs SSR-safe pour éviter le hydration mismatch
  // La vraie détection navigateur se fait dans le useEffect ci-dessous
  return {
    language: "fr",
    country: "FR",
    locale: "fr-FR",
    timezone: "Europe/Paris",
    currency: "EUR",
    currencySymbol: "€",
    dateFormat: "dd/MM/yyyy",
    isRTL: false,
  }
}

/* ═══ Context ═══ */
interface LocaleContextType {
  settings: LocaleSettings
  lang: Lang
  t: (key: string) => string
  updateSettings: (partial: Partial<LocaleSettings>) => void
  formatCurrency: (amount: number) => string
  formatDate: (date: Date | string) => string
  requestGeolocation: () => Promise<void>
}

const LocaleContext = createContext<LocaleContextType | null>(null)

const LOCALE_STORAGE_KEY = "milele-locale"

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LocaleSettings>(detectLocale)

  // Rehydration depuis localStorage après montage (évite hydration mismatch SSR/CSR)
  useEffect(() => {
    try {
      // Toujours détecter la langue depuis le navigateur (ne jamais utiliser le cache pour la langue)
      const browserLocale = navigator.language || "fr-FR"
      const langCode = browserLocale.split("-")[0].toLowerCase()
      const countryFromBrowser = browserLocale.includes("-")
        ? browserLocale.split("-")[1].toUpperCase()
        : null
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

      const saved = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Restaurer les préférences sauvegardées MAIS toujours écraser la langue avec celle du navigateur
        setSettings(prev => ({
          ...prev,
          ...parsed,
          language: langCode,
          locale: browserLocale,
          isRTL: RTL_LANGUAGES.includes(langCode),
        }))
        return
      }
      // Première visite — détection réelle depuis le navigateur
      const countryCode = countryFromBrowser || countryFromTimezone(tz) || "FR"
      const currencyInfo = COUNTRY_CURRENCY[countryCode] || { code: "EUR", symbol: "€" }
      const dateFormat = DATE_FORMAT_BY_COUNTRY[countryCode] || "dd/MM/yyyy"
      setSettings({
        language: langCode,
        country: countryCode,
        locale: browserLocale,
        timezone: tz,
        currency: currencyInfo.code,
        currencySymbol: currencyInfo.symbol,
        dateFormat,
        isRTL: RTL_LANGUAGES.includes(langCode),
      })
    } catch { /* ignore */ }
  }, [])

  // Sauvegarder
  useEffect(() => {
    localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  const updateSettings = useCallback((partial: Partial<LocaleSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial }
      // Si on change le pays, mettre à jour la devise
      if (partial.country && !partial.currency) {
        const currencyInfo = COUNTRY_CURRENCY[partial.country]
        if (currencyInfo) {
          next.currency = currencyInfo.code
          next.currencySymbol = currencyInfo.symbol
        }
      }
      return next
    })
  }, [])

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat(settings.locale, {
        style: "currency",
        currency: settings.currency,
      }).format(amount)
    } catch {
      return `${amount} ${settings.currencySymbol}`
    }
  }, [settings.locale, settings.currency, settings.currencySymbol])

  const formatDate = useCallback((date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date
    try {
      return new Intl.DateTimeFormat(settings.locale, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(d)
    } catch {
      return d.toLocaleDateString()
    }
  }, [settings.locale])

  const lang = useMemo(() => resolveLang(settings.language), [settings.language])

  const t = useCallback((key: string) => getTranslation(lang, key), [lang])

  const requestGeolocation = useCallback(async () => {
    if (!navigator.geolocation) return
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSettings(prev => ({
            ...prev,
            coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          }))
          resolve()
        },
        () => resolve(),
        { timeout: 10000, enableHighAccuracy: false, maximumAge: 60000 }
      )
    })
  }, [])

  return (
    <LocaleContext.Provider value={{ settings, lang, t, updateSettings, formatCurrency, formatDate, requestGeolocation }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider")
  return ctx
}
