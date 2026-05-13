# 🎮 Backend Monitoring - Quick Commands

**Easy way to check what's happening in your backend!**

---

## 🚀 Start Everything

```powershell
cd c:\Pre-thesis\IOT
RUN_ALL.bat
```

---

## 📊 Monitor Your Data (New!)

### **Full Dashboard (See Everything)**
```powershell
cd backend
python monitor.py
```
Shows:
- 📊 System stats
- 📡 Latest sensors
- 🎮 Device states
- 🔌 Recent API calls
- 📡 Recent MQTT messages
- 📈 Statistics

---

## 🎯 Quick Commands

### **View Sensor Data**
```powershell
python monitor.py sensors
```
Shows all latest sensor readings

### **View Device States**
```powershell
python monitor.py devices
```
Shows current state of light1, light2, fan, motor, stepper

### **View API Calls**
```powershell
python monitor.py api          # Last 10 API calls
python monitor.py api 20       # Last 20 API calls
```

### **View MQTT Messages**
```powershell
python monitor.py mqtt         # Last 10 messages
python monitor.py mqtt 20      # Last 20 messages
```

### **View Statistics**
```powershell
python monitor.py stats
```
Shows min/max/avg for each sensor

### **System Overview**
```powershell
python monitor.py overview
```
Database size, total readings, API calls today

---

## 📁 Data Files

| File | Purpose |
|------|---------|
| `data/iot_smart_home.db` | Main database (6 organized tables) |
| `config/config.py` | All settings in one place |
| `monitor.py` | Monitoring dashboard |

---

## 🧹 Maintenance

### **Clean Old Data**
```powershell
# Delete readings older than 30 days
python monitor.py cleanup 30

# Delete readings older than 7 days
python monitor.py cleanup 7
```

This keeps your database small and fast! 

---

## 🔧 Change Settings

Edit: `backend/config/config.py`

```python
# Change backend port
config.FLASK_PORT = 5000

# Change MQTT broker
config.MQTT_BROKER = "your-broker.com"

# Add new device
config.DEVICES['new_device'] = {
    'name': 'New Device',
    'type': 'device_type',
    ...
}
```

Then restart: `python app.py`

---

## 💡 Common Tasks

### **"What's the latest temperature?"**
```powershell
python monitor.py sensors
# Look for: "temperature" row
```

### **"Is the fan on?"**
```powershell
python monitor.py devices
# Look for: "fan" row under "State" column
```

### **"How many API calls today?"**
```powershell
python monitor.py overview
# Look for: "API Calls Today"
```

### **"Is the database growing too big?"**
```powershell
python monitor.py overview
# Check database size
# If > 10,000 KB, run: python monitor.py cleanup 30
```

### **"Debug API error"**
```powershell
python monitor.py api 20
# Look for red ❌ status codes (400, 404, 500)
```

### **"Did MQTT message send?"**
```powershell
python monitor.py mqtt 10
# Look for: Topic and "outgoing" direction
```

---

## ✅ Everything Organized!

**Before:** One database.db file with one table  
**After:** 
- 📁 `data/` folder with organized database
- ⚙️ `config/` folder with settings
- 📊 `monitor.py` to track everything
- 📈 6 organized tables for different data types

**Start monitoring:** `python monitor.py`

