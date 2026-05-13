# 🚀 COMPLETE STARTUP GUIDE

**⚠️ IMPORTANT: Start backend FIRST, then frontend!**

---

## ✅ Correct Startup Order

### **Step 1: Start Backend (Terminal 1)**

**Windows - Just double-click this file:**
```
📁 c:\Pre-thesis\IOT\backend\
   ↓
📄 START_BACKEND.bat
```

**OR PowerShell:**
```powershell
cd c:\Pre-thesis\IOT\backend
& .\start_backend.ps1
```

**Wait for this message:**
```
* Running on http://0.0.0.0:5000
```

✅ Backend is ready when you see: `Running on`

---

### **Step 2: Open New Terminal - Start Frontend**

**Once backend is running (don't close it!), open NEW terminal:**

```powershell
cd c:\Pre-thesis\IOT\frontend
npm run dev
```

**Wait for this message:**
```
➜ Local: http://localhost:5173/
```

✅ Frontend is ready when you see this URL

---

### **Step 3: Open Browser**

Open: **http://localhost:5173/**

Login with:
- **Username:** admin
- **Password:** admin123@

---

## ✅ Success Checklist

- [ ] **Backend Terminal:** Shows `Running on http://0.0.0.0:5000`
- [ ] **Frontend Terminal:** Shows `Local: http://localhost:5173/`
- [ ] **Browser:** http://localhost:5173/ loads without errors
- [ ] **Dashboard:** Login page appears
- [ ] **After Login:** Controls and sensor data visible

---

## ❌ Troubleshooting: "Connection refused"

### **Check 1: Is Backend Running?**
```
Look at your backend terminal. Do you see:
"* Running on http://0.0.0.0:5000"

If NO → Go back and start backend (Step 1)
If YES → Continue to Check 2
```

### **Check 2: Port 5000 Available?**
```powershell
netstat -ano | findstr :5000
```

If something is using port 5000:
```powershell
# Find process
Get-Process -Id <PID>

# Kill it
Stop-Process -Id <PID> -Force

# Restart backend
```

### **Check 3: Frontend Trying Wrong URL?**
```
Frontend looks for: http://localhost:5000/api
Make sure backend is actually on port 5000
```

### **Check 4: Firewall Blocking?**
Windows Defender might block Flask. Try:
```powershell
# Temporarily disable firewall (caution!)
netsh advfirewall set allprofiles state off

# Then restart backend
```

---

## 🎯 Terminal Setup (Visual Guide)

```
┌─────────────────────────────────────────────────────────┐
│ Terminal 1: Backend                 │ Terminal 2: Frontend
├────────────────────────────────────┼────────────────────────
│ $ cd backend                         │ (wait for backend)
│ $ & .\start_backend.ps1              │
│                                      │
│ 🔄 Activating venv...               │
│ ✅ Installing deps...                │
│ ✅ Running on                        │ $ cd frontend
│    http://0.0.0.0:5000              │ $ npm run dev
│                                      │
│ KEEP THIS RUNNING!                   │ ✅ Local: http://localhost:5173/
│ DO NOT CLOSE!                        │
└────────────────────────────────────┴────────────────────────

Then open: http://localhost:5173/ in browser
```

---

## 📋 What Each Terminal Should Show

### **Terminal 1 (Backend) - Success:**
```
====================================
Starting IoT Smart Home Backend...
====================================

🔄 Activating virtual environment...
📦 Installing dependencies...
Requirement already satisfied: Flask==2.3.3
Requirement already satisfied: Flask-CORS==4.0.0
Requirement already satisfied: paho-mqtt==1.6.1
✅ Starting Flask server...
Expected: 'Running on http://0.0.0.0:5000'

🔄 Connecting to MQTT broker: 4d9428...
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

### **Terminal 2 (Frontend) - Success:**
```
npm run dev

> vite

VITE v4.3.9  ready in 523 ms

➜ Local:   http://localhost:5173/
➜ Press q + enter to quit
```

### **Browser - Success:**
```
URL: http://localhost:5173/

[Smart Home IoT Dashboard]
┌─────────────────────────┐
│   Sign in to access     │
│   IoT device controls   │
├─────────────────────────┤
│ Username: [admin    ]   │
│ Password: [admin123@]   │
│            [Login]      │
└─────────────────────────┘
```

---

## 🚨 Common Mistakes

| Mistake | Fix |
|---------|-----|
| Closing backend terminal | DON'T! Keep it running |
| Starting frontend before backend | Start backend FIRST |
| Wrong port (3000, 8000, etc) | Backend MUST be on 5000 |
| Firewall blocking | Disable temporarily or allow Flask |
| Old terminal still running | Kill Python processes, restart |

---

## 🔄 Restart Everything (If Stuck)

```powershell
# Kill all Python processes
Stop-Process -Name python -Force

# Kill all Node processes
Stop-Process -Name node -Force

# Start fresh:
# Terminal 1 → Backend (Step 1)
# Terminal 2 → Frontend (Step 2)
# Browser → http://localhost:5173/
```

---

## ✨ Once Everything Works

You'll see:
- ✅ Dashboard loads
- ✅ Login succeeds
- ✅ Sensor data appears (or "Loading...")
- ✅ Controls respond to clicks
- ✅ No error messages

**That means your full IoT system is running!** 🎉

