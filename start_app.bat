@echo off
title Automated Job Search App
color 0A
cls

echo.
echo ========================================
echo   Automated Job Search Application
echo ========================================
echo.

echo Quick startup sequence...
echo.

REM Check Node.js silently
node --version >nul 2>&1 || (
    echo ERROR: Node.js required!
    pause
    exit /b 1
)

REM Install dependencies if needed (silent)
if not exist "node_modules" (
    echo Installing dependencies...
    npm install --silent --no-audit --no-fund
)

REM Start backend server first
echo Starting backend server (port 3002)...
start /min /b "" cmd /c "cd /d %CD%\backend && node server.js >nul 2>&1"

REM Start frontend server
echo Starting frontend server (port 3001)...
start /min /b "" cmd /c "cd /d %CD% && set BROWSER=none && npm start >nul 2>&1"

REM Wait briefly for React dev server to start
echo Waiting for React dev server to initialize...
timeout /t 2 /nobreak >nul

REM Open browser maximized immediately
echo Opening browser maximized...
start chrome --start-maximized --new-window http://localhost:3001

echo ✅ Setup complete! Browser should open automatically.

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Services are running in background:
echo   - Backend: http://localhost:3002
echo   - Frontend: http://localhost:3001
echo.
echo Browser should open automatically.
echo If not, manually go to: http://localhost:3001
echo.
echo Press any key to close this window...
pause >nul 