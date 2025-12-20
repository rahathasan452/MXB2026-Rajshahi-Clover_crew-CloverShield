#!/bin/bash
# CloverShield Demo Launcher for Linux/Mac
# This script installs dependencies and runs the Streamlit app

echo ""
echo "========================================"
echo "  CloverShield Fraud Detection Demo"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

echo "[1/3] Checking Python installation..."
python3 --version

echo ""
echo "[2/3] Installing/updating dependencies..."
python3 -m pip install --upgrade pip --quiet
python3 -m pip install streamlit pandas numpy plotly joblib --quiet

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    echo "Try running: pip install -r requirements.txt"
    exit 1
fi

echo ""
echo "[3/3] Starting CloverShield Demo..."
echo ""
echo "The app will open in your browser automatically."
echo "Press Ctrl+C to stop the server."
echo ""

# Run Streamlit
python3 -m streamlit run app.py --server.headless true

