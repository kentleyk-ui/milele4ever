# Guide de Restauration de Sauvegarde Supabase

Ce guide explique comment restaurer votre base de données Milele4Ever à partir d'une sauvegarde.

## 📁 Fichiers de Migration

Les fichiers SQL suivants sont disponibles dans ce dossier :

- **001-create-tables.sql** - Crée la structure complète des 13 tables
- **002-rls-policies.sql** - Applique les politiques de sécurité (Row Level Security)
- **003-service-request-full.sql** - Migration pour la table service_requests améliorée

## 🚀 Méthode 1 : Via le Dashboard Supabase (Recommandé)

C'est la façon la plus simple et la plus sûre de restaurer votre sauvegarde.

### Étapes :

1. **Allez sur le dashboard Supabase** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** `milele4ever`
3. **Allez dans l'onglet "SQL Editor"**
4. **Copiez le contenu de chaque fichier SQL** dans l'ordre :
   - D'abord `001-create-tables.sql`
   - Ensuite `002-rls-policies.sql`
   - Enfin `003-service-request-full.sql`
5. **Exécutez chaque requête** en cliquant sur "Run"

**⚠️ Important** : Exécutez les fichiers dans l'ordre indiqué, car certaines tables dépendent d'autres.

---

## 🛠️ Méthode 2 : Via le Script Node.js

Si vous avez Node.js installé sur votre machine :

```bash
# Depuis la racine du projet
npm install  # ou pnpm install / yarn install

# Exécutez le script de restauration
node scripts/restore-backup.js
```

**Prérequis** :
- Variables d'environnement configurées : `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

---

## 🐍 Méthode 3 : Via le Script Python

Si vous avez Python 3.8+ et `psycopg2` :

```bash
# Installez les dépendances
pip install psycopg2-binary

# Exécutez le script
python scripts/restore-backup.py
```

**Prérequis** :
- Variables d'environnement configurées : `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔑 Configuration des Variables d'Environnement

Pour utiliser les scripts automatisés, vous devez configurer :

### Dans votre fichier `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_clé_secrète_ici
```

### Où trouver ces clés :

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **Settings** → **API**
4. Vous trouverez :
   - **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
   - **Service Role Secret** = `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Attention** : Ne partagez JAMAIS votre `SUPABASE_SERVICE_ROLE_KEY` publiquement !

---

## ✅ Vérification de la Restauration

Après avoir exécuté les migrations, vérifiez que tout s'est bien passé :

```sql
-- Listez toutes les tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifiez le nombre de lignes dans chaque table
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM memorials;
SELECT COUNT(*) FROM posts;
-- ... etc
```

Vous devriez voir les 13 tables créées :
- ✅ profiles
- ✅ memorials
- ✅ memorial_members
- ✅ posts
- ✅ media
- ✅ timeline_events
- ✅ family_relationships
- ✅ conversations
- ✅ conversation_participants
- ✅ messages
- ✅ notifications
- ✅ service_requests
- ✅ candles

---

## 🆘 Dépannage

### Erreur : "SUPABASE_SERVICE_ROLE_KEY not found"

**Solution** : Assurez-vous d'avoir défini vos variables d'environnement. Créez un fichier `.env.local` à la racine de votre projet.

### Erreur : "Column already exists"

**Solution** : C'est normal si les tables existent déjà. Les migrations sont écrites avec `CREATE TABLE IF NOT EXISTS` pour éviter les conflits.

### Erreur de connexion à la base de données

**Solution** : Vérifiez que votre `NEXT_PUBLIC_SUPABASE_URL` est correcte et que vous avez accès à internet.

---

## 📊 Structure de la Base de Données

```
Milele4Ever Database
├── Profiles (utilisateurs)
├── Memorials (pages commémoratives)
├── Memorial Members (permissions)
├── Posts (publications)
├── Media (photos/vidéos)
├── Timeline Events (événements de vie)
├── Family Relationships (arbre généalogique)
├── Conversations (messagerie)
├── Messages (messages)
├── Notifications (notifications)
├── Service Requests (demandes funéraires)
└── Candles (bougies virtuelles)
```

---

## 🔒 Sécurité

Les politiques de sécurité (RLS) sont automatiquement appliquées par `002-rls-policies.sql` :

- Les utilisateurs ne peuvent voir que leurs propres données
- Les murs mémoriaux publics sont visibles par tous
- Les modifications nécessitent les bonnes permissions
- Les notifications ne sont visibles que par le destinataire

---

## 📝 Notes

- Les migrations sont **idempotentes** : vous pouvez les exécuter plusieurs fois sans danger
- Les triggers `updated_at` mettent automatiquement à jour l'heure de modification
- Les indexes sont créés pour optimiser les performances
- Les références de clés étrangères garantissent l'intégrité des données

---

## ❓ Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Consultez les logs du script d'exécution
2. Vérifiez les variables d'environnement
3. Testez manuellement les requêtes SQL via le dashboard Supabase
4. Vérifiez la connexion réseau vers Supabase

Bon courage ! 🚀
