import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Milele - Memorial & Services',
    short_name: 'Milele',
    description: 'Plateforme de services funeraires et memoriaux pour humains et animaux. Honorez la memoire de vos proches.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#5B7F5E',
    orientation: 'portrait',
    scope: '/',
    lang: 'fr',
    dir: 'ltr',
    categories: ['lifestyle', 'social', 'utilities'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: '/screenshots/home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Page d\'accueil Milele',
      },
      {
        src: '/screenshots/mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Application mobile Milele',
      },
    ],
    shortcuts: [
      {
        name: 'Mes Memoriaux',
        short_name: 'Memoriaux',
        description: 'Acceder a vos memoriaux',
        url: '/dashboard/memorials',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Parler a Malaika',
        short_name: 'Malaika',
        description: 'Discuter avec votre ange gardien',
        url: '/malaika',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Milele Book',
        short_name: 'Book',
        description: 'Ressources et articles',
        url: '/milele-book',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
      {
        name: 'Plateforme Juridique',
        short_name: 'Juridique',
        description: 'Documents et contrats juridiques',
        url: '/legal',
        icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  }
}
