# Quiz Equipe - Monitoring Milele

## Consignes

- Duree: 15 minutes
- Score cible: 80% minimum
- Format: 10 questions

## Questions

1. Quelle commande execute un smoke test rapide de production?

2. Quels sont les 2 fichiers JSON generes par le monitoring historise?

3. Si une route critique est KO, quelle est la premiere action?

4. Que signifie un uptime 24h de 99.2% par rapport a l'objectif 99.9%?

5. Quelles colonnes sont obligatoires dans la feuille Smartsheet?

6. A quoi sert le fichier monitoring/history/smartsheet-push-state.json?

7. Que faire si push-monitor-to-smartsheet.ps1 retourne ApiToken manquant?

8. Quelle commande affiche l'etat d'une tache planifiee Windows?

9. Quelle difference entre monitor-prod.ps1 et monitor-prod-json.ps1?

10. Donne la sequence minimale de reponse incident (4 etapes).

## Corrige rapide

1. powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod.ps1
2. monitoring/history/monitor-history.jsonl et monitoring/history/monitor-last.json
3. Confirmer l'echec via le script de monitoring
4. C'est en-dessous de l'objectif, action corrective necessaire
5. Timestamp, RunId, GlobalStatus, FailedCount, URL, HTTPStatus, CheckResult, Error
6. Eviter les doublons via sync incremental
7. Fournir -ApiToken ou definir SMARTSHEET_API_TOKEN
8. Get-ScheduledTask -TaskName <NomTache>
9. Le second ecrit l'historique JSON, le premier fait un check simple
10. Confirmer, diagnostiquer logs, corriger/rollback, revalider
