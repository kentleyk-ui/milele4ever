export const ROLE_CATEGORIES = [
  {
    id: 'administration',
    name: 'Administration & Direction',
    emoji: '⚜️',
    color: '#d4a853',
    description: 'Direction stratégique et gouvernance de la plateforme',
    roles: [
      {
        id: 'admin-supreme',
        name: 'Administrateur Suprême',
        description: 'Supervise l\'ensemble de la plateforme, prend les décisions finales et veille à l\'harmonie générale.',
        locked: true,
        lockedTo: 'Kent',
      },
      {
        id: 'architecte-systeme',
        name: 'Architecte du Système',
        description: 'Conçoit, structure et améliore les fondations techniques et organisationnelles.',
      },
      {
        id: 'gardien-aeternum',
        name: 'Gardien de l\'Aeternum',
        description: 'Assure la stabilité, la sécurité et la cohérence de l\'univers.',
      },
      {
        id: 'coordinateur-passages',
        name: 'Coordinateur des Passages',
        description: 'Gère les transitions, les accès et les flux entre les différentes sections.',
      },
      {
        id: 'maitre-protocoles',
        name: 'Maître des Protocoles',
        description: 'Définit les règles internes, les bonnes pratiques et les procédures officielles.',
      },
    ],
  },
  {
    id: 'moderation',
    name: 'Modération & Sécurité',
    emoji: '🛡️',
    color: '#ef4444',
    description: 'Protection, surveillance et maintien de l\'ordre',
    roles: [
      {
        id: 'moderateur-principal',
        name: 'Modérateur Principal',
        description: 'Supervise les interactions, veille au respect des règles et intervient en cas de conflit.',
      },
      {
        id: 'sentinelle-voile',
        name: 'Sentinelle du Voile',
        description: 'Surveille les anomalies, comportements suspects et zones sensibles.',
      },
      {
        id: 'inspecteur-anomalies',
        name: 'Inspecteur des Anomalies',
        description: 'Analyse les bugs, incidents et comportements inattendus.',
      },
      {
        id: 'gardien-interactions',
        name: 'Gardien des Interactions',
        description: 'Assure une communication saine, fluide et respectueuse entre les membres.',
      },
      {
        id: 'controleur-conformite',
        name: 'Contrôleur de Conformité',
        description: 'Vérifie que les actions et contenus respectent les normes établies.',
      },
    ],
  },
  {
    id: 'technique',
    name: 'Technique & Développement',
    emoji: '⚙️',
    color: '#3b82f6',
    description: 'Infrastructure, développement et optimisation technique',
    roles: [
      {
        id: 'technicien-voile',
        name: 'Technicien du Voile',
        description: 'Intervient sur les problèmes techniques, réparations et optimisations.',
      },
      {
        id: 'ingenieur-spheres',
        name: 'Ingénieur des Sphères',
        description: 'Développe et améliore les modules internes et fonctionnalités avancées.',
      },
      {
        id: 'forgeron-numerique',
        name: 'Forgeron Numérique',
        description: 'Crée, ajuste et renforce les outils internes.',
      },
      {
        id: 'analyste-flux',
        name: 'Analyste des Flux',
        description: 'Étudie les données, comportements et performances du système.',
      },
      {
        id: 'operateur-systemes',
        name: 'Opérateur des Systèmes',
        description: 'Gère les opérations quotidiennes, surveille les services.',
      },
    ],
  },
  {
    id: 'creation',
    name: 'Création & Contenu',
    emoji: '🎨',
    color: '#8b5cf6',
    description: 'Production créative, documentation et expérience visuelle',
    roles: [
      {
        id: 'archiviste',
        name: 'Archiviste de l\'Aeternum',
        description: 'Organise, documente et conserve les informations importantes.',
      },
      {
        id: 'concepteur-recits',
        name: 'Concepteur des Récits',
        description: 'Crée les textes, messages, histoires et contenus narratifs.',
      },
      {
        id: 'artisan-visuel',
        name: 'Artisan Visuel',
        description: 'Produit les visuels, images, icônes et éléments graphiques.',
      },
      {
        id: 'curateur-memoires',
        name: 'Curateur des Mémoires',
        description: 'Sélectionne, met en valeur et organise les contenus communautaires.',
      },
      {
        id: 'maitre-interfaces',
        name: 'Maître des Interfaces',
        description: 'Travaille sur l\'apparence, l\'ergonomie et l\'expérience utilisateur.',
      },
    ],
  },
  {
    id: 'communaute',
    name: 'Accompagnement & Communauté',
    emoji: '🤝',
    color: '#10b981',
    description: 'Support, intégration et voix de la communauté',
    roles: [
      {
        id: 'guide-passage',
        name: 'Guide du Passage',
        description: 'Accompagne les nouveaux membres, répond aux questions.',
      },
      {
        id: 'ambassadeur-voyageurs',
        name: 'Ambassadeur des Voyageurs',
        description: 'Représente la communauté, fait remonter les besoins.',
      },
      {
        id: 'conseiller-harmonie',
        name: 'Conseiller de l\'Harmonie',
        description: 'Aide à maintenir une ambiance positive et équilibrée.',
      },
      {
        id: 'responsable-retours',
        name: 'Responsable des Retours',
        description: 'Collecte, analyse et transmet les feedbacks utilisateurs.',
      },
      {
        id: 'eclaireur-mondes',
        name: 'Éclaireur des Nouveaux Mondes',
        description: 'Explore les nouvelles fonctionnalités, teste les nouveautés.',
      },
    ],
  },
] as const

export type RoleCategory = (typeof ROLE_CATEGORIES)[number]
export type Role = RoleCategory['roles'][number]

export function getRoleById(roleId: string) {
  for (const cat of ROLE_CATEGORIES) {
    const role = (cat.roles as ReadonlyArray<{ id: string; name: string; description: string }>).find(r => r.id === roleId)
    if (role) return { ...role, category: cat }
  }
  return null
}

export function getCategoryById(catId: string) {
  return ROLE_CATEGORIES.find(c => c.id === catId) ?? null
}

export const ALL_ROLES = ROLE_CATEGORIES.flatMap(cat =>
  cat.roles.map(r => ({ ...r, categoryId: cat.id, categoryName: cat.name, categoryColor: cat.color, categoryEmoji: cat.emoji }))
)
