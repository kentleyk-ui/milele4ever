# Plan d'Exploitation J+1 / J+7 / J+30

## Objectif

Structurer la stabilisation, le pilotage et l'industrialisation du monitoring production.

## J+1 - Stabilisation

1. Verifier les taches planifiees:
- Get-ScheduledTask -TaskName "Milele-Prod-Monitor-Json"
- Get-ScheduledTask -TaskName "Milele-Smartsheet-Push"

2. Verifier les logs:
- Get-Content .\monitoring\monitor-prod-json.log -Tail 50
- Get-Content .\monitoring\smartsheet-push.log -Tail 50

3. Verifier le rapport 24h:
- powershell -ExecutionPolicy Bypass -File .\scripts\monitor-report-24h.ps1

4. Verifier Smartsheet:
- nouvelles lignes recues
- schema colonnes conforme
- absence de doublons evidents

## J+7 - Pilotage

1. Revue KPI hebdo (30 min):
- uptime
- runs FAIL
- erreurs API
- latence percue

2. Revue incidents:
- causes racines
- actions correctives
- actions preventives

3. Ajustements:
- frequence des taches (5 min vs 15 min)
- seuils d'alerte
- priorisation backlog d'amelioration

4. Mini session equipe:
- quiz rapide
- validation checklist competences

## J+30 - Industrialisation

1. Revue SLO mensuelle:
- disponibilite >= 99.9%
- error rate < 1%
- p95 API < 1200 ms

2. Revue securite:
- rotation token Smartsheet
- verification absence secrets dans repo
- revue des acces operationnels

3. Revue process:
- mise a jour runbook
- retour d'experience equipe
- plan de formation continue

4. Decision d'echelle:
- maintenir architecture actuelle
- renforcer alerting/dashboard si volumetrie augmente

## Commandes de reference

1. Smoke test production:
- powershell -ExecutionPolicy Bypass -File .\scripts\monitor-prod.ps1

2. Monitoring historise JSON:
- powershell -ExecutionPolicy Bypass -File .\scripts\monitor-prod-json.ps1

3. Rapport 24h:
- powershell -ExecutionPolicy Bypass -File .\scripts\monitor-report-24h.ps1

4. Push Smartsheet:
- powershell -ExecutionPolicy Bypass -File .\scripts\push-monitor-to-smartsheet.ps1

## Liens utiles

- monitoring/README.md
- monitoring/DOCUMENTATION-COMPLETE-EQUIPE.md
- monitoring/KIT-PRESENTATEUR.md
- monitoring/PACK-PARTICIPANT.md
