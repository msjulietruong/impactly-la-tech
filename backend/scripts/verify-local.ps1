# Local verification script for ESG backend
param(
    [switch]$ContinueOnError
)

$ErrorActionPreference = if ($ContinueOnError) { "Continue" } else { "Stop" }

Write-Host "Verifying local setup..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".\\.env")) {
    Write-Host "Error: .env file not found" -ForegroundColor Red
    Write-Host "   Please copy .env.example to .env and configure your settings" -ForegroundColor Yellow
    exit 1
}

Write-Host ".env file found" -ForegroundColor Green

# Load .env file
$envContent = Get-Content ".\\.env" | Where-Object { $_ -and $_ -notmatch '^#' }
foreach ($line in $envContent) {
    if ($line -match '^([^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Check required environment variables
$missingVars = @()

$requiredVars = @("MONGODB_URI", "OFF_ENV", "OFF_USER_AGENT")
foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "Error: Missing required environment variables:" -ForegroundColor Red
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Yellow
    }
    Write-Host "   Please check your .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host "Required environment variables present" -ForegroundColor Green

# Set defaults
$PORT = if ([Environment]::GetEnvironmentVariable("PORT", "Process")) { [Environment]::GetEnvironmentVariable("PORT", "Process") } else { "3001" }
$TEST_TICKER = if ([Environment]::GetEnvironmentVariable("TEST_TICKER", "Process")) { [Environment]::GetEnvironmentVariable("TEST_TICKER", "Process") } else { "MSFT" }

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm ci

Write-Host "Running verification (ingest + tests)..." -ForegroundColor Cyan
npm run verify

Write-Host ""
Write-Host "Verification successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Test your endpoints with these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "curl http://localhost:$PORT/health"
Write-Host "curl `"http://localhost:$PORT/v1/company?ticker=${TEST_TICKER}`""
Write-Host "curl `"http://localhost:$PORT/v1/score/<PASTE_ID_FROM_PREVIOUS>`""
Write-Host ""
Write-Host "Start the server with: npm run dev" -ForegroundColor Yellow
