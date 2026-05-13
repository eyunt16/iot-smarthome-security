# 📊 Backend Data Organization Guide

**Status:** ✅ Reorganized & Optimized  
**Date:** April 19, 2026

---

## 🎯 What Changed?

Your backend data structure has been completely reorganized to make tracking easier:

### **Old Structure ❌**
```
backend/
├── database.db (single table: sensor_data)
├── Only stored topic + payload
└── No device state tracking
```

### **New Structure ✅**
```
backend/
├── 📁 data/ (all data files here)
│   └── iot_smart_home.db (6 organized tables)
├── 📁 config/ (configuration management)
│   └── config.py (all settings in one place)
├── monitor.py (track everything easily!)
└── (rest of backend code)
```

---

## 📋 Database Tables

### **1. `users` - User Management**
Tracks login information and access.
```
- id (primary key)
- username (unique)
- password
- created_at (when account was created)
- last_login (last login time)
- is_active (account status)
```

### **2. `devices` - Device Configuration**
Tracks all connected devices and their status.
```
- id (primary key)
- device_name (e.g., "ESP32_SmartHome_001")
- device_type (e.g., "IoT Device")
- device_id (unique identifier)
- status (online/offline)
- last_seen (last connection time)
- created_at (registration time)
```

### **3. `sensor_readings` - Sensor Data** ⭐ **MAIN DATA**
The core sensor data storage - every reading saved here.
```
- id (primary key)
- device_id (which device sent this)
- sensor_name (temperature, humidity, etc.)
- sensor_value (the actual reading)
- sensor_unit (°C, %, lux, etc.)
- topic (MQTT topic)
- payload (raw JSON)
- timestamp (when it was recorded)
```

### **4. `device_state` - Current Device State**
Always shows the LATEST state of each device.
```
- id (primary key)
- device_name (light1, fan, motor, etc.)
- state_value (current brightness, speed, etc.)
- state_type (string, number, etc.)
- last_updated (when it changed)
- updated_by (api, mqtt, system)
```

### **5. `api_logs` - API Request Tracking**
Logs every API call for monitoring and debugging.
```
- id (primary key)
- endpoint (which API endpoint)
- method (GET, POST, etc.)
- status_code (200, 404, 500, etc.)
- request_data (what was sent)
- response_data (what was returned)
- timestamp (when it happened)
```

### **6. `mqtt_logs` - MQTT Message Tracking**
Logs every MQTT message for monitoring.
```
- id (primary key)
- topic (which topic)
- message (the content)
- direction (incoming/outgoing)
- timestamp (when it happened)
```

---

## 🔍 How to Track Your Data

### **Option 1: Visual Dashboard (Easiest)**
```powershell
cd backend
python monitor.py
```

This shows:
- 📊 System overview
- 📡 Latest sensor readings
- 🎮 Device states
- 🔌 Recent API calls
- 📡 Recent MQTT messages
- 📈 Sensor statistics
- 📊 API hourly stats

### **Option 2: Specific Queries**
```powershell
# Show only sensor data
python monitor.py sensors

# Show only device states
python monitor.py devices

# Show API calls (last 20)
python monitor.py api 20

# Show MQTT messages (last 15)
python monitor.py mqtt 15

# Show statistics
python monitor.py stats

# Clean old data (older than 30 days)
python monitor.py cleanup 30
```

### **Option 3: Direct Database Access**
```powershell
# Open SQLite shell
sqlite3 data/iot_smart_home.db

# Common queries:
# Get latest readings:
SELECT sensor_name, sensor_value, timestamp FROM sensor_readings ORDER BY timestamp DESC LIMIT 10;

# Get device states:
SELECT device_name, state_value, last_updated FROM device_state;

# Get today's API calls:
SELECT endpoint, method, status_code, COUNT(*) FROM api_logs WHERE date(timestamp) = date('now') GROUP BY endpoint, method;
```

---

## ⚙️ Configuration System

All settings are now in one place: `config/config.py`

### **Easy to Change:**

**Backend Settings:**
```python
config.FLASK_PORT = 5000
config.FLASK_HOST = "0.0.0.0"
config.FLASK_DEBUG = True
```

**MQTT Settings:**
```python
config.MQTT_BROKER = "4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud"
config.MQTT_PORT = 8883
config.MQTT_USERNAME = "Tuyen"
config.MQTT_PASSWORD = "123456789tT"
```

**Device Configuration:**
```python
config.DEVICES = {
    'light1': {'name': 'Light 1', 'type': 'pwm_light', 'min': 0, 'max': 100, ...},
    'light2': {...},
    'fan': {...},
    ...
}
```

**Sensor Configuration:**
```python
config.SENSORS = {
    'temperature': {'name': 'Temperature', 'unit': '°C', ...},
    'humidity': {...},
    ...
}
```

### **Use in Code:**
```python
from config.config import config

# In your routes:
broker = config.MQTT_BROKER
port = config.MQTT_PORT
devices = config.DEVICES
```

---

## 📁 File Locations

| Item | Location | Purpose |
|------|----------|---------|
| **Database** | `backend/data/iot_smart_home.db` | All system data |
| **Config** | `backend/config/config.py` | All settings |
| **Monitor** | `backend/monitor.py` | Tracking dashboard |
| **Models** | `backend/models/sensor_model.py` | Data access layer |
| **Database Functions** | `backend/services/database.py` | DB operations |

---

## 📊 Example: Tracking a Device

### **Scenario:** User sets Light1 to 75% brightness

**Data Flow:**
```
1. Frontend sends: POST /api/device/light/1 with brightness=75
   ↓
2. API logs saved to: api_logs table
   - endpoint: "/api/device/light/1"
   - method: "POST"
   - status_code: 200
   - timestamp: 2026-04-19 10:30:45
   ↓
3. Backend publishes MQTT: home/tuyenesp32/control
   - message: {"light1": 75}
   ↓
4. MQTT logged to: mqtt_logs table
   - topic: "home/tuyenesp32/control"
   - message: '{"light1": 75}'
   - direction: "outgoing"
   - timestamp: 2026-04-19 10:30:46
   ↓
5. Device state updated in: device_state table
   - device_name: "light1"
   - state_value: "75"
   - last_updated: 2026-04-19 10:30:46
   - updated_by: "api"
   ↓
6. ESP32 receives and CONFIRMS: home/tuyenesp32/sensors
   - message: {"light": 75}
   ↓
7. Confirmation logged to: mqtt_logs table
   - direction: "incoming"
   ↓
8. Sensor reading saved to: sensor_readings table
   - device_id: "ESP32_SmartHome_001"
   - sensor_name: "light_feedback"
   - sensor_value: 75
   - timestamp: 2026-04-19 10:30:47
```

**Now you can track:**
- ✅ What API calls were made (`api_logs`)
- ✅ Current light state (`device_state`)
- ✅ MQTT communication (`mqtt_logs`)
- ✅ Actual sensor feedback (`sensor_readings`)

---

## 🎨 Practical Use Cases

### **Use Case 1: "Why isn't the light changing?"**
```powershell
# Check device state
python monitor.py devices

# Check recent API calls
python monitor.py api 5

# Check MQTT messages
python monitor.py mqtt 10

# Look for errors in logs
```

### **Use Case 2: "How many sensor readings today?"**
```powershell
# View sensor statistics
python monitor.py stats

# Or query directly:
sqlite3 data/iot_smart_home.db
SELECT COUNT(*) FROM sensor_readings WHERE date(timestamp) = date('now');
```

### **Use Case 3: "Performance check"**
```powershell
# Show system overview
python monitor.py overview

# Database size: tells you if cleanup is needed
# Total readings: tells you how much data collected
# API calls today: tells you usage level
```

### **Use Case 4: "Maintain database"**
```powershell
# Clean data older than 30 days
python monitor.py cleanup 30

# This keeps database small and fast
```

---

## 🚀 New Functions Available

### **In `database.py`:**

```python
# Save sensor data (automatically called by MQTT)
save_sensor_data(topic, payload, device_id)

# Update device state (called by API)
update_device_state(device_name, state_value, state_type, updated_by)

# Get current device state
get_device_state(device_name)

# Log API calls (call this in your routes)
log_api_call(endpoint, method, status_code, request_data, response_data)

# Log MQTT messages (call this in MQTT handlers)
log_mqtt_message(topic, message, direction)

# Clean old data
cleanup_old_data(days=30)
```

### **In `sensor_model.py`:**

```python
# Get latest readings from all sensors
get_latest_data()

# Get latest reading for specific sensor
get_latest_by_sensor(sensor_name)

# Get historical data with filters
get_history(limit=50, sensor_name=None, device_id=None)

# Get current device state
get_device_state(device_name)

# Get states of all devices
get_all_device_states()

# Get system statistics
get_stats()
```

---

## ✅ Migration Complete

### **Old way:**
- ❌ Database at root with one table
- ❌ Hard to organize
- ❌ No tracking of API/MQTT
- ❌ Settings scattered in code

### **New way:**
- ✅ Organized `data/` folder
- ✅ 6 organized tables
- ✅ Complete logging system
- ✅ Centralized configuration
- ✅ Easy monitoring dashboard
- ✅ Better performance with indexes
- ✅ Easy maintenance and cleanup

---

## 🎓 Summary

**Your data is now organized like this:**

```
📊 Sensor Readings
   └─ Every temperature, humidity, light level reading
      Organized by: device → sensor → timestamp

🎮 Device States
   └─ Current state of each device
      Organized by: device name → state value

🔌 API Logs
   └─ Every API call made
      Organized by: endpoint → timestamp

📡 MQTT Logs
   └─ Every MQTT message
      Organized by: topic → direction → timestamp

⚙️ Configuration
   └─ All settings in one file
      Easy to find and modify

📈 Monitor
   └─ Dashboard to view everything
      Run: python monitor.py
```

**To use it:**
```
1. Backend runs automatically
2. Data is organized by tables
3. Use monitor.py to track everything
4. Check config.py to change settings
```

**Ready to track!** 🚀

