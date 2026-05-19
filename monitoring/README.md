# Monitoring production - Milele4Ever

Objectif: avoir une surveillance simple, actionnable, et rapide a mettre en place.

## 0) Documentation equipe

Documentation complete formation + operations:

- monitoring/DOCUMENTATION-COMPLETE-EQUIPE.md
- monitoring/FORMATION-LIVE-90MIN.md
- monitoring/QUIZ-EQUIPE.md
- monitoring/CHECKLIST-COMPETENCES.md
- monitoring/KIT-PRESENTATEUR.md
- monitoring/SLIDES-FORMATION.md
- monitoring/SCRIPT-ORAL-90MIN.md
- monitoring/FEUILLE-EMARGEMENT.md
- monitoring/PACK-PARTICIPANT.md
- monitoring/QUIZ-PARTICIPANT.md
- monitoring/PLAN-J1-J7-J30.md

## 1) Vercel - checklist quotidienne (5 min)

- Ouvrir Dashboard Vercel > Project > Observability.
- Verifier:
  - Error rate (Functions + Edge)
  - p95 latency
  - Requests volume
- Ouvrir Logs:
  - filtre level=error
  - filtre path contains /api/feedback
  - verifier les erreurs repetitives (meme message > 3 fois)

### Seuils conseilles

- Disponibilite: >= 99.9%
- Error rate: < 1%
- API p95: < 1200 ms
- 5xx route API: <= 3 sur 15 min

## 2) UptimeRobot (ou equivalent) - configuration en 5 min

Creer 5 monitors HTTP(s), intervalle 5 minutes, timeout 30 secondes:

1. https://www.milele4ever.com
2. https://www.milele4ever.com/espace
3. https://www.milele4ever.com/services
4. https://www.milele4ever.com/aion
5. https://www.milele4ever.com/api/feedback/list

Alerting recommande:

- Email + mobile push
- Alerte immediate apres 2 echecs consecutifs
- Alerte recovery activee

## 3) Routine post-deploiement (24h)

A T+0, T+1h, T+4h, T+8h, T+24h:

- lancer scripts/monitor-prod.ps1
- verifier Logs Vercel (errors + latence)
- noter resultats dans un ticket court

Template note rapide:

- Timestamp:
- Error rate:
- p95 latency:
- Routes KO:
- Action prise:

## 4) Playbook incident simple

Si une route critique est KO:

1. Confirmer avec scripts/monitor-prod.ps1
2. Ouvrir Vercel Logs sur la route
3. Identifier la derniere release
4. Si erreur critique: rollback vers deployment precedent
5. Revalider les 5 routes

## 5) Commandes utiles

Smoke test local rapide:

- powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod.ps1

Vercel CLI:

- npx vercel ls
- npx vercel logs https://www.milele4ever.com --since 1h

## 6) Tache planifiee Windows (toutes les 5 min)

Installer la tache:

- powershell -ExecutionPolicy Bypass -File ./scripts/register-monitor-task.ps1

Verifier la tache:

- Get-ScheduledTask -TaskName "Milele-Prod-Monitor"

Verifier le dernier resultat:

- Get-ScheduledTaskInfo -TaskName "Milele-Prod-Monitor"

Voir les logs du script:

- Get-Content .\monitoring\monitor-prod.log -Tail 50

Supprimer la tache:

- powershell -ExecutionPolicy Bypass -File ./scripts/unregister-monitor-task.ps1

## 7) Historique JSON horodate

Script dedie:

- powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod-json.ps1
- powershell -ExecutionPolicy Bypass -File ./scripts/monitor-report-24h.ps1

Fichiers produits:

- monitoring/history/monitor-history.jsonl (1 ligne JSON par execution)
- monitoring/history/monitor-last.json (dernier snapshot complet)

Installer une tache planifiee qui utilise le mode JSON:

- powershell -ExecutionPolicy Bypass -File ./scripts/register-monitor-task.ps1 -TaskName "Milele-Prod-Monitor-Json" -MonitorScriptPath ".\\scripts\\monitor-prod-json.ps1" -LogPath ".\\monitoring\\monitor-prod-json.log"

Supprimer cette variante:

- powershell -ExecutionPolicy Bypass -File ./scripts/unregister-monitor-task.ps1 -TaskName "Milele-Prod-Monitor-Json"

## 8) Export vers Smartsheet

Le script push-monitor-to-smartsheet.ps1 utilise un mode incremental par defaut
via un state file local pour eviter les doublons et reduire la charge API.

State file par defaut:

- monitoring/history/smartsheet-push-state.json

Script dedie:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-smartsheet.ps1 -ApiToken "<TOKEN>" -SheetId "<SHEET_ID>"

Variables d'environnement (optionnel):

- SMARTSHEET_API_TOKEN
- SMARTSHEET_SHEET_ID

Si les variables sont definies:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-smartsheet.ps1

Colonnes requises dans la feuille Smartsheet (titres exacts):

1. Timestamp
2. RunId
3. GlobalStatus
4. FailedCount
5. URL
6. HTTPStatus
7. CheckResult
8. Error

Exemple fenetre 7 jours avec limite:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-smartsheet.ps1 -HoursBack 168 -MaxRows 1000

Forcer une resynchronisation complete:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-smartsheet.ps1 -ForceFullSync

## 9) Tache planifiee Smartsheet

Creation de la tache (credentials via variables d'environnement):

- powershell -ExecutionPolicy Bypass -File ./scripts/register-smartsheet-push-task.ps1 -IntervalMinutes 15

Creation de la tache (credentials passes en parametres):

- powershell -ExecutionPolicy Bypass -File ./scripts/register-smartsheet-push-task.ps1 -IntervalMinutes 15 -ApiToken "<TOKEN>" -SheetId "<SHEET_ID>"

Demarrer manuellement une execution:

- Start-ScheduledTask -TaskName "Milele-Smartsheet-Push"

Verifier la tache:

- Get-ScheduledTask -TaskName "Milele-Smartsheet-Push"
- Get-ScheduledTaskInfo -TaskName "Milele-Smartsheet-Push"

Consulter le log:

- Get-Content .\monitoring\smartsheet-push.log -Tail 50

Supprimer la tache:

- powershell -ExecutionPolicy Bypass -File ./scripts/unregister-smartsheet-push-task.ps1

## 10) Export Excel (sans Smartsheet)

Si tu n'as pas de licence Smartsheet, utilise l'export CSV ouvrable dans Excel.

Script dedie:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-excel.ps1

Fichiers produits:

- monitoring/history/monitor-excel.csv
- monitoring/history/excel-push-state.json

Exemple fenetre 7 jours avec limite:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-excel.ps1 -HoursBack 168 -MaxRows 1000

Forcer une resynchronisation complete:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-excel.ps1 -ForceFullSync

Installer une tache planifiee Excel (toutes les 15 minutes):

- powershell -ExecutionPolicy Bypass -File ./scripts/register-excel-push-task.ps1 -IntervalMinutes 15

Demarrer manuellement une execution:

- Start-ScheduledTask -TaskName "Milele-Excel-Push"

Verifier la tache:

- Get-ScheduledTask -TaskName "Milele-Excel-Push"
- Get-ScheduledTaskInfo -TaskName "Milele-Excel-Push"

Consulter le log:

- Get-Content .\monitoring\excel-push.log -Tail 50

Supprimer la tache:

- powershell -ExecutionPolicy Bypass -File ./scripts/unregister-excel-push-task.ps1
