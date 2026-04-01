'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Language } from './translations'
import { getTranslation } from './translations'

export type Currency = 'CAD' | 'XAF' | 'EUR' | 'USD'

export const currencyConfig: Record<Currency, { symbol: string; name: string; rate: number }> = {
  CAD: { symbol: 'CAD $', name: 'Dollar canadien', rate: 0.00225 },
  XAF: { symbol: 'FCFA', name: 'Franc CFA', rate: 1 },
  EUR: { symbol: '€', name: 'Euro', rate: 0.00152 },
  USD: { symbol: 'USD $', name: 'US Dollar', rate: 0.00165 },
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

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [currency, setCurrencyState] = useState<Currency>('CAD')

  useEffect(() => {
    // Load language from localStorage on client side
    const stored = localStorage.getItem('language') as Language | null
    if (stored && (stored === 'en' || stored === 'fr' || stored === 'es' || stored === 'sw')) {
      setLanguageState(stored)
    }
    // Load currency from localStorage
    const storedCurrency = localStorage.getItem('currency') as Currency | null
    if (storedCurrency && currencyConfig[storedCurrency]) {
      setCurrencyState(storedCurrency)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr)
    if (typeof window !== 'undefined') {
      localStorage.setItem('currency', curr)
    }
  }

  const t = (key: string, defaultValue?: string) => {
    return getTranslation(language, key, defaultValue)
  }

  const formatPrice = (amountInXAF: number) => {
    const config = currencyConfig[currency]
    const converted = Math.round(amountInXAF * config.rate)
    
    if (currency === 'XAF') {
      return `${converted.toLocaleString('fr-FR')} ${config.symbol}`
    }
    return `${converted.toLocaleString('fr-FR')} ${config.symbol}`
  }

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
    currency,
    setCurrency,
    formatPrice,
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  
  // Return default values if context is not available (SSR or outside provider)
  if (!context) {
    return {
      language: 'fr' as Language,
      setLanguage: () => {},
      t: (key: string, defaultValue?: string) => getTranslation('fr', key, defaultValue),
      currency: 'CAD' as Currency,
      setCurrency: () => {},
      formatPrice: (amountInXAF: number) => `${Math.round(amountInXAF * 0.00225).toLocaleString('fr-FR')} CAD $`,
    }
  }
  
  return context
}
