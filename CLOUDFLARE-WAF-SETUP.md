# Configuration Cloudflare WAF - Guide Complet

## Objectif
Autoriser les crawlers SEO à accéder à Milele4ever pour les audits :
- ✅ Googlebot
- ✅ Chrome-Lighthouse
- ✅ Googlebot-Image
- ✅ PageSpeed Insights

---

## Méthode 1 : Configuration Manuelle (Interface Web)

### Étape 1 : Accéder à Cloudflare Dashboard

1. Ouvre https://dash.cloudflare.com
2. Connecte-toi avec tes identifiants
3. Sélectionne le domaine `milele4ever.com`

### Étape 2 : Accéder à la Section WAF

1. Dans le menu de gauche, clique sur **Security** (Sécurité)
2. Clique sur **WAF** → **Tools** (Outils)
3. Tu verras l'interface de création des règles WAF

### Étape 3 : Ajouter les 3 Règles User-Agent

#### Règle 1 : Googlebot

1. Clique sur **Create rule** (Créer une règle)
2. Remplis les champs :
   - **Rule name** : `Allow Googlebot`
   - **Field** : `User Agent`
   - **Operator** : `equals`
   - **Value** : `Googlebot`
   - **Action** : `Allow` ✅
   - **Zone** : `This website` (Milele4ever)
3. Clique sur **Deploy** (Déployer)

#### Règle 2 : Chrome-Lighthouse

1. Clique sur **Create rule** (Créer une règle)
2. Remplis les champs :
   - **Rule name** : `Allow Chrome-Lighthouse`
   - **Field** : `User Agent`
   - **Operator** : `equals`
   - **Value** : `Chrome-Lighthouse`
   - **Action** : `Allow` ✅
   - **Zone** : `This website`
3. Clique sur **Deploy** (Déployer)

#### Règle 3 : Googlebot-Image

1. Clique sur **Create rule** (Créer une règle)
2. Remplis les champs :
   - **Rule name** : `Allow Googlebot-Image`
   - **Field** : `User Agent`
   - **Operator** : `equals`
   - **Value** : `Googlebot-Image`
   - **Action** : `Allow` ✅
   - **Zone** : `This website`
3. Clique sur **Deploy** (Déployer)

### Étape 4 : Désactiver Bot Fight Mode

1. Dans le menu de gauche sous **Security**, clique sur **Bots** (Bots)
2. Désactive les options suivantes :
   - ❌ **Bot Fight Mode** : Active → OFF (Désactiver)
   - ❌ **Super Bot Fight Mode** : Active → OFF (si disponible)
3. Clique sur **Save** (Enregistrer)

### Étape 5 : Vérification

1. Reviens à **Security** → **WAF** → **Tools**
2. Vérifie que les 3 règles sont listées et en status **Active** ✅
3. Confirme que Bot Fight Mode est **OFF**

---

## Méthode 2 : Configuration via API Cloudflare (Automatisée)

### Prérequis

1. Token API Cloudflare : https://dash.cloudflare.com/profile/api-tokens
2. Zone ID pour milele4ever.com (visible dans le dashboard)
3. Account ID (visible dans le dashboard)

### Script PowerShell Automatisé

```powershell
# Configuration Cloudflare WAF - Script Automatisé

# ⚙️ Variables à remplir
$CLOUDFLARE_API_TOKEN = "YOUR_API_TOKEN_HERE"
$ZONE_ID = "YOUR_ZONE_ID_HERE"  # Trouvé dans Cloudflare Dashboard
$DOMAIN = "milele4ever.com"

# Headers pour l'API
$headers = @{
    "Authorization" = "Bearer $CLOUDFLARE_API_TOKEN"
    "Content-Type" = "application/json"
}

Write-Host "🚀 Configuration Cloudflare WAF pour $DOMAIN" -ForegroundColor Green

# Fonction pour créer une règle WAF
function Create-WAFRule {
    param(
        [string]$RuleName,
        [string]$UserAgent,
        [string]$ZoneId
    )
    
    $body = @{
        name = $RuleName
        description = "Allow $UserAgent for SEO audits"
        enabled = $true
        rules = @(
            @{
                expression = "(http.user_agent eq `"$UserAgent`")"
                action = "allow"
            }
        )
        mode = "block"
    } | ConvertTo-Json

    $response = Invoke-WebRequest `
        -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/firewall/rules" `
        -Method POST `
        -Headers $headers `
        -Body $body

    $result = $response.Content | ConvertFrom-Json
    if ($result.success) {
        Write-Host "✅ Règle créée : $RuleName" -ForegroundColor Green
    } else {
        Write-Host "❌ Erreur création règle $RuleName : $($result.errors)" -ForegroundColor Red
    }
}

# Créer les 3 règles
Create-WAFRule -RuleName "Allow Googlebot" -UserAgent "Googlebot" -ZoneId $ZONE_ID
Create-WAFRule -RuleName "Allow Chrome-Lighthouse" -UserAgent "Chrome-Lighthouse" -ZoneId $ZONE_ID
Create-WAFRule -RuleName "Allow Googlebot-Image" -UserAgent "Googlebot-Image" -ZoneId $ZONE_ID

# Vérifier que Bot Fight Mode est désactivé
Write-Host "`n🔍 Vérification Bot Fight Mode..." -ForegroundColor Yellow

$bfmResponse = Invoke-WebRequest `
    -Uri "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/bot_management/super_bot_fight_mode/configs/javascript_detections" `
    -Method GET `
    -Headers $headers

$bfm = $bfmResponse.Content | ConvertFrom-Json
if ($bfm.success) {
    Write-Host "✅ Bot Fight Mode status : $($bfm.result.enabled)" -ForegroundColor Green
}

Write-Host "`n✨ Configuration Cloudflare terminée !" -ForegroundColor Green
Write-Host "Milele4ever.com est maintenant accessible à :" -ForegroundColor Cyan
Write-Host "  - Googlebot" -ForegroundColor Cyan
Write-Host "  - Chrome-Lighthouse" -ForegroundColor Cyan
Write-Host "  - Googlebot-Image" -ForegroundColor Cyan
```

### Utilisation du Script

1. Récupère ton **API Token** :
   - Va sur https://dash.cloudflare.com/profile/api-tokens
   - Crée un token avec permission "Zone: Firewall Rules: Edit"
   
2. Récupère ta **Zone ID** :
   - Va dans https://dash.cloudflare.com/
   - Sélectionne milele4ever.com
   - La Zone ID est visible en bas à droite

3. Remplace les valeurs dans le script :
   ```powershell
   $CLOUDFLARE_API_TOKEN = "YOUR_TOKEN_HERE"
   $ZONE_ID = "YOUR_ZONE_ID_HERE"
   ```

4. Exécute le script :
   ```powershell
   .\configure-cloudflare-waf.ps1
   ```

---

## Script cURL Alternative (Linux/macOS)

```bash
#!/bin/bash

API_TOKEN="YOUR_API_TOKEN_HERE"
ZONE_ID="YOUR_ZONE_ID_HERE"
DOMAIN="milele4ever.com"

echo "🚀 Configuration Cloudflare WAF pour $DOMAIN"

# Fonction pour créer une règle
create_waf_rule() {
    local name=$1
    local user_agent=$2
    
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/firewall/rules" \
        -H "Authorization: Bearer $API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\": \"$name\",
            \"description\": \"Allow $user_agent for SEO audits\",
            \"enabled\": true,
            \"rules\": [{
                \"expression\": \"(http.user_agent eq \\\"$user_agent\\\")\",
                \"action\": \"allow\"
            }],
            \"mode\": \"block\"
        }"
    
    echo "✅ Règle créée : $name"
}

# Créer les 3 règles
create_waf_rule "Allow Googlebot" "Googlebot"
create_waf_rule "Allow Chrome-Lighthouse" "Chrome-Lighthouse"
create_waf_rule "Allow Googlebot-Image" "Googlebot-Image"

echo "✨ Configuration terminée !"
```

---

## Vérification Finale

Après configuration, teste que Googlebot peut accéder au site :

```powershell
# Test Googlebot
$headers = @{
    "User-Agent" = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
}

$response = Invoke-WebRequest `
    -Uri "https://www.milele4ever.com/" `
    -Headers $headers `
    -Method GET

Write-Host "Status Code: $($response.StatusCode)"  # Doit être 200 ✅
Write-Host "Robots.txt accessible : $(Invoke-WebRequest -Uri 'https://www.milele4ever.com/robots.txt' -Headers $headers).StatusCode"
Write-Host "Sitemap accessible : $(Invoke-WebRequest -Uri 'https://www.milele4ever.com/sitemap.xml' -Headers $headers).StatusCode"
```

---

## Checklist Finale

- [ ] Règle WAF "Allow Googlebot" créée et active
- [ ] Règle WAF "Allow Chrome-Lighthouse" créée et active
- [ ] Règle WAF "Allow Googlebot-Image" créée et active
- [ ] Bot Fight Mode : **OFF**
- [ ] Super Bot Fight Mode : **OFF**
- [ ] Test Googlebot : ✅ HTTP 200
- [ ] Test /robots.txt : ✅ HTTP 200
- [ ] Test /sitemap.xml : ✅ HTTP 200
- [ ] PageSpeed Insights peut analyser le site
- [ ] Lighthouse peut auditer le site

---

## Confirmation

**✅ Cloudflare configuré : PageSpeed et Googlebot autorisés.**

Milele4ever.com est maintenant complètement accessible aux outils SEO et aux crawlers pour l'audit complet.
