@echo off
REM CloverShield Demo Launcher for Windows
REM This script installs dependencies and runs the Streamlit app

echo.
echo ========================================
echo   CloverShield Fraud Detection Demo
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo [1/3] Checking Python installation...
python --version

echo.
echo [2/3] Installing/updating dependencies...
python -m pip install --upgrade pip --quiet
python -m pip install streamlit pandas numpy plotly joblib --quiet

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    echo Try running: pip install -r requirements.txt
    pause
    exit /b 1
)

echo.
echo [3/3] Starting CloverShield Demo...
echo.
echo The app will open in your browser automatically.
echo Press Ctrl+C to stop the server.
echo.

REM Run Streamlit
python -m streamlit run app.py --server.headless true

pause

