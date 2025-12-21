# CloverShield Deployment Verification Script (PowerShell)
# Run this after deploying to Vercel to verify all services are working

param(
    [string]$DeploymentUrl = "https://your-project.vercel.app"
)

$ErrorActionPreference = "Stop"

Write-Host "🧪 CloverShield Deployment Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Site is accessible
Write-Host "Test 1: Checking if site is accessible..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $DeploymentUrl -Method Get -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Site is accessible" -ForegroundColor Green
    } else {
        Write-Host "❌ Site returned status code: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Site is not accessible: $_" -ForegroundColor Red
    exit 1
}

# Test 2: Supabase connection
$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL
if ($supabaseUrl) {
    Write-Host ""
    Write-Host "Test 2: Checking Supabase connection..." -ForegroundColor Yellow
    try {
        $supabaseResponse = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/users?limit=1" -Method Get -UseBasicParsing -TimeoutSec 10
        Write-Host "✅ Supabase is accessible" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Supabase connection check failed (may need auth): $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Supabase URL not set, skipping" -ForegroundColor Yellow
}

# Test 3: ML API health
$mlApiUrl = $env:NEXT_PUBLIC_ML_API_URL
if ($mlApiUrl) {
    Write-Host ""
    Write-Host "Test 3: Checking ML API health..." -ForegroundColor Yellow
    try {
        $mlResponse = Invoke-WebRequest -Uri "$mlApiUrl/health" -Method Get -UseBasicParsing -TimeoutSec 10
        $mlData = $mlResponse.Content | ConvertFrom-Json
        if ($mlData.status -eq "healthy") {
            Write-Host "✅ ML API is healthy" -ForegroundColor Green
            Write-Host "   Response: $($mlResponse.Content)" -ForegroundColor Gray
        } else {
            Write-Host "❌ ML API health check failed" -ForegroundColor Red
            Write-Host "   Response: $($mlResponse.Content)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ ML API health check failed: $_" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  ML API URL not set, skipping" -ForegroundColor Yellow
}

# Test 4: Check page structure
Write-Host ""
Write-Host "Test 4: Checking page structure..." -ForegroundColor Yellow
try {
    $htmlContent = (Invoke-WebRequest -Uri $DeploymentUrl -Method Get -UseBasicParsing).Content
    if ($htmlContent -match "CloverShield|clovershield") {
        Write-Host "✅ Page content loaded" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Page content check inconclusive" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check page content: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Basic verification complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open $DeploymentUrl in browser"
Write-Host "2. Run full smoke test (see SMOKE_TEST.md)"
Write-Host "3. Check browser console for errors"
Write-Host "4. Test transaction processing"

