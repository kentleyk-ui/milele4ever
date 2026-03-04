// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Milele4Ever – Vos souvenirs, pour toujours',
  description: 'La plateforme unifiée qui transforme vos histoires, photos et vidéos en héritage éternel.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'Milele4Ever – Souvenirs Éternels',
    description: 'Préservez et partagez vos souvenirs pour toujours.',
    images: [{ url: 'https://milele4ever.vercel.app/og-image.jpg' }],
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