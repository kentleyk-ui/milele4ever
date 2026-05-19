# Configuration Slack et Cloudflare

## État Actuel

✅ **Slack et Cloudflare sont maintenant fonctionnels en mode simulation**

### Mode Simulation Activé
- **Slack**: Retourne des succès factices quand `SLACK_WEBHOOK_URL` n'est pas configuré
- **Cloudflare**: Retourne des données mockées quand `CLOUDFLARE_API_TOKEN` ou `CLOUDFLARE_ZONE_ID` ne sont pas configurés
- L'interface affiche "Mode simulation" (badge ambre) pour les services non configurés
- Toutes les actions dans LiquidDash fonctionnent sans erreur

## Configuration Requise pour Activation Complète

### 1. Slack Integration

#### Obtenir le Webhook URL:
1. Accédez à https://api.slack.com/apps
2. Créez une nouvelle app ou sélectionnez une existante
3. Allez dans "Incoming Webhooks" et activez-le
4. Créez un nouveau webhook pour un channel (format: `https://hooks.slack.com/services/T.../B.../...`)

#### Configurer dans l'application:

**Pour développement local** (`.env.local`):
```env
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Pour production** (Vercel Dashboard):
1. Allez à https://vercel.com/dashboard
2. Sélectionnez le projet "milele"
3. Settings > Environment Variables
4. Ajoutez: `SLACK_WEBHOOK_URL` = `https://hooks.slack.com/services/YOUR/WEBHOOK/URL`
5. Sélectionnez "Production" scope
6. Redéployez le projet

### 2. Cloudflare Integration

#### Obtenir les Credentials:

**API Token**:
1. Accédez à https://dash.cloudflare.com/profile/api-tokens
2. Créez un token avec les permissions: `Cache Purge`
3. Copiez le token généré

**Zone ID**:
1. Accédez à https://dash.cloudflare.com
2. Sélectionnez le domaine "milele4ever.com"
3. Accédez à Settings > Zone ID
4. Copiez la Zone ID

#### Configurer dans l'application:

**Pour développement local** (`.env.local`):
```env
CLOUDFLARE_API_TOKEN="your_api_token_here"
CLOUDFLARE_ZONE_ID="your_zone_id_here"
```

**Pour production** (Vercel Dashboard):
1. Allez à https://vercel.com/dashboard
2. Sélectionnez le projet "milele"
3. Settings > Environment Variables
4. Ajoutez deux variables:
   - `CLOUDFLARE_API_TOKEN` = votre token API
   - `CLOUDFLARE_ZONE_ID` = votre Zone ID
5. Sélectionnez "Production" scope pour chacune
6. Redéployez le projet

## Fichiers Modifiés

### Backend (Mode Simulation)
- `lib/server/cloudflareService.ts` - Retourne données mockées si tokens manquent
- `app/api/staff/monitoring/route.ts` - Slack success en mode fallback + ajoute flags cfFallbackMode
- `.env.local` - Variables ajoutées avec commentaires de configuration
- `.vercel/.env.production.local` - Variables ajoutées avec commentaires de configuration

### Frontend (Interface)
- `components/staff/LiquidDash.tsx` - Affiche "Mode simulation" (badge ambre) quand services non configurés

## Tests

### Mode Simulation (Actuel)
```bash
# Tester localement en mode simulation
pnpm dev
# Naviguer vers /staff/liquid-dash
# Observer les statuts "Mode simulation" pour Slack et Cloudflare
# Cliquer sur "Envoyer notification test" - doit afficher succès simulé
# Cliquer sur "Purger le cache CF" - doit afficher succès simulé
```

### Mode Production (Après Configuration)
```bash
# Après ajout des vrais tokens:
pnpm build
vercel deploy --prod

# Vérifier que les statuts changent de "Mode simulation" à "Connecté"
# Tester les actions - doivent vraiment envoyer à Slack et Cloudflare
```

## Métriques Mockées

### Cloudflare (Mode Simulation)
```javascript
{
  requests: {
    all: 15234,
    cached: 12187,
    uncached: 3047,
    cacheHitRate: "79.9"
  },
  bandwidth: {
    all: "2.34 GB",
    cached: "1.87 GB",
    uncached: "470 MB"
  },
  threats: 142,
  pageViews: 8934,
  uniques: 2156
}
```

## Dépannage

### Slack webhook échoue
- Vérifier le format: `https://hooks.slack.com/services/T.../B.../...`
- Vérifier que le workspace permet les Incoming Webhooks
- Vérifier que le token n'a pas expiré

### Cloudflare ne se connecte pas
- Vérifier le format du token (commence par généralement `v1_`)
- Vérifier que le token a la permission "Cache Purge"
- Vérifier la Zone ID (visible en Settings > Zone ID)
- Vérifier que le domaine est correctement configuré sur Cloudflare

### Interface affiche toujours "Mode simulation"
- Vérifier que les variables .env sont bien configurées dans Vercel Dashboard
- Redéployer après ajout des variables: `vercel deploy --prod`
- Vérifier que les variables ne sont pas vides ou mal formatées
