@echo off
REM Start IoT Backend Server

REM Navigate to backend directory
cd /d "%~dp0"

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install requirements if needed
pip install -r requirements.txt

REM Start Flask server
echo.
echo ====================================
echo Starting IoT Smart Home Backend...
echo ====================================
echo.
python app.py

pause
