# CloverShield Demo Launcher for Windows PowerShell
# This script installs dependencies and runs the Streamlit app

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CloverShield Fraud Detection Demo" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[1/3] Checking Python installation..." -ForegroundColor Green
    Write-Host $pythonVersion
} catch {
    Write-Host "[ERROR] Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://www.python.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/3] Installing/updating dependencies..." -ForegroundColor Green
python -m pip install --upgrade pip --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to upgrade pip" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

python -m pip install streamlit pandas numpy plotly joblib --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Failed to install dependencies" -ForegroundColor Red
    Write-Host "Try running: pip install -r requirements.txt" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[3/3] Starting CloverShield Demo..." -ForegroundColor Green
Write-Host ""
Write-Host "The app will open in your browser automatically." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server." -ForegroundColor Yellow
Write-Host ""

# Run Streamlit
python -m streamlit run app.py --server.headless true

