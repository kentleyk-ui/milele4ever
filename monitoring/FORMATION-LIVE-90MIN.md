# Formation Live Equipe - 90 minutes

## Objectif

Former l'equipe a exploiter, surveiller, depanner et faire evoluer le systeme de monitoring Milele en autonomie.

## Public cible

- Operateurs monitoring
- Developpeurs on-call
- Team lead / support technique

## Prerequis

- Acces au projet local
- Acces Vercel projet production
- PowerShell disponible
- Connaissance de base HTTP (codes 2xx, 4xx, 5xx)

## Plan minute par minute

### 0-10 min - Contexte et objectifs

1. Expliquer les SLO cibles:
   - Disponibilite >= 99.9%
   - Error rate < 1%
   - p95 API < 1200 ms
2. Montrer les routes critiques surveillees.
3. Expliquer la difference entre smoke check, historique JSON, reporting et export Smartsheet.

### 10-25 min - Demo monitoring de base

1. Lancer:
   powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod.ps1
2. Lire le resultat et interpreter OK/FAIL.
3. Expliquer quoi faire si une route est en echec.

### 25-40 min - Historique JSON et traçabilite

1. Lancer:
   powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod-json.ps1
2. Ouvrir:
   - monitoring/history/monitor-history.jsonl
   - monitoring/history/monitor-last.json
3. Expliquer runId, timestamp, checks, statut global.

### 40-55 min - Rapport KPI 24h

1. Lancer:
   powershell -ExecutionPolicy Bypass -File ./scripts/monitor-report-24h.ps1
2. Lire:
   - Runs total
   - Runs OK
   - Runs FAIL
   - Uptime
3. Expliquer interpretation metier et seuil d'alerte.

### 55-70 min - Incident response (simulation)

Scenario: une route critique repond 500.

1. Confirmer avec monitor-prod.ps1.
2. Ouvrir logs Vercel sur la route.
3. Identifier si regression recente.
4. Decision: rollback ou correction directe.
5. Revalidation des 5 routes.

### 70-80 min - Smartsheet et reporting equipe

1. Presenter le schema de colonnes Smartsheet.
2. Lancer push manuel.
3. Expliquer mode incremental et state file:
   monitoring/history/smartsheet-push-state.json
4. Presenter automatisation via tache planifiee.

### 80-90 min - Quiz + validation competences

1. Faire passer le quiz:
   monitoring/QUIZ-EQUIPE.md
2. Evaluer avec grille:
   monitoring/CHECKLIST-COMPETENCES.md
3. Definir actions de renforcement pour les points faibles.

## Rituels post-formation

- Daily 5 minutes: verif taches + rapport rapide
- Hebdo 30 minutes: revue incidents et KPI
- Mensuel 60 minutes: revue process, securite, optimisation

## Sorties attendues de la session

- Equipe autonome sur les checks et le premier diagnostic
- Procedure d'incident comprise et appliquee
- Reporting equipe compris (local + Smartsheet)
- Niveau minimal valide pour astreinte technique
