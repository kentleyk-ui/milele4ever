param(
  [Parameter(Mandatory = $false)]
  [string]$ApiToken = $env:SMARTSHEET_API_TOKEN,

  [Parameter(Mandatory = $false)]
  [string]$SheetId = $env:SMARTSHEET_SHEET_ID,

  [string]$HistoryFile = ".\monitoring\history\monitor-history.jsonl",
  [string]$StateFile = ".\monitoring\history\smartsheet-push-state.json",
  [int]$HoursBack = 24,
  [int]$MaxRows = 500,
  [switch]$ForceFullSync
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($ApiToken)) {
  throw "ApiToken manquant. Passe -ApiToken ou definis SMARTSHEET_API_TOKEN."
}

if ([string]::IsNullOrWhiteSpace($SheetId)) {
  throw "SheetId manquant. Passe -SheetId ou definis SMARTSHEET_SHEET_ID."
}

if ($HoursBack -lt 1) {
  throw "HoursBack doit etre >= 1"
}

if ($MaxRows -lt 1) {
  throw "MaxRows doit etre >= 1"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$historyPath = Join-Path $projectRoot $HistoryFile
$statePath = Join-Path $projectRoot $StateFile

if (-not (Test-Path $historyPath)) {
  throw "Fichier introuvable: $historyPath"
}

$stateDir = Split-Path -Parent $statePath
if (-not (Test-Path $stateDir)) {
  New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
}

$headers = @{
  "Authorization" = "Bearer $ApiToken"
  "Content-Type"  = "application/json"
}

$baseUrl = "https://api.smartsheet.com/2.0"

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

function Get-ColumnMap {
  param(
    [string]$Url,
    [hashtable]$ReqHeaders
  )

  $sheet = Invoke-RestMethod -Method Get -Uri $Url -Headers $ReqHeaders

  $requiredTitles = @(
    "Timestamp",
    "RunId",
    "GlobalStatus",
    "FailedCount",
    "URL",
    "HTTPStatus",
    "CheckResult",
    "Error"
  )

  $map = @{}
  foreach ($title in $requiredTitles) {
    $column = $sheet.columns | Where-Object { $_.title -eq $title } | Select-Object -First 1
    if (-not $column) {
      throw "Colonne Smartsheet manquante: '$title'. Cree la colonne dans la feuille puis relance."
    }
    $map[$title] = $column.id
  }

  return $map
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

function Convert-ToSmartsheetRows {
  param(
    [array]$Records,
    [hashtable]$ColumnMap
  )

  $rows = @()
  foreach ($r in $Records) {
    $cells = @(
      @{ columnId = $ColumnMap["Timestamp"]; value = $r.Timestamp },
      @{ columnId = $ColumnMap["RunId"]; value = $r.RunId },
      @{ columnId = $ColumnMap["GlobalStatus"]; value = $r.GlobalStatus },
      @{ columnId = $ColumnMap["FailedCount"]; value = $r.FailedCount },
      @{ columnId = $ColumnMap["URL"]; value = $r.URL },
      @{ columnId = $ColumnMap["HTTPStatus"]; value = $r.HTTPStatus },
      @{ columnId = $ColumnMap["CheckResult"]; value = $r.CheckResult },
      @{ columnId = $ColumnMap["Error"]; value = $r.Error }
    )

    $rows += @{ toBottom = $true; cells = $cells }
  }

  return $rows
}

$since = (Get-Date).AddHours(-$HoursBack)
$sheetUrl = "$baseUrl/sheets/$SheetId"
$addRowsUrl = "$baseUrl/sheets/$SheetId/rows"

$syncState = Get-SyncState -Path $statePath

$columnMap = Get-ColumnMap -Url $sheetUrl -ReqHeaders $headers
$historyResult = Read-HistoryRows -Path $historyPath -Since $since -Limit $MaxRows -FullSync:$ForceFullSync -SyncState $syncState
$records = @($historyResult.Records)

if ($records.Count -eq 0) {
  Write-Host "Aucune ligne a envoyer (fenetre ${HoursBack}h)." -ForegroundColor Yellow
  exit 0
}

$rows = Convert-ToSmartsheetRows -Records $records -ColumnMap $columnMap

$chunkSize = 200
$sent = 0

for ($i = 0; $i -lt $rows.Count; $i += $chunkSize) {
  $chunk = @($rows[$i..([Math]::Min($i + $chunkSize - 1, $rows.Count - 1))])
  $payload = $chunk | ConvertTo-Json -Depth 8
  $response = Invoke-RestMethod -Method Post -Uri $addRowsUrl -Headers $headers -Body $payload
  $sent += $chunk.Count

  if (-not $response.resultCode -or $response.resultCode -ne 0) {
    throw "Echec API Smartsheet pendant l'envoi des lignes."
  }
}

Write-Host "Push Smartsheet termine." -ForegroundColor Green
Write-Host "Lignes envoyees: $sent"
Write-Host "Fenetre: ${HoursBack}h"
Write-Host "Feuille: $SheetId"

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
