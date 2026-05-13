#!/usr/bin/env pwsh

# IoT Smart Home Backend Startup Script

Write-Host "====================================`n" -ForegroundColor Green
Write-Host "Starting IoT Smart Home Backend..." -ForegroundColor Green
Write-Host "====================================`n" -ForegroundColor Green

# Set location to script directory
$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $backendDir

Write-Host "📍 Working Directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Yellow
if (Test-Path "venv\Scripts\Activate.ps1") {
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "❌ Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please create venv first: python -m venv venv" -ForegroundColor Red
    exit 1
}

# Install requirements
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

# Start Flask
Write-Host "`n✅ Starting Flask server..." -ForegroundColor Green
Write-Host "Expected: 'Running on http://0.0.0.0:5000'" -ForegroundColor Cyan
Write-Host "`n"

python app.py
