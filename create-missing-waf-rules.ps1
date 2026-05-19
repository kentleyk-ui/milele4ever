#Requires -Version 7.0
<#
.SYNOPSIS
    Create two missing Cloudflare WAF custom rules for SEO bots
.DESCRIPTION
    Creates "Allow Chrome-Lighthouse SEO" and "Allow Googlebot-Image SEO" rules
    to complement the existing "Allow Googlebot SEO" rule
#>

param(
    [string]$APIToken = "",
    [string]$ZoneId = "27755b1369d252fa99aeed423c226a3d"
)

# If no token provided, prompt for it
if ([string]::IsNullOrWhiteSpace($APIToken)) {
    Write-Host "Cloudflare WAF Custom Rules Creator" -ForegroundColor Cyan
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Enter your Cloudflare API Token (with Zone:WAF Edit permissions):" -ForegroundColor Yellow
    $APIToken = Read-Host -AsSecureString
    $APIToken = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($APIToken))
}

# Set up headers
$headers = @{
    "Authorization" = "Bearer $APIToken"
    "Content-Type" = "application/json"
}

Write-Host "Creating Cloudflare WAF custom rules..." -ForegroundColor Cyan
Write-Host "Zone ID: $ZoneId" -ForegroundColor Green
Write-Host ""

# Step 1: Get the ruleset ID for http_request_firewall_custom phase
Write-Host "Step 1: Fetching ruleset ID..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod `
        -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/rulesets" `
        -Headers $headers `
        -Method GET `
        -ErrorAction Stop

    if ($response.success) {
        # Find the http_request_firewall_custom ruleset
        $rulesets = $response.result
        $customRuleset = $rulesets | Where-Object { $_.phase -eq "http_request_firewall_custom" }
        
        if ($customRuleset) {
            $rulesetId = $customRuleset.id
            Write-Host "✓ Found ruleset ID: $rulesetId" -ForegroundColor Green
        } else {
            Write-Host "✗ Could not find http_request_firewall_custom ruleset" -ForegroundColor Red
            $rulesets | ForEach-Object { Write-Host "  - Phase: $($_.phase), ID: $($_.id)" }
            exit 1
        }
    } else {
        Write-Host "✗ API Error: $($response.errors | ConvertTo-Json)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error fetching rulesets: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create the two missing rules
$rulesToCreate = @(
    @{
        description = "Allow Chrome-Lighthouse SEO"
        userAgent = "Chrome-Lighthouse"
    },
    @{
        description = "Allow Googlebot-Image SEO"
        userAgent = "Googlebot-Image"
    }
)

foreach ($rule in $rulesToCreate) {
    Write-Host "Creating: $($rule.description)..." -ForegroundColor Yellow
    
    $body = @{
        description = $rule.description
        expression = "(http.user_agent wildcard r`"$($rule.userAgent)`")"
        action = "skip"
        enabled = $true
        action_parameters = @{
            ruleset = "current"
            phases = @("http_ratelimit", "http_request_firewall_managed")
        }
    }
    
    try {
        $response = Invoke-RestMethod `
            -Uri "https://api.cloudflare.com/client/v4/zones/$ZoneId/rulesets/$rulesetId/rules" `
            -Headers $headers `
            -Method POST `
            -Body ($body | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        if ($response.success) {
            $newRule = $response.result
            Write-Host "✓ Rule created successfully" -ForegroundColor Green
            Write-Host "  Rule ID: $($newRule.id)" -ForegroundColor Gray
            Write-Host "  Expression: $($newRule.expression)" -ForegroundColor Gray
        } else {
            Write-Host "✗ API Error: " -ForegroundColor Red -NoNewline
            if ($response.errors) {
                $response.errors | ForEach-Object { Write-Host "Code $($_.code): $($_.message)" }
            } else {
                Write-Host $response | ConvertTo-Json
            }
        }
    } catch {
        Write-Host "✗ Error creating rule: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "Done!" -ForegroundColor Cyan
