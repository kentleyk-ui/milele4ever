// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Milele4Ever – Vos souvenirs, pour toujours',
  description: 'La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel. Préservez et partagez vos souvenirs en toute sécurité.',
  keywords: ['souvenirs éternels', 'héritage numérique', 'mémoire familiale', 'plateforme souvenirs', 'Milele4Ever'],
  authors: [{ name: 'Kent' }],
  openGraph: {
    title: 'Milele4Ever – Vos souvenirs, pour toujours',
    description: 'Transformez vos histoires en héritage éternel.',
    url: 'https://milele4ever.com',
    siteName: 'Milele4Ever',
    images: [
      {
        url: 'https://milele4ever.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Milele4Ever - Souvenirs Éternels',
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Milele4Ever – Vos souvenirs, pour toujours',
    description: 'La plateforme pour préserver vos souvenirs éternels.',
    images: ['https://milele4ever.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <Navbar />
        <main className="pt-24">{children}</main>
      </body>
    </html>
  );
}