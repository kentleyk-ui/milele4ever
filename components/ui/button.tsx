import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-wide transition-all duration-250 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-[0.96] hover:scale-[1.02] backdrop-blur-md",
  {
    variants: {
      variant: {
        default: 'bg-primary/90 text-primary-foreground shadow-[0_4px_20px_-4px] shadow-primary/25 hover:bg-primary hover:shadow-primary/40 border border-primary/20',
        destructive: 'bg-destructive/85 text-white shadow-[0_4px_20px_-4px] shadow-destructive/25 hover:bg-destructive hover:shadow-destructive/40 border border-destructive/20',
        outline: 'border border-border/60 bg-background/50 text-foreground shadow-xs hover:bg-accent/10 hover:border-primary/30 hover:shadow-[0_4px_16px_-4px] hover:shadow-primary/10 backdrop-blur-lg',
        secondary: 'bg-secondary/70 text-secondary-foreground border border-border/40 hover:bg-secondary/90 hover:border-primary/20 backdrop-blur-lg shadow-sm',
        ghost: 'bg-transparent text-primary hover:bg-primary/8 border border-transparent hover:border-primary/15 backdrop-blur-sm',
        link: 'text-primary underline underline-offset-4 hover:text-accent backdrop-blur-none shadow-none hover:scale-100',
        success: 'bg-green-600/85 text-white shadow-[0_4px_20px_-4px] shadow-green-600/25 hover:bg-green-600 hover:shadow-green-600/40 border border-green-500/20',
        info: 'bg-cyan-600/85 text-white shadow-[0_4px_20px_-4px] shadow-cyan-600/25 hover:bg-cyan-600 hover:shadow-cyan-600/40 border border-cyan-500/20',
        warning: 'bg-yellow-500/85 text-white shadow-[0_4px_20px_-4px] shadow-yellow-500/25 hover:bg-yellow-500 hover:shadow-yellow-500/40 border border-yellow-400/20',
        futuristic: 'bg-gradient-to-r from-primary/90 to-accent/90 text-white shadow-[0_4px_24px_-4px] shadow-accent/30 hover:from-primary hover:to-accent hover:shadow-accent/50 border border-white/10',
        glass: 'bg-white/8 dark:bg-white/5 text-foreground border border-white/15 dark:border-white/10 shadow-[0_4px_24px_-4px] shadow-black/5 hover:bg-white/14 hover:border-primary/25 hover:shadow-primary/10 backdrop-blur-xl',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 text-xs',
        lg: 'h-11 rounded-xl px-6 has-[>svg]:px-4 text-base',
        icon: 'size-9 rounded-xl',
        'icon-sm': 'size-8 rounded-lg',
        'icon-lg': 'size-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      aria-label={typeof props.children === 'string' ? props.children : undefined}
      tabIndex={0}
      {...props}
    />
  )
}

export { Button, buttonVariants }
