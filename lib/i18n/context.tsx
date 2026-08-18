'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getTranslation } from './translations'

export type Language = 'fr' | 'en'
export type Currency = 'XAF' | 'EUR' | 'USD' | 'CAD'

// Taux approximatifs par rapport au XAF (devise de base des prix dans l'app).
// L'EUR est fixe (parité officielle XAF/EUR = 655.957) ; USD/CAD sont des
// approximations à ajuster périodiquement selon le taux de change réel.
export const currencyConfig: Record<Currency, { symbol: string; name: string; rateFromXAF: number }> = {
  XAF: { symbol: 'FCFA', name: 'Franc CFA', rateFromXAF: 1 },
  EUR: { symbol: '€', name: 'Euro', rateFromXAF: 1 / 655.957 },
  USD: { symbol: '$', name: 'Dollar US', rateFromXAF: 1 / 610 },
  CAD: { symbol: 'CAD$', name: 'Dollar canadien', rateFromXAF: 1 / 445 },
}

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultValue?: string) => string
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatPrice: (amountInXAF: number) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

function formatPriceFor(currency: Currency, amountInXAF: number): string {
  const { symbol, rateFromXAF } = currencyConfig[currency]
  const converted = amountInXAF * rateFromXAF
  const rounded = currency === 'XAF' ? Math.round(converted) : Math.round(converted * 100) / 100
  const formatted = rounded.toLocaleString(currency === 'XAF' ? 'fr-FR' : undefined, {
    minimumFractionDigits: currency === 'XAF' ? 0 : 2,
    maximumFractionDigits: currency === 'XAF' ? 0 : 2,
  })
  return currency === 'XAF' ? `${formatted} ${symbol}` : `${symbol}${formatted}`
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [currency, setCurrencyState] = useState<Currency>('XAF')

  useEffect(() => {
    const storedLang = localStorage.getItem('aurea-clavis-language') as Language | null
    if (storedLang && (storedLang === 'en' || storedLang === 'fr')) {
      setLanguageState(storedLang)
    }
    const storedCurrency = localStorage.getItem('aurea-clavis-currency') as Currency | null
    if (storedCurrency && storedCurrency in currencyConfig) {
      setCurrencyState(storedCurrency)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurea-clavis-language', lang)
    }
  }

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr)
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurea-clavis-currency', curr)
    }
  }

  const t = (key: string, defaultValue?: string) => {
    return getTranslation(language, key, defaultValue)
  }

  const formatPrice = (amountInXAF: number) => formatPriceFor(currency, amountInXAF)

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, currency, setCurrency, formatPrice }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    return {
      language: 'fr' as Language,
      setLanguage: () => {},
      t: (key: string, defaultValue?: string) => getTranslation('fr', key, defaultValue),
      currency: 'XAF' as Currency,
      setCurrency: () => {},
      formatPrice: (amountInXAF: number) => formatPriceFor('XAF', amountInXAF),
    }
  }
  return context
}
