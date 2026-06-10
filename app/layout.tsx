import type { Metadata, Viewport } from 'next'
import { DM_Sans, Playfair_Display, Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/lib/i18n/context'
import { FeedbackButton } from '@/components/feedback-button'
import { Chatbot } from '@/components/chatbot'
import { PWAInstall } from '@/components/pwa-install'
import './globals.css'
import './animations.css'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const dmSans = DM_Sans({ 
  subsets: ["latin"],
  variable: '--font-dm-sans',
})

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair',
})

export const metadata: Metadata = {
  title: {
    default: 'Milele - Pour toujours',
    template: '%s | Milele',
  },
  description: 'Plateforme de services funéraires et mémoriaux pour humains et animaux. Honorez la mémoire de vos proches.',
  generator: 'v0.app',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Milele',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.jpg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.jpg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#5B7F5E',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${dmSans.variable} ${playfair.variable} font-sans antialiased`}>
        <a href="#main-content" className="skip-to-content">
          Aller au contenu principal
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <I18nProvider>
            {children}
          </I18nProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
