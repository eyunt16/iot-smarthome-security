# 📁 Data Folder

**All backend data files are stored here for easy organization.**

---

## 📂 Contents

### `iot_smart_home.db`
Main SQLite database containing:
- **users** - User authentication
- **devices** - Device registry
- **sensor_readings** - All sensor data (⭐ Main data)
- **device_state** - Current device states
- **api_logs** - API call tracking
- **mqtt_logs** - MQTT message tracking

---

## 📊 Size Management

**Database Size:**
```
Initial:        < 100 KB
After 1 day:    1-5 MB (depending on sensor frequency)
After 1 month:  30-150 MB
```

**When to clean:**
- Database size > 100 MB
- Running low on disk space
- Want to archive old data

**Clean old data:**
```powershell
cd ..\          # Go to backend folder
python monitor.py cleanup 30    # Delete 30+ days old
python monitor.py cleanup 7     # Delete 7+ days old
```

---

## 🔍 View Data

### **Using Monitor Dashboard (Easiest)**
```powershell
cd ..\          # Go to backend folder
python monitor.py
```

### **Using SQLite Directly**
```powershell
sqlite3 iot_smart_home.db

# View tables:
.tables

# View sensor data:
SELECT * FROM sensor_readings LIMIT 10;

# View device states:
SELECT * FROM device_state;

# Exit:
.quit
```

### **Using Python**
```python
from services.database import get_db_path
from models.sensor_model import sensor_model

# Get latest sensor data
data = sensor_model.get_latest_data()
print(data)

# Get sensor history
history = sensor_model.get_history(limit=50)
print(history)

# Get device states
states = sensor_model.get_all_device_states()
print(states)

# Get stats
stats = sensor_model.get_stats()
print(stats)
```

---

## 🚀 Backup Your Data

**Before cleaning or updating:**
```powershell
# Copy the database
Copy-Item iot_smart_home.db iot_smart_home.backup.db

# Or copy entire data folder
Copy-Item . .\data_backup -Recurse
```

---

## ⚠️ Important Notes

- ✅ Database auto-created on first backend run
- ✅ Data automatically saved from MQTT and API
- ✅ Indexes created for fast queries
- ⚠️ Don't edit database directly unless you know SQL
- ⚠️ Always backup before cleaning old data
- ⚠️ Keep this folder backed up regularly

---

## 🎯 Quick Start

1. **Start backend:** `python app.py`
2. **Check data:** `python monitor.py`
3. **View details:** `python monitor.py sensors`
4. **Clean old data:** `python monitor.py cleanup 30`
5. **Backup data:** Copy this folder somewhere safe

---

