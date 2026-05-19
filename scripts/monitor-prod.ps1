param(
  [string[]]$Urls = @(
    "https://www.milele4ever.com",
    "https://www.milele4ever.com/espace",
    "https://www.milele4ever.com/services",
    "https://www.milele4ever.com/aion",
    "https://www.milele4ever.com/api/feedback/list"
  ),
  [int]$TimeoutSeconds = 30
)

$ErrorActionPreference = "Stop"

if ($TimeoutSeconds -lt 5) {
  throw "TimeoutSeconds doit etre >= 5"
}

$headers = @{
  "User-Agent" = "Milele-Prod-Monitor/1.0"
}

$checks = foreach ($url in $Urls) {
  $statusCode = 0
  $result = "FAIL"
  $errorMessage = $null
  $startedAt = Get-Date

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

  [PSCustomObject]@{
    Url = $url
    StatusCode = $statusCode
    Result = $result
    DurationMs = [int]((Get-Date) - $startedAt).TotalMilliseconds
    Error = $errorMessage
  }
}

$failed = @($checks | Where-Object { $_.Result -ne "OK" })
$globalStatus = if ($failed.Count -eq 0) { "OK" } else { "FAIL" }

Write-Host "Milele smoke test" -ForegroundColor Cyan
Write-Host "Timestamp: $((Get-Date).ToString('o'))"
Write-Host "Global status: $globalStatus"
Write-Host "Failed checks: $($failed.Count) / $($checks.Count)"
Write-Host ""

$checks | Select-Object Url, StatusCode, Result, DurationMs, Error | Format-Table -AutoSize | Out-String | Write-Host

if ($failed.Count -gt 0) {
  exit 1
}

exit 0
