'use client'

import { useI18n, currencyConfig, type Currency } from '@/lib/i18n/context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Coins } from 'lucide-react'

export function CurrencySwitcher() {
  const { currency, setCurrency } = useI18n()

  const currencies: Currency[] = ['XAF', 'EUR', 'USD']

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2">
          <Coins className="h-4 w-4" />
          <span className="text-xs font-medium">{currencyConfig[currency].symbol}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr}
            onClick={() => setCurrency(curr)}
            className={currency === curr ? 'bg-primary/10 text-primary' : ''}
          >
            <span className="font-medium mr-2">{currencyConfig[curr].symbol}</span>
            <span className="text-muted-foreground text-xs">{currencyConfig[curr].name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
