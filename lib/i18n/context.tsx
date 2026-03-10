'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Language } from './translations'
import { getTranslation } from './translations'

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultValue?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Load language from localStorage on client side
    const stored = localStorage.getItem('language') as Language | null
    if (stored && (stored === 'en' || stored === 'fr')) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang)
    }
  }

  const t = (key: string, defaultValue?: string) => {
    return getTranslation(language, key, defaultValue)
  }

  const value: I18nContextType = {
    language,
    setLanguage,
    t,
  }

  // Always provide the context, even during SSR
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
    }
  }
  
  return context
}
