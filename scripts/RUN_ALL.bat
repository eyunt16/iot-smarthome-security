@echo off
REM ========================================
REM IoT Smart Home - One-Click Setup & Run
REM ========================================
REM This file will automatically:
REM 1. Check your system
REM 2. Start Backend
REM 3. Start Frontend
REM 4. Open Dashboard

setlocal enabledelayedexpansion

echo.
echo ════════════════════════════════════════════════
echo   IoT Smart Home - Complete Setup & Run
echo ════════════════════════════════════════════════
echo.

REM Navigate to project root
cd /d "%~dp0"
echo Working Directory: %cd%
echo.

REM Check if this is the right directory
if not exist "backend\app.py" (
    echo Error: backend\app.py not found!
    echo Please run this file from: c:\Pre-thesis\IOT\
    pause
    exit /b 1
)

echo ✅ Project structure verified
echo.

REM Start Backend in new window
echo Starting Backend Server (Port 5000)...
start "IoT Backend" cmd /k "cd backend && venv\Scripts\activate.bat && python app.py"

echo Waiting for backend to start...
timeout /t 5 /nobreak

REM Start Frontend in new window
echo Starting Frontend Server (Port 5173)...
start "IoT Frontend" cmd /k "cd frontend && npm run dev"

echo Waiting for frontend to start...
timeout /t 8 /nobreak

REM Open browser
echo Opening Dashboard...
start http://localhost:5173

echo.
echo ════════════════════════════════════════════════
echo ✅ All services started!
echo ════════════════════════════════════════════════
echo.
echo Backend:   http://localhost:5000
echo Frontend:  http://localhost:5173
echo.
echo Login with:
echo   Username: admin
echo   Password: admin123@
echo.
echo ⚠️  Keep both terminal windows open!
echo.
pause
