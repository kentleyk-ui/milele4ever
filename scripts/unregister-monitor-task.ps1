param(
  [string]$TaskName = "Milele-Prod-Monitor"
)

$ErrorActionPreference = "Stop"

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "Aucune tache nommee '$TaskName' a supprimer."
  exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Tache planifiee supprimee: $TaskName" -ForegroundColor Yellow
