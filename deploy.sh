#!/bin/bash

# CloverShield One-Command Deploy Script
# Usage: ./deploy.sh

echo -e "\033[0;32m"
echo "   _______                      _____ __    _      __    __"
echo "  / ____/ /____  _   _____  ___/ ___// /_  (_)__  / /___/ /"
echo " / /   / / __ \ | | / / _ \/ __/\__ \/ __ \/ / _ \/ / __  / "
echo "/ /___/ / /_/ / | |/ /  __/ /  ___/ / / / / /  __/ / /_/ /  "
echo "\____/_/\____/  |___/\___/_/  /____/_/ /_/_/\___/_/\__,_/   "
echo -e "\033[0m"
echo ">> Sovereign AI Fraud Analyst Workstation Deployer"
echo ">> Target: Local / On-Premise"
echo "---------------------------------------------------"

# 1. Check for Docker
if ! command -v docker &> /dev/null; then
    echo -e "\033[0;31m[ERROR] Docker is not installed or not in PATH.\033[0m"
    echo "Please install Docker Desktop and try again."
    exit 1
fi

echo "[1/4] Docker check passed."

# 2. Setup Environment Variables
echo "[2/4] Configuring environment..."

if [ ! -f "frontend/.env.local" ]; then
    echo " -> Creating frontend/.env.local from template..."
    cp frontend/env.template frontend/.env.local
else
    echo " -> frontend/.env.local already exists. Skipping."
fi

if [ ! -f "ml-api/.env" ]; then
    echo " -> Creating ml-api/.env from template..."
    cp ml-api/env.template ml-api/.env
else
    echo " -> ml-api/.env already exists. Skipping."
fi

# 3. Build and Launch
echo "[3/4] Launching containers (this may take a few minutes)..."
docker-compose up -d --build

# 4. Verify
if [ $? -eq 0 ]; then
    echo "---------------------------------------------------"
    echo -e "\033[0;32m[SUCCESS] System Deployed Successfully!\033[0m"
    echo ""
    echo ">> Analyst Dashboard: http://localhost:3000"
    echo ">> ML Inference API:  http://localhost:8000/docs"
    echo ""
    echo "To stop the system, run: docker-compose down"
else
    echo -e "\033[0;31m[ERROR] Deployment failed. Check docker logs above.\033[0m"
    exit 1
fi
