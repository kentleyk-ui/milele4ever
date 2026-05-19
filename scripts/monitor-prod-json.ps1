param(
  [string[]]$Urls = @(
    "https://www.milele4ever.com",
    "https://www.milele4ever.com/espace",
    "https://www.milele4ever.com/services",
    "https://www.milele4ever.com/aion",
    "https://www.milele4ever.com/api/feedback/list"
  ),
  [string]$HistoryFile = ".\monitoring\history\monitor-history.jsonl",
  [string]$LastFile = ".\monitoring\history\monitor-last.json",
  [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Stop"

if ($TimeoutSeconds -lt 5) {
  throw "TimeoutSeconds doit etre >= 5"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$historyPath = Join-Path $projectRoot $HistoryFile
$lastPath = Join-Path $projectRoot $LastFile

$historyDir = Split-Path -Parent $historyPath
$lastDir = Split-Path -Parent $lastPath

if (-not (Test-Path $historyDir)) {
  New-Item -ItemType Directory -Path $historyDir -Force | Out-Null
}

if (-not (Test-Path $lastDir)) {
  New-Item -ItemType Directory -Path $lastDir -Force | Out-Null
}

$headers = @{
  "User-Agent" = "Milele-Prod-Monitor-Json/1.0"
}

$timestamp = [DateTimeOffset]::Now.ToString("o")
$runId = [guid]::NewGuid().ToString()

$checks = foreach ($url in $Urls) {
  $statusCode = 0
  $result = "FAIL"
  $errorMessage = $null

  try {
    $response = Invoke-WebRequest -Uri $url -Method Get -Headers $headers -TimeoutSec $TimeoutSeconds -MaximumRedirection 5 -UseBasicParsing
    $statusCode = [int]$response.StatusCode
    $result = if ($statusCode -ge 200 -and $statusCode -lt 400) { "OK" } else { "FAIL" }
  }
  catch {
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }
    $errorMessage = $_.Exception.Message
  }

  [ordered]@{
    url = $url
    statusCode = $statusCode
    result = $result
    error = $errorMessage
    timestamp = $timestamp
  }
}

$failed = @($checks | Where-Object { $_.result -ne "OK" })
$snapshot = [ordered]@{
  runId = $runId
  timestamp = $timestamp
  total = $checks.Count
  failed = $failed.Count
  status = if ($failed.Count -eq 0) { "OK" } else { "FAIL" }
  checks = @($checks)
}

$jsonLine = $snapshot | ConvertTo-Json -Depth 6 -Compress
Add-Content -Path $historyPath -Value $jsonLine
($snapshot | ConvertTo-Json -Depth 6) | Set-Content -Path $lastPath

Write-Host "Historique monitoring mis a jour." -ForegroundColor Green
Write-Host "RunId: $runId"
Write-Host "Status: $($snapshot.status)"
Write-Host "Failed: $($snapshot.failed) / $($snapshot.total)"
Write-Host "History: $historyPath"
Write-Host "Last: $lastPath"

if ($failed.Count -gt 0) {
  exit 1
}

exit 0
