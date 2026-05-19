# 📋 Système de Gestion des Suggestions

## Vue d'ensemble

Système professionnel et complet pour gérer les retours (feedback) des utilisateurs. Les suggestions sont automatiquement triées par statut dans une interface de style Kanban.

## Fonctionnalités

### ✨ Interface Admin
- **Tableau Kanban** avec 3 colonnes : Nouveau, En cours, Résolu
- **Cartes détaillées** pour chaque suggestion avec :
  - Type de feedback (Bug, Suggestion, Design, Orthographe, Autre)
  - Message du créateur
  - Horodatage relatif (ex: "2h", "1j")
  - Statut avec code couleur
  - Lien vers la page si applicable

### 🎯 Fonctionnalités Principales

1. **Édition Inline**
   - 💬 Commentaire Admin : notes internes
   - ✨ Résumé Résolution : décrire la solution
   - 👤 Réponse Créateur : message visible pour l'utilisateur

2. **Gestion des Statuts**
   - 🆕 **Nouveau** : feedback non traité
   - 🔄 **En cours** : en cours de traitement
   - ✅ **Résolu** : résolu et fermé

3. **Transitions Automatiques**
   - Les suggestions se repositionnent automatiquement quand le statut change
   - Sauvegarde instantanée des modifications

4. **Notifications**
   - Alerte Telegram à chaque mise à jour
   - Notification utilisateur quand un feedback est résolu
   - Email optionnel au créateur

5. **Temps Réel**
   - Mise à jour automatique via WebSocket Supabase
   - Synchronisation en temps réel avec d'autres admins

## Structure des Données

### Métadonnées JSON
Chaque feedback contient une structure de métadonnées JSON stockée dans le champ `note`:

```json
{
  "statusNote": "En cours",
  "adminComment": "À vérifier sur mobile",
  "resolutionSummary": "Correctif déployé v2.1",
  "creatorReply": "Nous avons résolu le problème...",
  "creatorUpdate": "Message du créateur (optionnel)",
  "creatorUserId": "uuid (si utilisateur enregistré)",
  "history": [
    {
      "timestamp": "2026-05-08T10:30:00Z",
      "action": "status_changed",
      "actor": "admin@milele4ever.com",
      "changes": {"status": "new → in-progress"}
    }
  ]
}
```

## Workflow Recommandé

1. **Nouveau Feedback Reçu**
   - Apparaît dans la colonne "Nouveau"
   - Lisez le message et les commentaires

2. **Commencer le Traitement**
   - Cliquez "Commencer" → déplace à "En cours"
   - Optionnel: Ajoutez un commentaire interne

3. **Ajouter Détails**
   - Cliquez "Éditer" pour ajouter :
     - Résumé de la résolution
     - Message pour le créateur

4. **Marquer Résolu**
   - Cliquez "Marquer résolu" → déplace à "Résolu"
   - Envoie notification au créateur

5. **Archivage Optionnel**
   - Feedback reste visible dans "Résolu"
   - Peut être réouvert si nécessaire

## Accès

### URL Admin
- Path: `/admin/suggestions`
- Mot de passe: Stocké dans `AdminSuggestionsClient.tsx`
- Sécurité: IP-restricted sur serveur (recommandé)

### API Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/feedback/list` | GET | Liste tous les feedbacks |
| `/api/feedback/status` | POST | Met à jour le statut + métadonnées |
| `/api/feedback/history` | GET | Obtient l'historique d'un feedback |

## Types de Retours

| Type | Emoji | Couleur | Cas d'usage |
|------|-------|--------|-----------|
| Bug | 🐛 | Rouge | Dysfonctionnement |
| Suggestion | 💡 | Jaune | Idée, demande de feature |
| Orthographe | ✏️ | Bleu | Faute de texte |
| Design | 🎨 | Rose | Problème visuel |
| Autre | 📝 | Gris | Autre |

## Bonnes Pratiques

✅ **À Faire**
- Répondre rapidement aux bugs critiques
- Ajouter un "Résumé Résolution" descriptif
- Laisser un message pour le créateur
- Classer régulièrement les feedbacks

❌ **À Éviter**
- Laisser des feedbacks "En cours" sans mise à jour
- Oublier de répondre au créateur
- Fermer sans contexte

## Configuration

### Variables d'environnement
```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### Mot de passe Admin
Modifiez dans `AdminSuggestionsClient.tsx` (ligne ~450):
```typescript
if (password === "your_new_password") {
  setAuthenticated(true)
}
```

## Troubleshooting

**Les modifications ne s'enregistrent pas:**
- Vérifiez que vous êtes authentifié
- Vérifiez la connexion réseau
- Rafraîchissez la page

**Les notifications Telegram ne s'envoient pas:**
- Vérifiez `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID`
- Vérifiez que le bot a accès au chat

**Les suggestions ne s'actualisent pas:**
- Cliquez le bouton rafraîchir
- Vérifiez la souscription WebSocket

## Déploiement

Après modifications:
1. Commit les changements
2. Push vers production
3. Les mises à jour sont déployées automatiquement
4. Vérifiez les logs Telegram

---

**Dernière mise à jour:** Mai 2026  
**Mainteneur:** Équipe Milele
