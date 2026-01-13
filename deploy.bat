@echo off
setlocal

echo.
echo    _______                      _____ __    _      __    __
echo   / ____/ /____  _   _____  ___/ ___// /_  (_)__  / /___/ /
echo  / /   / / __ \ | | / / _ \/ __/\__ \/ __ \/ / _ \/ / __  / 
echo / /___/ / /_/ / | |/ /  __/ /  ___/ / / / / /  __/ / /_/ /  
echo \____/_/\____/  |___/\___/_/  /____/_/ /_/_/\___/_/\__,_/   
echo.
echo ^>^> Sovereign AI Fraud Analyst Workstation Deployer
echo ^>^> Target: Local / On-Premise (Windows)
echo ---------------------------------------------------

:: 1. Check for Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop and try again.
    exit /b 1
)

echo [1/4] Docker check passed.

:: 2. Setup Environment Variables
echo [2/4] Configuring environment...

if not exist "frontend\.env.local" (
    echo  -^> Creating frontend\.env.local from template...
    copy frontend\env.template frontend\.env.local >nul
) else (
    echo  -^> frontend\.env.local already exists. Skipping.
)

if not exist "ml-api\.env" (
    echo  -^> Creating ml-api\.env from template...
    copy ml-api\env.template ml-api\.env >nul
) else (
    echo  -^> ml-api\.env already exists. Skipping.
)

:: 3. Build and Launch
echo [3/4] Launching containers (this may take a few minutes)...
docker-compose up -d --build

:: 4. Verify
if %errorlevel% equ 0 (
    echo ---------------------------------------------------
    echo [SUCCESS] System Deployed Successfully!
    echo.
    echo ^>^> Analyst Dashboard: http://localhost:3000
    echo ^>^> ML Inference API:  http://localhost:8000/docs
    echo.
    echo To stop the system, run: docker-compose down
) else (
    echo [ERROR] Deployment failed. Check docker logs above.
    exit /b 1
)
