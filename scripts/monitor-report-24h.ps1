param(
  [string]$HistoryFile = ".\monitoring\history\monitor-history.jsonl",
  [int]$HoursBack = 24
)

$ErrorActionPreference = "Stop"

if ($HoursBack -lt 1) {
  throw "HoursBack doit etre >= 1"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$historyPath = Join-Path $projectRoot $HistoryFile

if (-not (Test-Path $historyPath)) {
  throw "Fichier introuvable: $historyPath"
}

$since = [DateTimeOffset]::Now.AddHours(-$HoursBack)
$entries = @()

Get-Content $historyPath | ForEach-Object {
  if ([string]::IsNullOrWhiteSpace($_)) { return }

  try {
    $entry = $_ | ConvertFrom-Json
    $entryTime = [DateTimeOffset]::Parse([string]$entry.timestamp)
    if ($entryTime -lt $since) { return }
    $entries += $entry
  }
  catch {
    # ignore malformed lines
  }
}

if ($entries.Count -eq 0) {
  Write-Host "Aucun run sur les ${HoursBack} dernieres heures." -ForegroundColor Yellow
  exit 0
}

$totalRuns = $entries.Count
$failedRuns = @($entries | Where-Object { $_.failed -gt 0 -or $_.status -ne 'OK' }).Count
$availability = [math]::Round((($totalRuns - $failedRuns) / [double]$totalRuns) * 100, 2)
$allChecks = @($entries | ForEach-Object { $_.checks })
$failedChecks = @($allChecks | Where-Object { $_.result -ne 'OK' })
$byUrl = $allChecks | Group-Object url | ForEach-Object {
  $groupChecks = @($_.Group)
  $groupFailed = @($groupChecks | Where-Object { $_.result -ne 'OK' }).Count
  [PSCustomObject]@{
    Url = $_.Name
    Runs = $groupChecks.Count
    Failed = $groupFailed
    AvailabilityPct = [math]::Round((($groupChecks.Count - $groupFailed) / [double]$groupChecks.Count) * 100, 2)
  }
}

Write-Host "Rapport monitoring ${HoursBack}h" -ForegroundColor Cyan
Write-Host "Runs total: $totalRuns"
Write-Host "Runs en echec: $failedRuns"
Write-Host "Disponibilite globale: $availability%"
Write-Host "Checks KO: $($failedChecks.Count) / $($allChecks.Count)"
Write-Host "Dernier run: $([string]($entries[-1].timestamp))"
Write-Host ""
$byUrl | Sort-Object Url | Format-Table -AutoSize | Out-String | Write-Host

if ($failedChecks.Count -gt 0) {
  Write-Host "Derniers checks KO:" -ForegroundColor Yellow
  $failedChecks | Select-Object -Last 10 url, statusCode, result, error, timestamp | Format-Table -AutoSize | Out-String | Write-Host
}

exit 0
