'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { getTranslation } from './translations'

export type Language = 'fr' | 'en'

type I18nContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, defaultValue?: string) => string
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr')

  useEffect(() => {
    const stored = localStorage.getItem('aurea-clavis-language') as Language | null
    if (stored && (stored === 'en' || stored === 'fr')) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('aurea-clavis-language', lang)
    }
  }

  const t = (key: string, defaultValue?: string) => {
    return getTranslation(language, key, defaultValue)
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
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
    }
  }
  return context
}
