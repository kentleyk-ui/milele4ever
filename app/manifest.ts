import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Milele - Memorial & Services',
    short_name: 'Milele',
    description: 'Plateforme de services funéraires et mémoriaux pour humains et animaux',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#5B7F5E',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
