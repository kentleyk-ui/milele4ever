@echo off
setlocal enabledelayedexpansion
cls

set SCRIPT_DIR=%~dp0

where bash >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    bash.exe "%SCRIPT_DIR%milele-setup-portable"
    exit /b !ERRORLEVEL!
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '!SCRIPT_DIR!windows-setup.ps1'"
exit /b !ERRORLEVEL!

:PowerShell_Batch_Hybrid
$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "`n[MILELE] $Message" -ForegroundColor Cyan
}

function Fail([string]$Message) {
    Write-Host "`n[ERREUR] $Message" -ForegroundColor Red
    exit 1
}

function Ensure-Node {
    if (Get-Command node -ErrorAction SilentlyContinue) {
        Write-Step "Node.js detecte: $(node -v)"
        return
    }

    Write-Step "Node.js non detecte, installation de la version LTS..."

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        & winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    }
    elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        & choco install nodejs-lts -y
    }
    else {
        Fail "Aucun gestionnaire de paquets disponible pour installer Node.js"
    }

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Fail "Installation Node.js echouee"
    }

    Write-Step "Node.js installe: $(node -v)"
}

function Ensure-Pnpm {
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        Write-Step "pnpm detecte: $(pnpm -v)"
        return
    }

    Write-Step "pnpm non detecte, installation en cours..."

    if (Get-Command corepack -ErrorAction SilentlyContinue) {
        & corepack enable | Out-Null
        & corepack prepare pnpm@latest --activate | Out-Null
    }

    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        & npm install -g pnpm
    }

    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Fail "Installation pnpm echouee"
    }

    Write-Step "pnpm installe: $(pnpm -v)"
}

function Resolve-UsbProject {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $candidates = @(
        (Join-Path $scriptDir 'milele4ever-project\docs\new'),
        (Join-Path $scriptDir 'milele4ever-project'),
        (Join-Path $scriptDir 'Milele'),
        (Join-Path $scriptDir 'milele'),
        $scriptDir
    )

    foreach ($candidate in $candidates) {
        if (Test-Path (Join-Path $candidate 'package.json')) {
            return $candidate
        }

        $found = Get-ChildItem -Path $candidate -Recurse -Filter package.json -ErrorAction SilentlyContinue |
            Select-Object -First 1

        if ($found) {
            return $found.Directory.FullName
        }
    }

    Fail "Projet Milele introuvable sur la cle USB"
}

function Copy-ProjectIfMissing([string]$Source, [string]$Destination) {
    if ((Test-Path $Destination) -and (Test-Path (Join-Path $Destination 'package.json'))) {
        Write-Step "Projet deja present: $Destination"
        return $Destination
    }

    Write-Step "Copie du projet depuis la cle USB vers: $Destination"
    $parent = Split-Path -Parent $Destination
    if (-not (Test-Path $parent)) {
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
    }

    Copy-Item -Path (Join-Path $Source '*') -Destination $Destination -Recurse -Force

    if (Test-Path (Join-Path $Destination 'package.json')) {
        return $Destination
    }

    if (Test-Path (Join-Path $Destination 'docs\new\package.json')) {
        return (Join-Path $Destination 'docs\new')
    }

    $found = Get-ChildItem -Path $Destination -Recurse -Filter package.json -ErrorAction SilentlyContinue |
        Select-Object -First 1

    if (-not $found) {
        Fail "Impossible de trouver package.json apres copie"
    }

    return $found.Directory.FullName
}

Write-Step "Preparation de l'environnement portable Milele (Windows)"

Ensure-Node
Ensure-Pnpm

$usbProject = Resolve-UsbProject
Write-Step "Projet source detecte sur la cle: $usbProject"

$defaultTarget = Join-Path $HOME 'milele4ever-project'
$target = Read-Host "Emplacement cible [$defaultTarget]"
if ([string]::IsNullOrWhiteSpace($target)) {
    $target = $defaultTarget
}

$projectDir = Copy-ProjectIfMissing -Source $usbProject -Destination $target
Write-Step "Dossier projet: $projectDir"

Set-Location $projectDir

Write-Step "Installation des dependances..."
& pnpm install

Write-Step "Reconstruction du projet..."
& pnpm build

Write-Step "Demarrage du serveur de developpement..."
& pnpm dev
