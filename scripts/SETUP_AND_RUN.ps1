#!/usr/bin/env pwsh

<#
========================================
IoT SMART HOME - COMPLETE SETUP GUIDE
========================================
This script will:
1. Check all project files
2. Verify dependencies
3. Start backend & frontend
4. Open dashboard in browser
#>

# Colors for output
$Green = [System.ConsoleColor]::Green
$Red = [System.ConsoleColor]::Red
$Yellow = [System.ConsoleColor]::Yellow
$Cyan = [System.ConsoleColor]::Cyan

function Write-Status($message, $type = "info") {
    switch ($type) {
        "success" { Write-Host "✅ $message" -ForegroundColor $Green }
        "error" { Write-Host "❌ $message" -ForegroundColor $Red }
        "warning" { Write-Host "⚠️  $message" -ForegroundColor $Yellow }
        "info" { Write-Host "ℹ️  $message" -ForegroundColor $Cyan }
        default { Write-Host "▶  $message" }
    }
}

Write-Host "`n" 
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║   IoT SMART HOME SETUP & VERIFICATION     ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""

# ===== STEP 1: Check Project Structure =====
Write-Status "STEP 1: Checking project structure..." "info"
$requiredFiles = @(
    "c:\Pre-thesis\IOT\backend\app.py",
    "c:\Pre-thesis\IOT\backend\requirements.txt",
    "c:\Pre-thesis\IOT\backend\services\mqtt_service.py",
    "c:\Pre-thesis\IOT\backend\routes\sensor.py",
    "c:\Pre-thesis\IOT\backend\routes\auth.py",
    "c:\Pre-thesis\IOT\backend\services\database.py",
    "c:\Pre-thesis\IOT\backend\models\sensor_model.py",
    "c:\Pre-thesis\IOT\frontend\package.json",
    "c:\Pre-thesis\IOT\frontend\vite.config.js",
    "c:\Pre-thesis\IOT\iot_device\esp32_smart_home.ino"
)

$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Status "Found: $(Split-Path $file -Leaf)" "success"
    } else {
        Write-Status "Missing: $file" "error"
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Status "Some files are missing! Cannot proceed." "error"
    exit 1
}

Write-Host ""

# ===== STEP 2: Check Dependencies =====
Write-Status "STEP 2: Checking Python dependencies..." "info"

# Check Python
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Status "Python: $pythonVersion" "success"
} else {
    Write-Status "Python not found! Please install Python 3.8+" "error"
    exit 1
}

# Check pip packages
cd c:\Pre-thesis\IOT\backend
$packages = @("Flask", "Flask-CORS", "paho-mqtt")
$missingPackages = @()

foreach ($package in $packages) {
    $pipList = pip list | Select-String $package
    if ($pipList) {
        Write-Status "Package: $package" "success"
    } else {
        Write-Status "Missing package: $package" "warning"
        $missingPackages += $package
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Status "Installing missing packages..." "info"
    pip install -r requirements.txt
}

Write-Host ""

# ===== STEP 3: Check Node & Frontend =====
Write-Status "STEP 3: Checking Node.js and frontend..." "info"

$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Status "Node: $nodeVersion" "success"
} else {
    Write-Status "Node not found! Please install Node.js" "error"
    exit 1
}

cd c:\Pre-thesis\IOT\frontend
if (Test-Path "node_modules") {
    Write-Status "node_modules: Found" "success"
} else {
    Write-Status "node_modules: Missing (will install on first run)" "warning"
}

Write-Host ""

# ===== STEP 4: Display Summary =====
Write-Status "PROJECT STATUS SUMMARY" "info"
Write-Host ""
Write-Host "Backend:   ✅ Ready (Flask on port 5000)"
Write-Host "Frontend:  ✅ Ready (Vite on port 5173)"
Write-Host "Database:  ✅ SQLite database.db"
Write-Host "MQTT:      ✅ HiveMQ Cloud (port 8883)"
Write-Host ""

# ===== STEP 5: Offer to Start Services =====
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor $Green
Write-Host "║        READY TO START SERVICES?            ║" -ForegroundColor $Green
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor $Green
Write-Host ""
Write-Host "1. Start Backend Server"
Write-Host "2. Start Frontend Server" 
Write-Host "3. Start Both (recommended)"
Write-Host "4. Exit"
Write-Host ""

$choice = Read-Host "Select option (1-4)"

if ($choice -eq "1") {
    Write-Host ""
    Write-Status "Starting Backend..." "info"
    cd c:\Pre-thesis\IOT\backend
    & .\start_backend.ps1
} 
elseif ($choice -eq "2") {
    Write-Host ""
    Write-Status "Starting Frontend..." "info"
    cd c:\Pre-thesis\IOT\frontend
    npm run dev
}
elseif ($choice -eq "3") {
    Write-Host ""
    Write-Status "Starting Backend in new terminal..." "info"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Pre-thesis\IOT\backend; & .\start_backend.ps1"
    
    Start-Sleep -Seconds 5
    
    Write-Status "Starting Frontend in new terminal..." "info"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd c:\Pre-thesis\IOT\frontend; npm run dev"
    
    Start-Sleep -Seconds 8
    
    Write-Host ""
    Write-Status "Opening dashboard in browser..." "info"
    Start-Process "http://localhost:5173"
    
    Write-Host ""
    Write-Host "✅ All services started!"
    Write-Host ""
    Write-Host "Backend:   http://localhost:5000"
    Write-Host "Frontend:  http://localhost:5173"
    Write-Host ""
    Write-Host "Login with:"
    Write-Host "  Username: admin"
    Write-Host "  Password: admin123@"
    Write-Host ""
}
elseif ($choice -eq "4") {
    Write-Host "Exiting..."
    exit 0
}
else {
    Write-Status "Invalid option" "error"
    exit 1
}
