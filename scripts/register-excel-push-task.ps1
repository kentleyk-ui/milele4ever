param(
  [string]$TaskName = "Milele-Excel-Push",
  [int]$IntervalMinutes = 15,
  [string]$PushScriptPath = ".\scripts\push-monitor-to-excel.ps1",
  [string]$LogPath = ".\monitoring\excel-push.log",
  [string]$StateFile = ".\monitoring\history\excel-push-state.json",
  [string]$OutputCsv = ".\monitoring\history\monitor-excel.csv",
  [int]$HoursBack = 24,
  [int]$MaxRows = 500,
  [switch]$ForceFullSync
)

$ErrorActionPreference = "Stop"

if ($IntervalMinutes -lt 1) {
  throw "IntervalMinutes doit etre >= 1"
}

$projectRoot = Split-Path -Parent $PSScriptRoot
$resolvedPushScript = Resolve-Path (Join-Path $projectRoot $PushScriptPath)
$resolvedLogPath = Join-Path $projectRoot $LogPath

$logDir = Split-Path -Parent $resolvedLogPath
if (-not (Test-Path $logDir)) {
  New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$args = @(
  "-NoProfile",
  "-ExecutionPolicy", "Bypass",
  "-File", "`"$resolvedPushScript`"",
  "-HoursBack", "$HoursBack",
  "-MaxRows", "$MaxRows",
  "-StateFile", "`"$StateFile`"",
  "-OutputCsv", "`"$OutputCsv`""
)

if ($ForceFullSync) {
  $args += "-ForceFullSync"
}

$argLine = ($args -join " ") + " *> `"$resolvedLogPath`""

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argLine -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes)
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Force | Out-Null

Write-Host "Tache Excel creee: $TaskName" -ForegroundColor Green
Write-Host "Frequence: toutes les $IntervalMinutes minute(s)"
Write-Host "Script: $resolvedPushScript"
Write-Host "CSV: $(Join-Path $projectRoot $OutputCsv)"
Write-Host "Log: $resolvedLogPath"
