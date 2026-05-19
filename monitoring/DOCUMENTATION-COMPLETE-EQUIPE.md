# Documentation Complete - Monitoring, Exploitation et Formation Equipe

## 1. Objectif du document

Ce document sert de reference unique pour:

- former les nouveaux membres de l'equipe
- executer les operations quotidiennes
- gerer les incidents et escalades
- maintenir un niveau de performance et de disponibilite eleve
- standardiser les pratiques entre equipes (technique, ops, support)

## 2. Portee du monitoring

Routes critiques surveillees:

1. https://www.milele4ever.com
2. https://www.milele4ever.com/espace
3. https://www.milele4ever.com/services
4. https://www.milele4ever.com/aion
5. https://www.milele4ever.com/api/feedback/list

Objectifs SLO recommandes:

- Disponibilite: >= 99.9%
- Error rate: < 1%
- p95 API: < 1200 ms
- 5xx sur route critique: <= 3 erreurs / 15 min

## 3. Architecture operationnelle

Flux simplifie:

1. Le script de health-check appelle les routes critiques.
2. Les resultats sont ecrits dans un historique JSONL local.
3. Un snapshot "dernier etat" est maintenu en JSON.
4. Un script de reporting calcule la sante 24h.
5. Un export Smartsheet ou Excel peut pousser les donnees pour analyse business/equipe.
6. Les taches planifiees Windows automatisent l'execution.

Composants scripts:

- scripts/monitor-prod.ps1: smoke test simple
- scripts/monitor-prod-json.ps1: checks + historique JSON
- scripts/monitor-report-24h.ps1: rapport KPI sur 24h
- scripts/push-monitor-to-smartsheet.ps1: export API Smartsheet (mode incremental)
- scripts/push-monitor-to-excel.ps1: export CSV Excel (mode incremental)
- scripts/register-monitor-task.ps1: creation tache health-check
- scripts/unregister-monitor-task.ps1: suppression tache health-check
- scripts/register-smartsheet-push-task.ps1: creation tache push Smartsheet
- scripts/unregister-smartsheet-push-task.ps1: suppression tache push Smartsheet
- scripts/register-excel-push-task.ps1: creation tache export Excel
- scripts/unregister-excel-push-task.ps1: suppression tache export Excel

## 4. Fichiers et donnees

Emplacements:

- monitoring/history/monitor-history.jsonl: historique des runs
- monitoring/history/monitor-last.json: dernier snapshot
- monitoring/history/smartsheet-push-state.json: etat de sync incremental Smartsheet
- monitoring/history/excel-push-state.json: etat de sync incremental Excel
- monitoring/history/monitor-excel.csv: export Excel (ouvrable directement)
- monitoring/monitor-prod.log: log tache health-check
- monitoring/monitor-prod-json.log: log tache JSON
- monitoring/smartsheet-push.log: log export Smartsheet
- monitoring/excel-push.log: log export Excel

Bonnes pratiques:

- conserver l'historique JSONL comme source d'audit
- ne jamais stocker de token dans un fichier versionne
- utiliser variables d'environnement pour credentials

## 5. Runbook quotidien (operateur)

Checklist matin (5-10 min):

1. Verifier que les taches planifiees sont en etat Ready.
2. Verifier les 50 dernieres lignes de logs.
3. Executer le rapport 24h.
4. Verifier erreurs Vercel (Error Logs + Functions).
5. Verifier la tendance de latence p95.

Commandes utiles:

- powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod.ps1
- powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod-json.ps1
- powershell -ExecutionPolicy Bypass -File ./scripts/monitor-report-24h.ps1
- Get-ScheduledTask -TaskName "Milele-Prod-Monitor"
- Get-ScheduledTaskInfo -TaskName "Milele-Prod-Monitor"
- Get-ScheduledTask -TaskName "Milele-Prod-Monitor-Json"
- Get-ScheduledTaskInfo -TaskName "Milele-Prod-Monitor-Json"

## 6. Incident management (playbook)

### 6.1 Detection

Declencheur incident si:

- route critique KO sur 2 checks consecutifs
- hausse continue des 5xx
- p95 depasse le seuil SLO sur periode prolongee

### 6.2 Reponse immediate

1. Confirmer avec scripts/monitor-prod.ps1.
2. Verifier logs Vercel sur la route impactee.
3. Identifier la release la plus recente et la comparer a la precedente.
4. Si regression claire: rollback.
5. Revalider les 5 routes.

### 6.3 Escalade

- P1: site indisponible / route coeur indisponible
- P2: degradation severe mais partielle
- P3: anomalie mineure, contournement possible

Informations minimales a partager:

- timestamp debut incident
- impact utilisateur
- endpoint/route affecte(e)
- cause probable
- action immediate
- ETA de resolution

## 7. Performance et capacite

Principes:

- preferer monitoring regulier et leger plutot que checks lourds
- limiter les pushes Smartsheet/Excel aux deltas increments
- conserver des logs lisibles et exploitables

Optimisations deja en place:

- export Smartsheet incremental via state file
- deduplication locale des lignes avant push
- envoi API par paquets (chunking)

A surveiller chaque semaine:

- volumetrie des lignes JSONL
- temps moyen d'execution des scripts
- erreurs Smartsheet (quota / auth / schema)
- verrouillage fichier CSV Excel (si le fichier est ouvert pendant l'export)

## 8. Smartsheet - standard equipe

Prerequis feuille:

1. Timestamp
2. RunId
3. GlobalStatus
4. FailedCount
5. URL
6. HTTPStatus
7. CheckResult
8. Error

Execution manuelle:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-smartsheet.ps1 -ApiToken "<TOKEN>" -SheetId "<SHEET_ID>"

Execution avec variables d'environnement:

- SMARTSHEET_API_TOKEN
- SMARTSHEET_SHEET_ID
- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-smartsheet.ps1

Important:

- ne pas partager le token dans Teams/Slack/email
- rotation token tous les 90 jours recommandee

## 8.bis Excel - standard equipe (sans licence Smartsheet)

Execution manuelle:

- powershell -ExecutionPolicy Bypass -File ./scripts/push-monitor-to-excel.ps1

Fichiers utilises:

- monitoring/history/monitor-excel.csv
- monitoring/history/excel-push-state.json

Automatisation (tache planifiee):

- powershell -ExecutionPolicy Bypass -File ./scripts/register-excel-push-task.ps1 -IntervalMinutes 15

Important:

- fermer le CSV dans Excel pendant l'ecriture automatique
- utiliser un second fichier Excel (pivot/dashboard) connecte au CSV si besoin de lecture continue

## 9. Security et conformite

Regles minimales:

- credentials via variables d'environnement
- aucun secret dans git
- acces admin limite a l'equipe autorisee
- revue periodique des permissions

Controles mensuels:

1. verifier absence de secret dans repository
2. verifier rotation token Smartsheet
3. verifier taches planifiees actives et conformes
4. verifier que les logs ne contiennent pas de donnees sensibles

## 10. Formation equipe (programme)

### Module 1 - Fondamentaux (45 min)

- architecture du monitoring
- objectifs SLO/SLA
- roles et responsabilites

### Module 2 - Operations (60 min)

- execution scripts
- lecture logs
- interpretation rapport 24h

### Module 3 - Incident response (60 min)

- simulation panne route /api
- decision rollback
- communication incident

### Module 4 - Smartsheet et reporting (45 min)

- push manuel et automatise
- verification schema colonnes
- lecture dashboards equipe

### Module 5 - Security (30 min)

- gestion des credentials
- hygiene repository
- controles periodiques

## 11. Exercices de formation (pratiques)

Exercice A - Smoke test:

- lancer monitor-prod.ps1
- identifier statut global
- expliquer action en cas de FAIL

Exercice B - Historique:

- lancer monitor-prod-json.ps1
- verifier monitor-history.jsonl et monitor-last.json

Exercice C - KPI:

- lancer monitor-report-24h.ps1
- presenter uptime, runs OK/FAIL, interpretation

Exercice D - Smartsheet:

- configurer token + sheet id
- pousser les donnees
- verifier lignes dans la feuille

Exercice E - Incident simulation:

- route en echec (scenario simulate)
- appliquer playbook complet
- produire un mini postmortem

## 12. RACI simplifie

- Owner plateforme: valide architecture et priorites
- Operateur monitoring: execute checks quotidiens
- Dev on-call: corrige incidents techniques
- Team lead: arbitre escalade et communication
- PM/Stakeholder: suit impact metier

## 13. KPI de pilotage equipe

KPI exploitation:

- uptime 24h, 7j, 30j
- MTTR (mean time to recovery)
- taux d'incidents repetitifs
- delai de detection

KPI qualite procedure:

- taux de runbook suivi
- taux de postmortem produits
- taux de faux positifs alertes

## 14. Plan d'amelioration continue

Cadence:

- hebdomadaire: revue incidents + quick wins
- mensuelle: revue SLO + securite + performance
- trimestrielle: refonte process et dette technique

Backlog recommande:

1. dashboard auto (Power BI/Looker/Smartsheet dashboard)
2. enrichissement metriques latence par route
3. alerting multi-canal standardise
4. tests de chaos legers en preprod

## 15. FAQ rapide

Q: Pourquoi status 267009 sur une tache planifiee?
A: Tache declenchee de maniere asynchrone, pas forcement une erreur finale.

Q: Pourquoi ne pas pousser tout l'historique a chaque fois?
A: cout API et duplication. Le mode incremental est plus performant.

Q: Que faire si Smartsheet refuse une colonne?
A: verifier titres exacts et types de colonnes, puis relancer.

## 16. Annexes

Fichiers de reference:

- monitoring/README.md
- monitoring/DOCUMENTATION-COMPLETE-EQUIPE.md
- scripts/monitor-prod.ps1
- scripts/monitor-prod-json.ps1
- scripts/monitor-report-24h.ps1
- scripts/push-monitor-to-smartsheet.ps1
- scripts/register-monitor-task.ps1
- scripts/register-smartsheet-push-task.ps1

Versionning document:

- Version: 1.0
- Date: 2026-04-21
- Proprietaire: Equipe Milele
