📋 CHECKLIST DE RESTAURATION DE SAUVEGARDE

Suivez cette checklist pour restaurer votre base de données Milele4Ever avec succès.

═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 1: PRÉPARATION
═══════════════════════════════════════════════════════════════════════════════

□ J'ai accès à mon dashboard Supabase (https://supabase.com/dashboard)
□ J'ai sélectionné mon projet "milele4ever"
□ J'ai copié mon NEXT_PUBLIC_SUPABASE_URL (Project URL)
□ J'ai copié mon SUPABASE_SERVICE_ROLE_KEY (Service Role Secret)
□ J'ai créé un fichier .env.local à la racine du projet
□ J'ai rempli les variables d'environnement dans .env.local
□ J'ai lu le BACKUP_SETUP.txt pour comprendre les options

═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 2: CHOIX DE LA MÉTHODE
═══════════════════════════════════════════════════════════════════════════════

Choisissez UNE SEULE méthode:

MÉTHODE A: Interface Web (Plus simple - aucune dépendance)
  □ J'ouvre le fichier scripts/restore-gui.html dans mon navigateur
  □ Je suis les instructions à l'écran
  → ALLER À ÉTAPE 4

MÉTHODE B: Via npm (Node.js)
  □ J'ai Node.js installé sur ma machine
  □ J'exécute: npm run db:restore
  □ J'attends que la restauration se termine
  → ALLER À ÉTAPE 4

MÉTHODE C: Via Python
  □ J'ai Python 3.8+ installé
  □ J'ai psycopg2 installé: pip install psycopg2-binary
  □ J'exécute: npm run db:restore:py
  □ J'attends que la restauration se termine
  → ALLER À ÉTAPE 4

MÉTHODE D: Dashboard Supabase (Plus sûr)
  □ J'ouvre https://supabase.com/dashboard
  □ Je sélectionne mon projet "milele4ever"
  □ Je vais dans l'onglet "SQL Editor"
  □ Je copie le contenu de scripts/001-create-tables.sql
  □ Je l'exécute et j'attends la confirmation
  □ Je copie le contenu de scripts/002-rls-policies.sql
  □ Je l'exécute et j'attends la confirmation
  □ Je copie le contenu de scripts/003-service-request-full.sql
  □ Je l'exécute et j'attends la confirmation
  → ALLER À ÉTAPE 4

═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 3: APRÈS LA RESTAURATION
═══════════════════════════════════════════════════════════════════════════════

□ La restauration s'est déroulée sans erreurs
□ Je n'ai pas vu de messages d'erreur critiques

═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 4: VÉRIFICATION
═══════════════════════════════════════════════════════════════════════════════

Vérifiez que tout s'est bien passé:

□ Je vais sur https://supabase.com/dashboard
□ Je sélectionne mon projet "milele4ever"
□ Je vais dans "SQL Editor"
□ J'exécute cette requête:

    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;

□ Je vois les 13 tables suivantes:
  - candles
  - conversation_participants
  - conversations
  - family_relationships
  - media
  - memorial_members
  - memorials
  - messages
  - notifications
  - posts
  - profiles
  - service_requests
  - timeline_events

□ TOUTES les 13 tables sont présentes

═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 5: VÉRIFICATION SUPPLÉMENTAIRE (OPTIONNEL)
═══════════════════════════════════════════════════════════════════════════════

Pour vérifier plus en détail:

□ Je vais dans l'onglet "Databases" → "Tables" dans Supabase
□ Je vois toutes les tables listées
□ Je clique sur "memorials" et je vois les colonnes:
  - id
  - created_by
  - full_name
  - date_of_birth
  - date_of_death
  - biography
  - is_public
  - etc.

□ Je clique sur "profiles" et je vois les colonnes:
  - id
  - full_name
  - avatar_url
  - bio
  - etc.

═══════════════════════════════════════════════════════════════════════════════

ÉTAPE 6: TEST DE CONNEXION
═══════════════════════════════════════════════════════════════════════════════

□ Je lance l'app: npm run dev
□ L'app démarre sans erreurs
□ Je peux accéder à la page d'accueil: http://localhost:3000
□ Je ne vois pas d'erreurs de base de données

═══════════════════════════════════════════════════════════════════════════════

DÉPANNAGE
═══════════════════════════════════════════════════════════════════════════════

Si quelque chose ne fonctionne pas:

Problème: Erreur "SUPABASE_SERVICE_ROLE_KEY not found"
Solution:
  □ Créez un fichier .env.local à la racine du projet
  □ Ajoutez vos variables d'environnement
  □ Regardez le fichier .env.local.example pour le format

Problème: Erreur "Column already exists"
Solution:
  □ C'est normal si les tables existent déjà
  □ Les migrations sont écrites avec "CREATE TABLE IF NOT EXISTS"
  □ Vous pouvez réexécuter les scripts en toute sécurité

Problème: Erreur de connexion à Supabase
Solution:
  □ Vérifiez votre NEXT_PUBLIC_SUPABASE_URL
  □ Assurez-vous d'avoir accès à Internet
  □ Vérifiez que votre clé n'a pas expiré

Problème: Les tables ne sont pas créées
Solution:
  □ Vérifiez que vous avez exécuté les 3 fichiers .sql dans l'ordre
  □ Vérifiez qu'il n'y a pas d'erreurs dans la console
  □ Consultez scripts/RESTORE_GUIDE.md pour plus d'aide

═══════════════════════════════════════════════════════════════════════════════

✅ RESTAURATION COMPLÈTE!
═══════════════════════════════════════════════════════════════════════════════

Si vous avez coché tous les points de cette checklist, félicitations!
Votre base de données Milele4Ever a été restaurée avec succès!

Pour plus d'aide:
  - scripts/RESTORE_GUIDE.md    - Guide détaillé
  - scripts/README.md           - Vue d'ensemble
  - BACKUP_SETUP.txt           - Résumé du système

Besoin d'aide supplémentaire? Consultez la documentation ou contactez le support.
