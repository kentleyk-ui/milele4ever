'use client'

import { useEffect, useState, useCallback } from 'react'
import { Command } from 'cmdk'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Search,
  ClipboardCheck,
  Shield,
  ScrollText,
  FileSignature,
  Handshake,
  ScrollText as LOIIcon,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useI18n } from '@/lib/i18n/context'

type Action = {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  run: () => void
  keywords?: string[]
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const { t } = useI18n()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((v) => !v)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const go = useCallback(
    (href: string) => {
      router.push(href)
      setOpen(false)
    },
    [router]
  )

  const navigation: Action[] = [
    { id: 'nav-dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, run: () => go('/legal'), keywords: ['home', 'accueil'] },
    { id: 'nav-contracts', label: t('nav.contracts'), icon: FileText, run: () => go('/legal/contracts') },
    { id: 'nav-review', label: t('nav.review'), icon: Search, run: () => go('/legal/review') },
    { id: 'nav-dd', label: t('nav.dueDiligence'), icon: ClipboardCheck, run: () => go('/legal/due-diligence') },
    { id: 'nav-privacy', label: t('nav.privacy'), icon: Shield, run: () => go('/legal/privacy') },
    { id: 'nav-terms', label: t('nav.terms'), icon: ScrollText, run: () => go('/legal/terms') },
  ]

  const documents: Action[] = [
    { id: 'doc-nda', label: t('type.mutualNda'), icon: Handshake, run: () => go('/legal/contracts?type=mutualNda') },
    { id: 'doc-service', label: t('type.serviceAgreement'), icon: FileSignature, run: () => go('/legal/contracts?type=serviceAgreement') },
    { id: 'doc-loi', label: t('type.letterOfIntent', 'Lettre d\'intention'), icon: LOIIcon, run: () => go('/legal/contracts?type=letterOfIntent') },
  ]

  const commands: Action[] = [
    {
      id: 'toggle-theme',
      label: resolvedTheme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      run: () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
        setOpen(false)
      },
    },
  ]

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command palette"
      className="fixed left-1/2 top-[18%] z-[100] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-2xl glass shadow-2xl"
      shouldFilter
    >
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <Sparkles className="h-4 w-4 shrink-0 text-primary" />
        <Command.Input
          placeholder="Rechercher une page, un document, une action..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:block">
          ESC
        </kbd>
      </div>
      <Command.List className="max-h-[60vh] overflow-y-auto p-2">
        <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
          Aucun résultat.
        </Command.Empty>

        <Command.Group heading="Navigation" className="px-2 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5">
          {navigation.map((item) => (
            <Command.Item
              key={item.id}
              value={`${item.label} ${item.keywords?.join(' ') ?? ''}`}
              onSelect={item.run}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Nouveau document" className="px-2 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5">
          {documents.map((item) => (
            <Command.Item
              key={item.id}
              value={item.label}
              onSelect={item.run}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>

        <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:pb-1.5">
          {commands.map((item) => (
            <Command.Item
              key={item.id}
              value={item.label}
              onSelect={item.run}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground aria-selected:bg-primary/10 aria-selected:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

/** Petit bouton "⌘K" à placer dans la nav pour indiquer que le raccourci existe. */
export function CommandPaletteHint() {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
  return (
    <kbd className="hidden items-center gap-1 rounded-md border border-border/70 bg-muted/50 px-2 py-1 text-[11px] font-mono text-muted-foreground md:inline-flex">
      {isMac ? '⌘' : 'Ctrl'}K
    </kbd>
  )
}
