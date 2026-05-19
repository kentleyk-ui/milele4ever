# Script Oral - Formation 90 min

## 0-10 min - Cadrage

Message d'ouverture:

"Le but est simple: en fin de session, vous devez etre autonomes pour detecter, diagnostiquer et escalader correctement un probleme prod."

Points a dire:

- Pourquoi on monitor
- Risque metier d'une indisponibilite
- SLO et niveau d'exigence

## 10-25 min - Monitoring de base

Dire:

"On commence par le test le plus rapide pour valider que les routes vitales repondent."

Action live:

powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod.ps1

Debrief:

- Que signifie un FAIL
- Quand reexecuter
- Quand escalader

## 25-40 min - Historique JSON

Dire:

"Un check ponctuel ne suffit pas: on veut une trace exploitable dans le temps."

Action live:

powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod-json.ps1

Montrer:

- monitor-history.jsonl
- monitor-last.json

## 40-55 min - KPI 24h

Dire:

"Le pilotage se fait sur tendance, pas sur un snapshot."

Action live:

powershell -ExecutionPolicy Bypass -File ./scripts/monitor-report-24h.ps1

Questions au groupe:

- Que feriez-vous avec uptime < 99.9%?
- Quel seuil d'alerte vous jugez critique?

## 55-70 min - Incident simulation

Scenario a raconter:

"La route /api/feedback/list retourne 500 depuis 8 minutes."

Sequence a faire faire:

1. Confirmer via script
2. Ouvrir logs
3. Identifier dernier changement
4. Decision rollback/correction
5. Revalidation complete

## 70-80 min - Smartsheet

Dire:

"On industrialise le reporting equipe sans recharger inutilement l'API."

Action live:

- Montrer le mode incremental
- Montrer le state file
- Lancer push manuel si token dispo

## 80-90 min - Evaluation et cloture

Action:

- Lancer quiz equipe
- Evaluer checklist competences

Cloture a dire:

"L'objectif n'est pas juste de savoir lancer une commande, mais de prendre une bonne decision rapidement en cas d'incident."
