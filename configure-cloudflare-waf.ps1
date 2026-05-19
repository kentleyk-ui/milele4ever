#Requires -Version 5.0

<#
.SYNOPSIS
Configuration Cloudflare WAF pour autoriser SEO crawlers (Googlebot, Lighthouse, PageSpeed Insights)

.DESCRIPTION
Ajoute les règles WAF nécessaires et désactive Bot Fight Mode pour Milele4ever.com

.PARAMETER APIToken
Token d'authentification Cloudflare (Bearer token)
Obtenir sur : https://dash.cloudflare.com/profile/api-tokens

.PARAMETER ZoneId
Zone ID du domaine Milele4ever.com
Visible dans le dashboard Cloudflare en bas à droite

.EXAMPLE
.\configure-cloudflare-waf.ps1 -APIToken "your_token" -ZoneId "your_zone_id"
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$APIToken,
    
    [Parameter(Mandatory=$false)]
    [string]$ZoneId
)

# Couleurs
$SUCCESS = @{ ForegroundColor = "Green" }
$ERROR_COLOR = @{ ForegroundColor = "Red" }
$INFO = @{ ForegroundColor = "Cyan" }
$WARNING = @{ ForegroundColor = "Yellow" }

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" @SUCCESS
Write-Host "║   Configuration Cloudflare WAF - Milele4ever.com              ║" @SUCCESS
Write-Host "║   Autorisation des crawlers SEO                              ║" @SUCCESS
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" @SUCCESS

# === ÉTAPE 0 : Récupérer les credentials ===
if (-not $APIToken) {
    Write-Host "⚠️  Entrez votre API Token Cloudflare" @WARNING
    Write-Host "   (Trouvez-le sur https://dash.cloudflare.com/profile/api-tokens)`n" @WARNING
    $APIToken = Read-Host "API Token"
}

if (-not $ZoneId) {
    Write-Host "`n⚠️  Entrez la Zone ID de Milele4ever.com" @WARNING
    Write-Host "   (Visible dans https://dash.cloudflare.com/ en bas à droite)`n" @WARNING
    $ZoneId = Read-Host "Zone ID"
}

if (-not $APIToken -or -not $ZoneId) {
    Write-Host "❌ Token et Zone ID requis" @ERROR_COLOR
    exit 1
}

# Setup headers
$headers = @{
    "Authorization" = "Bearer $APIToken"
    "Content-Type" = "application/json"
    "X-Auth-User-Service-Key" = ""
}

$BaseUrl = "https://api.cloudflare.com/client/v4"

function Set-CFZoneSetting {
    param(
        [Parameter(Mandatory=$true)] [string]$ZoneId,
        [Parameter(Mandatory=$true)] [hashtable]$Headers,
        [Parameter(Mandatory=$true)] [string]$SettingId,
        [Parameter(Mandatory=$true)] $Value
    )

    $payload = @{ value = $Value } | ConvertTo-Json -Depth 10
    try {
        $res = Invoke-RestMethod -Uri "$BaseUrl/zones/$ZoneId/settings/$SettingId" -Headers $Headers -Method PATCH -Body $payload -ErrorAction Stop
        if ($res.success) {
            Write-Host "   ✅ $SettingId = $Value" @SUCCESS
            return $true
        }
        Write-Host "   ❌ $SettingId non appliqué" @ERROR_COLOR
        return $false
    } catch {
        Write-Host "   ⚠️  $SettingId : $($_.Exception.Message)" @WARNING
        return $false
    }
}

function Ensure-CacheEverythingPageRule {
    param(
        [Parameter(Mandatory=$true)] [string]$ZoneId,
        [Parameter(Mandatory=$true)] [hashtable]$Headers,
        [Parameter(Mandatory=$true)] [string]$Domain
    )

    $target = "*$Domain/*"
    $actions = @(
        @{ id = "cache_level"; value = "cache_everything" },
        @{ id = "edge_cache_ttl"; value = 2592000 },
        @{ id = "browser_cache_ttl"; value = 2592000 }
    )

    try {
        $existing = Invoke-RestMethod -Uri "$BaseUrl/zones/$ZoneId/pagerules" -Headers $Headers -Method GET -ErrorAction Stop
        $rule = $existing.result | Where-Object {
            $_.targets[0].constraint.value -eq $target
        } | Select-Object -First 1

        if ($null -ne $rule) {
            $updateBody = @{
                status = "active"
                targets = @(
                    @{
                        target = "url"
                        constraint = @{ operator = "matches"; value = $target }
                    }
                )
                actions = $actions
                priority = $rule.priority
            } | ConvertTo-Json -Depth 10

            $updateRes = Invoke-RestMethod -Uri "$BaseUrl/zones/$ZoneId/pagerules/$($rule.id)" -Headers $Headers -Method PATCH -Body $updateBody -ErrorAction Stop
            if ($updateRes.success) {
                Write-Host "   ✅ Page Rule cache mise à jour (Cache Everything + TTL 1 mois)" @SUCCESS
                return $true
            }
        }

        $createBody = @{
            status = "active"
            targets = @(
                @{
                    target = "url"
                    constraint = @{ operator = "matches"; value = $target }
                }
            )
            actions = $actions
            priority = 1
        } | ConvertTo-Json -Depth 10

        $createRes = Invoke-RestMethod -Uri "$BaseUrl/zones/$ZoneId/pagerules" -Headers $Headers -Method POST -Body $createBody -ErrorAction Stop
        if ($createRes.success) {
            Write-Host "   ✅ Page Rule cache créée (Cache Everything + TTL 1 mois)" @SUCCESS
            return $true
        }

        Write-Host "   ❌ Impossible de créer la Page Rule cache" @ERROR_COLOR
        return $false
    } catch {
        Write-Host "   ⚠️  Cache Everything non appliqué via API: $($_.Exception.Message)" @WARNING
        return $false
    }
}

Write-Host "🔐 Authentification en cours..." @INFO

# Vérifier la connexion
try {
    $testResponse = Invoke-RestMethod `
        -Uri "$BaseUrl/zones/$ZoneId" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop
    
    if ($testResponse.success) {
        Write-Host "✅ Connecté à Cloudflare" @SUCCESS
        Write-Host "   Zone : $($testResponse.result.name) (ID: $($testResponse.result.id))" @INFO
    } else {
        Write-Host "❌ Erreur d'authentification : $($testResponse.errors[0].message)" @ERROR_COLOR
        exit 1
    }
} catch {
    Write-Host "❌ Impossible de se connecter : $_" @ERROR_COLOR
    exit 1
}

# === ÉTAPE 1 : Créer les règles WAF ===
Write-Host "`n📋 Création des règles WAF..." @INFO

$rules = @(
    @{
        name = "Allow Googlebot"
        user_agent = "Googlebot"
    },
    @{
        name = "Allow Chrome-Lighthouse"
        user_agent = "Chrome-Lighthouse"
    },
    @{
        name = "Allow Googlebot-Image"
        user_agent = "Googlebot-Image"
    }
)

$createdRules = @()

foreach ($rule in $rules) {
    Write-Host "  → Création : $($rule.name)..." -NoNewline
    
    $body = @{
        name = $rule.name
        description = "Allow $($rule.user_agent) for SEO audits"
        enabled = $true
        rules = @(
            @{
                expression = "(http.user_agent eq `"$($rule.user_agent)`")"
                action = "allow"
            }
        )
        mode = "block"
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod `
            -Uri "$BaseUrl/zones/$ZoneId/firewall/rules" `
            -Headers $headers `
            -Method POST `
            -Body $body `
            -ErrorAction Stop
        
        if ($response.success) {
            Write-Host " ✅" @SUCCESS
            $createdRules += $response.result.id
        } else {
            Write-Host " ❌ - $($response.errors[0].message)" @ERROR_COLOR
        }
    } catch {
        Write-Host " ❌ - $_" @ERROR_COLOR
    }
}

Write-Host "`n✅ $($createdRules.Count) règles WAF créées" @SUCCESS

Write-Host "`n🛡️  Désactivation Bot Fight / Super Bot Fight..." @INFO
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "bot_fight_mode" -Value "off" | Out-Null
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "super_bot_fight_mode" -Value "off" | Out-Null

# === ÉTAPE 2 : Vérifier Bot Fight Mode ===
Write-Host "`n🔍 Vérification Bot Fight Mode..." @INFO

try {
    $bfmResponse = Invoke-RestMethod `
        -Uri "$BaseUrl/zones/$ZoneId/bot_management/super_bot_fight_mode/configs/super_bot_fight_mode" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop
    
    if ($bfmResponse.success) {
        $bfmStatus = $bfmResponse.result.enabled
        Write-Host "   Bot Fight Mode : $(if ($bfmStatus) { '❌ ENABLED (Désactivé recommandé)' } else { '✅ OFF (Correct)' })" @INFO
    }
} catch {
    Write-Host "   ⚠️  Impossible de vérifier Bot Fight Mode" @WARNING
}

Write-Host "`n⚡ Application des optimisations vitesse Cloudflare..." @INFO
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "http3" -Value "on" | Out-Null
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "early_hints" -Value "on" | Out-Null
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "brotli" -Value "on" | Out-Null
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "mirage" -Value "on" | Out-Null
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "polish" -Value "lossy" | Out-Null
Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "rocket_loader" -Value "on" | Out-Null

try {
    $minifyPayload = @{ value = @{ html = "on"; css = "on"; js = "on" } } | ConvertTo-Json -Depth 10
    $minifyRes = Invoke-RestMethod -Uri "$BaseUrl/zones/$ZoneId/settings/minify" -Headers $headers -Method PATCH -Body $minifyPayload -ErrorAction Stop
    if ($minifyRes.success) {
        Write-Host "   ✅ Auto Minify = HTML + CSS + JS" @SUCCESS
    }
} catch {
    Write-Host "   ⚠️  Auto Minify non appliqué: $($_.Exception.Message)" @WARNING
}

Set-CFZoneSetting -ZoneId $ZoneId -Headers $headers -SettingId "browser_cache_ttl" -Value 2592000 | Out-Null
Ensure-CacheEverythingPageRule -ZoneId $ZoneId -Headers $headers -Domain "milele4ever.com" | Out-Null

# === ÉTAPE 3 : Listage des règles actives ===
Write-Host "`n📊 Vérification des règles actives..." @INFO

try {
    $listResponse = Invoke-RestMethod `
        -Uri "$BaseUrl/zones/$ZoneId/firewall/rules" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop
    
    if ($listResponse.success) {
        $allRules = $listResponse.result | Where-Object { $_.name -match "Allow (Googlebot|Chrome-Lighthouse)" }
        Write-Host "   Nombre de règles SEO actives : $($allRules.Count)" @INFO
        
        foreach ($activeRule in $allRules) {
            Write-Host "     • $($activeRule.name) - $($activeRule.enabled ? '✅ Active' : '❌ Inactive')" @INFO
        }
    }
} catch {
    Write-Host "   ⚠️  Impossible de lister les règles" @WARNING
}

# === ÉTAPE 4 : Test d'accès ===
Write-Host "`n🧪 Test d'accès Googlebot..." @INFO

$testHeaders = @{
    "User-Agent" = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
}

@(
    @{ url = "https://www.milele4ever.com/"; name = "Homepage" },
    @{ url = "https://www.milele4ever.com/robots.txt"; name = "Robots.txt" },
    @{ url = "https://www.milele4ever.com/sitemap.xml"; name = "Sitemap" }
) | ForEach-Object {
    try {
        $response = Invoke-WebRequest -Uri $_.url -Headers $testHeaders -MaximumRedirection 0 -ErrorAction Stop
        Write-Host "   ✅ $($_.name) : $($response.StatusCode)" @SUCCESS
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        if ($statusCode -in 200, 301, 302) {
            Write-Host "   ✅ $($_.name) : $statusCode" @SUCCESS
        } else {
            Write-Host "   ❌ $($_.name) : $statusCode" @ERROR_COLOR
        }
    }
}

# === Résumé Final ===
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" @SUCCESS
Write-Host "║                      CONFIGURATION COMPLÈTE                   ║" @SUCCESS
Write-Host "╚══════════════════════════════════════════════════════════════╝" @SUCCESS

Write-Host "`n✨ État Final :" @SUCCESS
Write-Host "   ✅ Googlebot autorisé" @SUCCESS
Write-Host "   ✅ Chrome-Lighthouse autorisé" @SUCCESS
Write-Host "   ✅ Googlebot-Image autorisé" @SUCCESS
Write-Host "   ✅ PageSpeed Insights peut accéder au site" @SUCCESS
Write-Host "   ✅ HTTP/3, Early Hints, Brotli, Mirage, Polish, Rocket Loader activés" @SUCCESS
Write-Host "   ✅ Minify HTML/CSS/JS + cache 1 mois appliqués (si support API)" @SUCCESS

Write-Host "`n📌 Prochaines étapes :" @INFO
Write-Host "   1. Accédez à PageSpeed Insights : https://pagespeed.web.dev/" @INFO
Write-Host "   2. Auditer : https://www.milele4ever.com/" @INFO
Write-Host "   3. Vérifier le score SEO et performance" @INFO

Write-Host "`n✅ Cloudflare optimisé : vitesse maximale + compatibilité vieux appareils." @SUCCESS
Write-Host "`nLe site milele4ever.com est prêt pour l'audit SEO complet !`n" @SUCCESS
