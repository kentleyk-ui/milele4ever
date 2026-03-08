# 🎯 System de Restauration de Sauvegarde Supabase

Vous venez de mettre en place un système complet de restauration de sauvegarde pour votre application **Milele4Ever**.

## 📦 Fichiers Créés

### Migrations SQL (dans `/scripts/`)
- ✅ `001-create-tables.sql` - Schéma complet des 13 tables
- ✅ `002-rls-policies.sql` - Politiques de sécurité (Row Level Security)
- ✅ `003-service-request-full.sql` - Migration améliorée pour service_requests

### Scripts d'Automatisation
- ✅ `restore-backup.js` - Script Node.js pour restauration automatique
- ✅ `restore-backup.py` - Script Python pour restauration automatique
- ✅ `restore.sh` - Script interactif Shell (Linux/Mac)
- ✅ `export-backup.js` - Script pour exporter les données vers JSON

### Documentation
- ✅ `RESTORE_GUIDE.md` - Guide détaillé avec 3 méthodes de restauration
- ✅ `package.json` - Scripts npm intégrés

## 🚀 Comment Utiliser

### Option 1 : Via npm (Plus simple)
```bash
npm run db:restore
```

### Option 2 : Via Python
```bash
npm run db:restore:py
```

### Option 3 : Via Supabase Dashboard (Recommandé pour les débutants)
1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans SQL Editor
4. Copiez/exécutez les fichiers SQL dans l'ordre

### Option 4 : Sauvegarder les données actuelles (Avant restauration)
```bash
npm run db:export
```

## ⚙️ Configuration Requise

Créez un fichier `.env.local` à la racine du projet :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_secret_key
```

[Où trouver ces clés ?](RESTORE_GUIDE.md#🔑-configuration-des-variables-denvironnement)

## 📊 Structure de Base de Données

Votre sauvegarde restaurera **13 tables** :

```
Profiles → Utilisateurs
Memorials → Pages commémoratives
↓
├─ Memorial Members (permissions)
├─ Posts (publications)
├─ Media (photos/vidéos)
├─ Timeline Events (événements)
├─ Family Relationships (généalogie)
├─ Candles (bougies virtuelles)
│
├─ Conversations (messagerie)
│  ├─ Conversation Participants
│  └─ Messages
│
├─ Notifications (alertes)
└─ Service Requests (demandes funéraires)
```

## 🔒 Sécurité

- Les politiques RLS (Row Level Security) sont automatiquement activées
- Les utilisateurs ne voient que leurs propres données
- Les memorials publics sont visibles par tous
- Les modifications nécessitent les bonnes permissions

## ✅ Vérification

Après la restauration, vérifiez que tout fonctionne :

```sql
-- Listez les tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Vérifiez les données
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM memorials;
```

## 📝 Commandes npm

```bash
# Restaurer depuis sauvegarde (Node.js)
npm run db:restore

# Restaurer depuis sauvegarde (Python)
npm run db:restore:py

# Exporter les données actuelles
npm run db:export

# Exécuter l'app en développement
npm run dev

# Builder pour production
npm run build
```

## 🆘 Besoin d'aide ?

Consultez le guide complet : [`scripts/RESTORE_GUIDE.md`](RESTORE_GUIDE.md)

---

**Statut** ✨ System de restauration prêt !
