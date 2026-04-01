'use client'

import { useI18n } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'
import type { Language } from '@/lib/i18n/translations'
import { languageNames } from '@/lib/i18n/translations'

const languages: { code: Language; flag: string }[] = [
  { code: 'fr', flag: '🇫🇷' },
  { code: 'en', flag: '🇬🇧' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'sw', flag: '🇰🇪' },
]

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  const currentLanguage = languages.find(l => l.code === language) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[100px] gap-2"
        >
          <Globe className="w-4 h-4" />
          <span>{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{languageNames[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{languageNames[lang.code]}</span>
            </span>
            {language === lang.code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
