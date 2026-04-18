# Documentation du Chatbot Malaïka

## Vue d'ensemble

Malaïka est l'assistante virtuelle IA de Milele, alimentée par l'API Groq (modèle LLaMA 3.3 70B). Son nom signifie « ange » en Swahili, reflétant son rôle bienveillant d'accompagnement des utilisateurs dans des moments difficiles. Elle fournit un soutien émotionnel, des informations sur les services funéraires, et une aide à la navigation sur la plateforme.

## Architecture

### Fichiers clés

| Fichier | Description |
|---------|-------------|
| `components/chatbot.tsx` | Widget flottant (bulle de chat) affiché sur toutes les pages |
| `app/malaika/page.tsx` | Page dédiée plein écran accessible via `/malaika` |
| `app/api/chat/route.ts` | Route API simple pour le chat (sans authentification) |
| `app/api/malaika/route.ts` | Route API principale avec authentification Supabase et historique |
| `scripts/004-malaika-chat-history.sql` | Migration SQL pour les tables de conversation |
| `lib/i18n/translations.ts` | Traductions multilingues (clés `malaika.*`) |

### Flux de données

```
Utilisateur → Composant React (useChat) → API Route (/api/malaika)
                                              ↓
                                         Groq API (LLaMA 3.3 70B)
                                              ↓
                                         Stream de réponse → UI
                                              ↓
                                    Supabase (sauvegarde historique si authentifié)
```

## Composants

### 1. Widget flottant (`components/chatbot.tsx`)

Le widget est un bouton flottant en bas à droite de chaque page, rendu globalement dans `app/layout.tsx`.

**Caractéristiques :**
- Bouton rond avec icône `MessageCircle` (Lucide)
- Fenêtre de chat de 380px max, positionnée en overlay
- Questions suggérées en français et anglais
- Animation d'entrée (`slide-in-from-bottom`)
- Icône ange personnalisée (SVG inline) pour l'avatar de Malaïka
- Indicateur de chargement (`Loader2`) pendant le streaming

**Utilisation dans le layout :**
```tsx
// app/layout.tsx
import { Chatbot } from '@/components/chatbot'

// Rendu dans le body, après le contenu principal
<Chatbot />
```

### 2. Page dédiée (`app/malaika/page.tsx`)

Page plein écran avec un design plus riche, accessible via la navigation de l'application.

**Caractéristiques :**
- Layout deux colonnes (suggestions à gauche, chat à droite)
- Icône ange SVG détaillée avec gradients et animations
- Suggestions multilingues (FR, EN, ES, SW)
- Design responsive (suggestions cachées sur mobile, affichées en haut)
- En-tête avec indicateur de statut en ligne (pastille verte animée)

**Navigation :**
- Barre de navigation inférieure (`components/app/bottom-nav.tsx`)
- Sidebar du dashboard (`components/dashboard/dashboard-sidebar.tsx`)
- Header du dashboard (`components/dashboard/dashboard-header.tsx`)

## API Routes

### `/api/chat` (route simple)

Route de base sans authentification, utilisant un prompt système en français.

```
POST /api/chat
Body: { messages: UIMessage[] }
Response: Stream SSE (Server-Sent Events)
```

**Prompt système :** Malaïka assistante de services funéraires, avec tarifs en CAD$ et catalogue de 9 catégories de services.

### `/api/malaika` (route principale)

Route complète avec authentification, contexte mémorial, et sauvegarde d'historique.

```
POST /api/malaika
Body: {
  messages: UIMessage[],
  language?: 'fr' | 'en' | 'es' | 'sw',
  conversationId?: string,
  memorialId?: string
}
Response: Stream SSE avec support consumeSseStream
```

**Fonctionnalités :**
- Détection automatique de la langue et instruction de réponse adaptée
- Contexte mémorial : si `memorialId` est fourni, récupère les informations du défunt pour personnaliser les réponses
- Sauvegarde automatique des conversations pour les utilisateurs authentifiés
- Création automatique de conversation avec titre basé sur le premier message
- Gestion du signal d'annulation (`abortSignal`)

## Base de données

### Tables Supabase

**`malaika_conversations`**
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `user_id` | UUID | Référence vers `profiles(id)` |
| `title` | TEXT | Titre auto-généré (50 premiers caractères du premier message) |
| `memorial_id` | UUID | Référence optionnelle vers un mémorial |
| `created_at` | TIMESTAMPTZ | Date de création |
| `updated_at` | TIMESTAMPTZ | Date de mise à jour (trigger automatique) |

**`malaika_messages`**
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `conversation_id` | UUID | Référence vers la conversation |
| `role` | TEXT | `'user'` ou `'assistant'` |
| `content` | TEXT | Contenu du message |
| `created_at` | TIMESTAMPTZ | Date de création |

### Sécurité (Row Level Security)

Les deux tables ont RLS activé :
- Les utilisateurs ne peuvent voir/créer/modifier/supprimer que leurs propres conversations
- L'accès aux messages est contrôlé par la propriété de la conversation parente

### Migration

```bash
# Appliquer la migration dans Supabase
psql -f scripts/004-malaika-chat-history.sql
```

## Configuration

### Variables d'environnement

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `GROQ_API_KEY` | ✅ Oui | Clé API Groq pour le modèle LLaMA |
| `NEXT_PUBLIC_SUPABASE_URL` | Pour l'historique | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pour l'historique | Clé anonyme Supabase |

Exemple dans `.env.example` :
```
GROQ_API_KEY=your_groq_api_key_here
```

### Modèle IA

- **Fournisseur :** Groq
- **Modèle :** `llama-3.3-70b-versatile`
- **Timeout :** 30 secondes (`maxDuration = 30`)
- **SDK :** `@ai-sdk/groq` + `ai` (Vercel AI SDK)

## Internationalisation

### Langues supportées

Le chatbot supporte 4 langues pour l'interface et les réponses IA :

| Langue | Code | Instruction pour l'IA |
|--------|------|----------------------|
| Français | `fr` | Réponds en français. |
| Anglais | `en` | Respond in English. |
| Espagnol | `es` | Responde en español. |
| Swahili | `sw` | Jibu kwa Kiswahili. |

### Clés de traduction

```
malaika.title       → Nom affiché ("Malaika")
malaika.subtitle    → Sous-titre ("Votre compagnon bienveillant")
malaika.greeting    → Message d'accueil initial
malaika.placeholder → Placeholder du champ de saisie
malaika.send        → Label du bouton d'envoi
```

### Questions suggérées

Chaque langue a 6 suggestions prédéfinies dans `app/malaika/page.tsx` (page dédiée) et 3 dans `components/chatbot.tsx` (widget).

## Intégration avec le SDK Vercel AI

### Hook `useChat`

Les deux composants utilisent le hook `useChat` de `@ai-sdk/react` avec un transport personnalisé :

```tsx
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/malaika',
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: { messages, id, language },
    }),
  }),
})
```

### États de chargement

```tsx
const isLoading = status === 'streaming' || status === 'submitted'
```

- `submitted` : requête envoyée, en attente de la première réponse
- `streaming` : réponse en cours de réception

## Guide pour les développeurs

### Modifier le prompt système

Le prompt se trouve dans `app/api/malaika/route.ts` (constante `MALAIKA_SYSTEM_PROMPT`). Le prompt inclut :
- L'identité de Malaïka et son rôle
- Les consignes de ton (empathie, chaleur, sensibilité culturelle)
- Le support multilingue
- L'instruction de langue dynamique ajoutée à l'exécution

### Ajouter une nouvelle langue pour le chatbot

1. Ajouter le code langue dans `lib/i18n/translations.ts` (type `Language`)
2. Ajouter les traductions `malaika.*` pour la nouvelle langue
3. Ajouter l'instruction de langue dans `app/api/malaika/route.ts` :
   ```tsx
   const languageInstruction = {
     fr: 'Réponds en français.',
     en: 'Respond in English.',
     // Ajouter ici
   }[language]
   ```
4. Ajouter les questions suggérées dans `app/malaika/page.tsx` (objet `SUGGESTIONS`)

### Changer de modèle IA

Pour utiliser un autre modèle Groq ou un autre fournisseur :

1. Modifier l'import et l'initialisation dans les routes API :
   ```tsx
   import { createGroq } from '@ai-sdk/groq'
   const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
   ```
2. Changer le modèle dans l'appel `streamText` :
   ```tsx
   model: groq('llama-3.3-70b-versatile') // Changer ici
   ```

### Ajouter un contexte au prompt

Le système supporte déjà le contexte mémorial. Pour ajouter d'autres contextes :

1. Accepter le nouveau paramètre dans le body de la requête
2. Enrichir le `systemPrompt` dans le handler `POST` de `/api/malaika`
3. Mettre à jour le `prepareSendMessagesRequest` côté client

## Dépannage

### « Stream timeout » ou réponse lente

**Cause :** Le modèle LLaMA 70B peut être lent sur Groq en période de forte charge.

**Solution :** Vérifier le `maxDuration` (actuellement 30s) et considérer un modèle plus petit si nécessaire.

### Les messages ne sont pas sauvegardés

**Cause possible :**
1. L'utilisateur n'est pas authentifié (la sauvegarde ne se fait que pour les utilisateurs connectés)
2. Les tables `malaika_conversations` / `malaika_messages` n'existent pas en base

**Solution :** Vérifier l'authentification et appliquer la migration `scripts/004-malaika-chat-history.sql`.

### « useChat » ne fonctionne pas

**Cause :** Le composant doit être un Client Component (`'use client'`) pour utiliser les hooks React.

**Solution :** Vérifier la directive `'use client'` en haut du fichier.

### Le chatbot ne répond pas dans la bonne langue

**Cause :** Le paramètre `language` n'est pas transmis correctement.

**Solution :** Vérifier que `prepareSendMessagesRequest` inclut bien `language` dans le body et que la route API le lit.

## Dépendances

| Package | Version | Rôle |
|---------|---------|------|
| `ai` | ^6.0.116 | Vercel AI SDK (core) |
| `@ai-sdk/react` | ^3.0.118 | Hooks React pour le chat |
| `@ai-sdk/groq` | ^3.0.29 | Fournisseur Groq |
| `@supabase/supabase-js` | ^2.49.4 | Client Supabase (historique) |
| `lucide-react` | ^0.564.0 | Icônes (MessageCircle, Send, X, User, Loader2, Sparkles) |
