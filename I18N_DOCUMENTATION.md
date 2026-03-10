# Documentation du Système i18n (Internationalisation)

## Vue d'ensemble

Le système de traduction (i18n) de Milele est construit avec React Context et localStorage pour une gestion légère et efficace des traductions. Il supporte actuellement deux langues: Français (fr) et Anglais (en).

## Architecture

### Fichiers clés

1. **`lib/i18n/translations.ts`** - Dictionnaire centralisé avec toutes les traductions
   - Exporte un objet `translations` avec les clés pour chaque langue
   - Exporte une fonction `getTranslation()` pour récupérer les traductions

2. **`lib/i18n/context.tsx`** - Context React pour fournir les traductions à l'app
   - `I18nProvider` - Enveloppe l'app et gère la langue
   - `useI18n()` - Hook pour accéder à `language`, `setLanguage()` et `t()`

3. **`components/language-switcher.tsx`** - Bouton de sélection de langue
   - Boutons FR/EN pour changer la langue
   - Icône globe pour localiser facilement

4. **`app/layout.tsx`** - Enveloppe l'app avec I18nProvider

## Utilisation

### Dans les composants client

```tsx
'use client'

import { useI18n } from '@/lib/i18n/context'

export function MyComponent() {
  const { t, language, setLanguage } = useI18n()
  
  return (
    <div>
      <h1>{t('my.translation.key')}</h1>
      <p>{t('my.other.key', 'Default value si clé non trouvée')}</p>
      <button onClick={() => setLanguage('en')}>English</button>
    </div>
  )
}
```

### Dans les composants serveur

Les Server Components ne peuvent pas accéder directement à useI18n(). Vous avez deux options:

1. **Garder le texte en français dur** (pour les labels statiques)
```tsx
export default function MyServerPage() {
  return <h1>Accueil</h1>
}
```

2. **Créer une version client wrapper**
```tsx
// app/my-page/page.tsx
import { MyPageClient } from '@/components/my-page-client'

export default function MyPage() {
  return <MyPageClient />
}

// components/my-page-client.tsx
'use client'
import { useI18n } from '@/lib/i18n/context'

export function MyPageClient() {
  const { t } = useI18n()
  return <h1>{t('my.key')}</h1>
}
```

## Ajouter une nouvelle traduction

### Étape 1: Ajouter la clé dans `translations.ts`

```tsx
export const translations: Record<Language, Record<string, string>> = {
  en: {
    'my.new.key': 'My English text',
  },
  fr: {
    'my.new.key': 'Mon texte en français',
  },
}
```

### Étape 2: Utiliser dans un composant

```tsx
const { t } = useI18n()
<p>{t('my.new.key')}</p>
```

## Persistance des préférences

La langue sélectionnée est **automatiquement sauvegardée** dans localStorage et restaurée au rechargement:

```tsx
// Dans context.tsx
useEffect(() => {
  const stored = localStorage.getItem('language')
  if (stored) setLanguageState(stored)
}, [])

const setLanguage = (lang: Language) => {
  setLanguageState(lang)
  localStorage.setItem('language', lang)
}
```

### Comportement par défaut

- Première visite: Français (fr) par défaut
- Changement de langue: Immédiatement appliqué et sauvegardé
- Rechargement: La langue choisie précédemment est restaurée

## Statut des traductions

### Pages/Composants traduites (✅)

- ✅ Landing Header (landing-header.tsx)
- ✅ Hero Section (hero.tsx)
- ✅ Services Preview (services-preview.tsx)
- ✅ Landing Footer (landing-footer.tsx)
- ✅ Login Page (auth/login/page.tsx)
- ✅ Sign Up Page (auth/sign-up/page.tsx)
- ✅ App Header (app/app-header.tsx)
- ✅ Bottom Nav (app/bottom-nav.tsx)
- ✅ Language Switcher (language-switcher.tsx)

### Pages/Composants statiques (🟡)

- 🟡 App pages (RSC avec texte français dur)
- 🟡 Pets page (RSC avec texte français dur)
- 🟡 Other services pages (RSC avec texte français dur)

## Guide pour les futurs développeurs

### Ajouter un nouveau composant avec traductions

1. Importez `useI18n` et marquez le composant comme `'use client'`
2. Appelez `const { t } = useI18n()`
3. Remplacez tous les textes par `t('namespace.key')`
4. Ajoutez les traductions correspondantes dans `translations.ts`

### Structure recommandée des clés

```
namespace.subnamespace.key

Exemples:
- landing.header.title
- auth.login.error
- app.feed.welcome
- common.button.save
```

### Ajouter une nouvelle langue

Pour ajouter une nouvelle langue (ex: Espagnol):

1. Modifiez le type `Language` dans `translations.ts`:
```tsx
export type Language = 'en' | 'fr' | 'es'
```

2. Ajoutez les traductions:
```tsx
es: {
  'landing.title': 'Milele',
  // ... toutes les autres clés
}
```

3. Mettez à jour le `LanguageSwitcher` pour afficher le nouveau bouton

## Dépannage

### "useI18n must be used within I18nProvider"

**Cause**: Vous essayez d'utiliser `useI18n` dans un composant qui n'est pas enveloppé par `I18nProvider`

**Solution**: Assurez-vous que le composant:
1. Est marqué comme `'use client'`
2. Est utilisé dans un arbre qui descend de `I18nProvider` (dans `layout.tsx`)

### Les traductions ne changent pas

**Cause**: Vous utilisez une clé qui n'existe pas dans le dictionnaire

**Solution**: Vérifiez que la clé existe dans `translations.ts` pour BOTH langues

### localStorage n'est pas accessible

**Cause**: Vous accédez à localStorage pendant le rendu serveur

**Solution**: Vérifiez que le code est dans un `useEffect` ou dans un composant client

## Performance

- Les traductions sont stockées en mémoire dans `translations` (objet statique)
- Pas d'appels réseau pour les traductions
- localStorage utilisé seulement pour persister les préférences
- Context Provider est léger et n'utilise pas de state complexe

## Maintenir le système

Quand vous ajoutez une nouvelle feature avec du texte:
1. ✅ Créez les clés dans `translations.ts` pour les deux langues
2. ✅ Utilisez `t('key')` dans le composant
3. ✅ Testez les deux langues dans le navigateur
4. ✅ Vérifiez que localStorage persiste correctement
