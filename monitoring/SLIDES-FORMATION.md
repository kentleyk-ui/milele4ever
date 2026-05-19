# Slides Formation Monitoring Milele

## Slide 1 - Titre

Formation Monitoring & Exploitation
Milele - Session Equipe (90 min)

## Slide 2 - Objectifs

- Comprendre le monitoring cible
- Executer les scripts critiques
- Reagir a un incident route critique
- Maitriser le reporting local + Smartsheet

## Slide 3 - SLO cibles

- Disponibilite >= 99.9%
- Error rate < 1%
- p95 API < 1200 ms
- 5xx <= 3 / 15 min

## Slide 4 - Routes critiques

1. /
2. /espace
3. /services
4. /aion
5. /api/feedback/list

## Slide 5 - Architecture monitoring

- Check prod simple
- Check prod historise JSON
- Rapport KPI 24h
- Export Smartsheet incremental
- Taches planifiees Windows

## Slide 6 - Demo 1 (Smoke test)

Commande:

powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod.ps1

## Slide 7 - Demo 2 (Historique JSON)

Commande:

powershell -ExecutionPolicy Bypass -File ./scripts/monitor-prod-json.ps1

Fichiers:

- monitoring/history/monitor-history.jsonl
- monitoring/history/monitor-last.json

## Slide 8 - Demo 3 (Rapport 24h)

Commande:

powershell -ExecutionPolicy Bypass -File ./scripts/monitor-report-24h.ps1

## Slide 9 - Incident workflow

1. Confirmer l'echec
2. Lire logs Vercel
3. Identifier regression
4. Corriger ou rollback
5. Revalider

## Slide 10 - Smartsheet

- Colonnes requises
- Push manuel
- Push incremental
- Etat de sync local

## Slide 11 - Evaluation

- Quiz equipe
- Checklist competences
- Score cible >= 80%

## Slide 12 - Prochaines actions

- Daily check 5 min
- Revue hebdo incidents
- Revue mensuelle performance + securite
