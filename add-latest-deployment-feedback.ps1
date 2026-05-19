# Ce script PowerShell extrait le dernier résumé de déploiement et l'ajoute automatiquement comme feedback "corrigé" dans Vercel Blob.
# À placer dans le dossier racine du projet et à exécuter après chaque déploiement (ou à intégrer dans le pipeline CI/CD)

$deploymentsPath = "feedback_deployments.json"
if (!(Test-Path $deploymentsPath)) {
    Write-Error "Fichier $deploymentsPath introuvable."
    exit 1
}

# Lire le dernier déploiement
$deployments = Get-Content $deploymentsPath | ConvertFrom-Json
$lastDeployment = $deployments | Sort-Object date -Descending | Select-Object -First 1

if (-not $lastDeployment) {
    Write-Error "Aucun déploiement trouvé."
    exit 1
}

# Préparer le feedback
$body = @{
    name = "Système"
    type = "autre"
    message = "$($lastDeployment.title) : $($lastDeployment.details)"
    date = $lastDeployment.date
    status = "done"
    note = $lastDeployment.note
}
$json = $body | ConvertTo-Json -Compress
$bytes = [System.Text.Encoding]::UTF8.GetBytes($json)

# Envoyer le feedback
try {
    $response = Invoke-WebRequest -Uri "https://www.milele4ever.com/api/feedback" -Method Post -Body $bytes -ContentType "application/json; charset=utf-8" -UseBasicParsing
    Write-Host "Feedback de déploiement ajouté : $($response.Content)"
} catch {
    Write-Error $_.Exception.Message
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Error $reader.ReadToEnd()
    }
    exit 1
}
