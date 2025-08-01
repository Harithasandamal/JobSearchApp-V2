@echo off
title Job Search App - Launcher
color 0A
cls

echo.
echo ========================================
echo   Automated Job Search Application
echo ========================================
echo.
echo Starting application with unified logger...
echo.

REM Check Node.js quickly
node --version >nul 2>&1 || (
    echo ERROR: Node.js not found! Please install Node.js
    timeout /t 3 /nobreak >nul
    exit /b 1
)

REM Install dependencies if needed (but don't wait for it to complete)
if not exist "node_modules" (
    echo Installing dependencies in background...
    start /min /b cmd /c "npm install --silent --no-audit --no-fund"
)

REM Kill existing processes quickly
echo Stopping any existing servers...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3002') do taskkill /pid %%a /f >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| findstr :3001') do taskkill /pid %%a /f >nul 2>&1

echo.
echo Starting servers and opening browser immediately...

REM Start backend server in background immediately
echo Starting Unified Workflow Logger Terminal...
start "📊 Unified Workflow Logger - Job Search App Tracker" cmd /k "title Unified Workflow Logger - Job Search App Tracker && cd /d %CD%\app\backend && echo. && echo ================================================ && echo    🚀 UNIFIED WORKFLOW LOGGER STARTED && echo ================================================ && echo. && echo 📋 Tracking: && echo   • User navigation ^& screen transitions && echo   • Button clicks ^& form submissions && echo   • Job scraping processes ^& progress && echo   • API calls ^& backend processes && echo   • Errors ^& system events && echo. && echo ⚙️  Backend server starting... && echo. && node server.js"

REM Start frontend server in background immediately
echo Starting Frontend Server (hidden)...
start /min /b cmd /c "cd /d %CD% && set BROWSER=none && npm start >nul 2>&1"

REM Wait for servers to start before opening browser
echo Waiting for servers to initialize...
timeout /t 5 /nobreak >nul

REM Open browser after servers have time to start
echo Opening application in browser...
start chrome --start-maximized --new-window http://localhost:3001

echo.
echo ========================================
echo   ✅ APPLICATION STARTED!
echo ========================================
echo.
echo 📊 Unified Workflow Logger: ACTIVE
echo   Terminal shows all app activity and processes
echo.
echo 🖥️  Frontend Server: STARTING (port 3001) - Hidden
echo 🚀 Backend Server: STARTING (port 3002) - Visible in logger
echo.
echo Application: http://localhost:3001
echo.
echo 📋 Logger Terminal tracks:
echo   • Where user navigates (Welcome → Searching → Searched...)
echo   • What user clicks (buttons, forms, actions)
echo   • Job scraping progress ^& results (parallel processing)
echo   • API requests ^& responses 
echo   • Process workflows with indentation
echo   • Errors ^& system events
echo.
echo NOTE: Browser opens after 5-second delay to allow servers to start
echo If app still doesn't load, wait a few more seconds and refresh browser
echo.
echo To stop: Close the Unified Workflow Logger terminal
echo.
echo Launcher closing - app continues with unified logger.
exit /b 0 