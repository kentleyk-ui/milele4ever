import type React from "react"
import type { Metadata, Viewport } from "next"
import dynamic from "next/dynamic"
import { Space_Grotesk, Geist_Mono, Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { LocaleProvider } from "@/lib/locale-context"

const ThemeSwitcher = dynamic(() => import("@/components/ThemeSwitcher"))
const ThemeSync = dynamic(() => import("@/components/ThemeSync"))
const RouteScope = dynamic(() => import("@/components/RouteScope"))
const FloatingActions = dynamic(() => import("@/components/FloatingActions").then((m) => m.FloatingActions))
const InstallPrompt = dynamic(() => import("@/components/InstallPrompt"))
const LangSetter = dynamic(() => import("@/components/LangSetter").then((m) => m.LangSetter))
const GeolocationPrompt = dynamic(() => import("@/components/GeolocationPrompt").then((m) => m.GeolocationPrompt))

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.milele4ever.com/#organization",
      name: "Milele",
      url: "https://www.milele4ever.com",
      logo: "https://www.milele4ever.com/og-image.jpg",
      sameAs: ["https://www.milele4ever.com", "https://milele4ever.com"],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.milele4ever.com/#website",
      url: "https://www.milele4ever.com",
      name: "Milele",
      inLanguage: "fr",
      description:
        "Hommages, accompagnement funeraire et espace de memoire pour celebrer la vie.",
      publisher: {
        "@id": "https://www.milele4ever.com/#organization",
      },
    },
    {
      "@type": "FAQPage",
      "@id": "https://www.milele4ever.com/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "Qu'est-ce que Milele ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Milele est une plateforme d'heritage numerique qui permet de preserver souvenirs, volontes et messages pour les generations futures.",
          },
        },
        {
          "@type": "Question",
          name: "Mes donnees sont-elles en securite ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Les donnees sont chiffrees et hebergees en Europe, avec controle des acces selon vos regles.",
          },
        },
        {
          "@type": "Question",
          name: "Comment fonctionne le Cercle de confiance ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Vous invitez des proches et attribuez des roles pour definir qui peut consulter chaque contenu et a quel moment.",
          },
        },
        {
          "@type": "Question",
          name: "Puis-je supprimer mon compte et mes donnees ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui. Vous pouvez exporter ou supprimer definitivement vos donnees depuis les parametres de votre profil.",
          },
        },
      ],
    },
  ],
}

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Milele — Hommages, souvenirs et accompagnement pour toujours",
  description: "Milele signifie « pour toujours » en swahili. Hommages, accompagnement funéraire, souvenirs et espace de mémoire pour célébrer la vie.",
  generator: "Milele",
  manifest: "/manifest.json",
  keywords: ["hommages", "souvenirs", "accompagnement funéraire", "mémoire", "deuil", "pour toujours", "milele"],
  metadataBase: new URL("https://www.milele4ever.com"),
  alternates: {
    canonical: "https://www.milele4ever.com/",
  },
  openGraph: {
    title: "Milele — Pour toujours",
    description: "Hommages, accompagnement funéraire et espace de mémoire pour célébrer la vie.",
    url: "https://www.milele4ever.com/",
    type: "website",
    images: [
      {
        url: "https://www.milele4ever.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Milele — Pour toujours",
      },
    ],
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Milele — Pour toujours",
    description: "Hommages, accompagnement funéraire et espace de mémoire pour célébrer la vie.",
    images: "https://www.milele4ever.com/og-image.jpg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Milele",
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
      <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/og-image.avif" as="image" fetchPriority="high" />
        {/* Inline script : applique le thème avant le premier rendu pour éviter le FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme-preference')||'system';var d=document.documentElement;var isDark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);d.classList.toggle('dark',isDark);}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body data-scope="public" className={`${spaceGrotesk.variable} ${geistMono.variable} ${playfairDisplay.variable} font-sans antialiased app-shell`} style={{background: 'var(--background)', color: 'var(--foreground)'}}>
        <LocaleProvider>
          <ThemeSync />
          <RouteScope />
          {/* Bouton ThemeSwitcher sticky en haut à droite */}
          <div className="global-theme-switcher fixed z-50">
            <ThemeSwitcher />
          </div>
          <LangSetter />
          <GeolocationPrompt />
          {children}
          <FloatingActions />
          <InstallPrompt />
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  )
}
