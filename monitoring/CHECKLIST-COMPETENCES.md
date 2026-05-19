# Checklist Competences - Validation Equipe

## Niveau attendu

- A valider: 12/15 criteres minimum
- Validation finale: Team lead

## Grille (Oui/Non)

### Bloc A - Execution

1. Lance monitor-prod.ps1 sans assistance
2. Lance monitor-prod-json.ps1 sans assistance
3. Lance monitor-report-24h.ps1 et explique les chiffres
4. Lit correctement monitor-history.jsonl
5. Identifie l'emplacement des logs monitoring

### Bloc B - Diagnostic

6. Identifie une route en echec dans la sortie script
7. Distingue erreur applicative et erreur reseau
8. Sait retrouver les logs Vercel utiles
9. Explique quand faire rollback
10. Revalide correctement apres correction

### Bloc C - Reporting

11. Execute un push Smartsheet manuel
12. Explique le role du state file incremental
13. Verifie une tache planifiee et son statut
14. Sait supprimer/recreer une tache planifiee
15. Sait documenter un mini postmortem

## Decision

- 12-13: operationnel supervise
- 14-15: autonome
- <12: renforcer via coaching cible

## Plan de progression (si <12)

- Refaire modules 2 et 3
- Simuler 2 incidents supplementaires
- Revalider sous 7 jours
