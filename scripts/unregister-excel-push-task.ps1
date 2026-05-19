param(
  [string]$TaskName = "Milele-Excel-Push"
)

$ErrorActionPreference = "Stop"

$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if (-not $existing) {
  Write-Host "Aucune tache nommee '$TaskName' a supprimer."
  exit 0
}

Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
Write-Host "Tache Excel supprimee: $TaskName" -ForegroundColor Yellow
