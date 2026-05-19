param(
  [string]$HistoryFile = ".\monitoring\history\monitor-history.jsonl",
  [string]$StateFile = ".\monitoring\history\excel-push-state.json",
  [string]$OutputCsv = ".\monitoring\history\monitor-excel.csv",
  [int]$HoursBack = 24,
  [int]$MaxRows = 500,
  [switch]$ForceFullSync
)

$ErrorActionPreference = "Stop"

if ($HoursBack -lt 1) {
  throw "HoursBack doit etre >= 1"
}

if ($MaxRows -lt 1) {
  throw "MaxRows doit etre >= 1"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$historyPath = Join-Path $projectRoot $HistoryFile
$statePath = Join-Path $projectRoot $StateFile
$outputPath = Join-Path $projectRoot $OutputCsv

if (-not (Test-Path $historyPath)) {
  throw "Fichier introuvable: $historyPath"
}

$stateDir = Split-Path -Parent $statePath
if (-not (Test-Path $stateDir)) {
  New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
}

$outputDir = Split-Path -Parent $outputPath
if (-not (Test-Path $outputDir)) {
  New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

function Get-SyncState {
  param(
    [string]$Path
  )

  if (-not (Test-Path $Path)) {
    return [PSCustomObject]@{
      lastTimestamp = $null
      runIdsAtLastTimestamp = @()
      updatedAt = $null
    }
  }

  try {
    $state = Get-Content $Path -Raw | ConvertFrom-Json
    if (-not $state.runIdsAtLastTimestamp) {
      $state | Add-Member -NotePropertyName runIdsAtLastTimestamp -NotePropertyValue @() -Force
    }
    return $state
  }
  catch {
    return [PSCustomObject]@{
      lastTimestamp = $null
      runIdsAtLastTimestamp = @()
      updatedAt = $null
    }
  }
}

function Save-SyncState {
  param(
    [string]$Path,
    [datetimeoffset]$LastTimestamp,
    [string[]]$RunIds
  )

  $payload = [PSCustomObject]@{
    lastTimestamp = $LastTimestamp.ToString("o")
    runIdsAtLastTimestamp = @($RunIds)
    updatedAt = (Get-Date).ToString("o")
  }

  $payload | ConvertTo-Json -Depth 4 | Set-Content -Path $Path
}

function Read-HistoryRows {
  param(
    [string]$Path,
    [datetime]$Since,
    [int]$Limit,
    [switch]$FullSync,
    [object]$SyncState
  )

  $records = @()
  $latestTimestamp = $null
  $runIdsAtLatestTimestamp = @()

  $stateTimestamp = $null
  $stateRunIds = @()

  if (-not $FullSync -and $SyncState -and $SyncState.lastTimestamp) {
    try {
      $stateTimestamp = [DateTimeOffset]::Parse([string]$SyncState.lastTimestamp).UtcDateTime
      $stateRunIds = @($SyncState.runIdsAtLastTimestamp)
    }
    catch {
      $stateTimestamp = $null
      $stateRunIds = @()
    }
  }

  Get-Content $Path | ForEach-Object {
    if ([string]::IsNullOrWhiteSpace($_)) { return }

    try {
      $entry = $_ | ConvertFrom-Json
      $entryTime = [DateTimeOffset]::Parse([string]$entry.timestamp).UtcDateTime
      if ($entryTime -lt $Since.ToUniversalTime()) { return }

      if ($stateTimestamp) {
        if ($entryTime -lt $stateTimestamp) { return }
        if ($entryTime -eq $stateTimestamp -and $stateRunIds -contains [string]$entry.runId) { return }
      }

      if (-not $latestTimestamp -or $entryTime -gt $latestTimestamp) {
        $latestTimestamp = $entryTime
        $runIdsAtLatestTimestamp = @([string]$entry.runId)
      }
      elseif ($entryTime -eq $latestTimestamp) {
        if ($runIdsAtLatestTimestamp -notcontains [string]$entry.runId) {
          $runIdsAtLatestTimestamp += [string]$entry.runId
        }
      }

      foreach ($check in $entry.checks) {
        $records += [PSCustomObject]@{
          Timestamp    = [string]$entry.timestamp
          RunId        = [string]$entry.runId
          GlobalStatus = [string]$entry.status
          FailedCount  = [int]$entry.failed
          URL          = [string]$check.url
          HTTPStatus   = [string]$check.statusCode
          CheckResult  = [string]$check.result
          Error        = [string]$check.error
        }
      }
    }
    catch {
      # Ignore malformed lines
    }
  }

  $deduped = $records | Group-Object { "{0}|{1}|{2}" -f $_.Timestamp, $_.RunId, $_.URL } | ForEach-Object { $_.Group | Select-Object -First 1 }
  $sorted = $deduped | Sort-Object Timestamp
  if ($sorted.Count -gt $Limit) {
    $sorted = @($sorted | Select-Object -Last $Limit)
  }

  return [PSCustomObject]@{
    Records = @($sorted)
    LatestTimestamp = $latestTimestamp
    RunIdsAtLatestTimestamp = @($runIdsAtLatestTimestamp)
  }
}

$since = (Get-Date).AddHours(-$HoursBack)
$syncState = Get-SyncState -Path $statePath
$historyResult = Read-HistoryRows -Path $historyPath -Since $since -Limit $MaxRows -FullSync:$ForceFullSync -SyncState $syncState
$records = @($historyResult.Records)

if ($records.Count -eq 0) {
  Write-Host "Aucune ligne a exporter (fenetre ${HoursBack}h)." -ForegroundColor Yellow
  exit 0
}

$writeHeader = -not (Test-Path $outputPath)
$records | Export-Csv -Path $outputPath -NoTypeInformation -Encoding UTF8 -Append:(-not $writeHeader)

Write-Host "Export Excel termine." -ForegroundColor Green
Write-Host "Lignes exportees: $($records.Count)"
Write-Host "Fenetre: ${HoursBack}h"
Write-Host "Fichier CSV: $outputPath"

if ($historyResult.LatestTimestamp) {
  Save-SyncState -Path $statePath -LastTimestamp ([DateTimeOffset]$historyResult.LatestTimestamp) -RunIds $historyResult.RunIdsAtLatestTimestamp
  Write-Host "Etat sync: $statePath"
}

if ($ForceFullSync) {
  Write-Host "Mode: full sync" -ForegroundColor Yellow
} else {
  Write-Host "Mode: incremental sync" -ForegroundColor Cyan
}

exit 0