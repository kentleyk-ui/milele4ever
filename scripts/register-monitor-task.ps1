param(
  [string]$TaskName = "Milele-Prod-Monitor",
  [int]$IntervalMinutes = 5,
  [string]$MonitorScriptPath = ".\scripts\monitor-prod.ps1",
  [string]$LogPath = ".\monitoring\monitor-prod.log"
)

$ErrorActionPreference = "Stop"

if ($IntervalMinutes -lt 1) {
  throw "IntervalMinutes doit etre >= 1"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedMonitorScript = Resolve-Path (Join-Path $projectRoot $MonitorScriptPath)
$resolvedLogPath = Join-Path $projectRoot $LogPath

$logDir = Split-Path -Parent $resolvedLogPath
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$psArgs = "-NoProfile -ExecutionPolicy Bypass -File `"$resolvedMonitorScript`" *> `"$resolvedLogPath`""
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $psArgs -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)

$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Force | Out-Null

Write-Host "Tache planifiee creee: $TaskName" -ForegroundColor Green
Write-Host "Frequence: toutes les $IntervalMinutes minute(s)"
Write-Host "Script: $resolvedMonitorScript"
Write-Host "Log: $resolvedLogPath"
