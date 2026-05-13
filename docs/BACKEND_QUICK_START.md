# Backend Quick Start & Troubleshooting Guide

## 🚀 Quick Start (5 Minutes)

### **Step 1: Install Dependencies**
```bash
cd c:\Pre-thesis\IOT\backend
python -m venv venv  # If venv doesn't exist
venv\Scripts\activate
pip install -r requirements.txt
```

✅ Expected: `Successfully installed Flask-2.3.3 Flask-CORS-4.0.0 paho-mqtt-1.6.1`

### **Step 2: Start Backend**
```bash
python app.py
```

✅ Expected output:
```
🔄 Connecting to MQTT broker: 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud:8883
✅ Connected to MQTT broker securely (MQTTS port 8883)
📥 Subscribed to: home/tuyenesp32/sensors
✨ Running on http://127.0.0.1:5000
```

### **Step 3: Test Backend**
```bash
# In another terminal, test the API
curl http://localhost:5000/api/data
```

✅ Expected response:
```json
{
  "temperature": null,
  "humidity": null,
  "light": null,
  "motion": null,
  "timestamp": null
}
```
(null is OK until ESP32 sends data)

### **Step 4: Start Frontend**
```bash
cd c:\Pre-thesis\IOT\frontend
npm run dev
```

✅ Expected: `Local: http://localhost:5173/`

---

## 🔍 Debugging Checklist

### **Backend Won't Connect to MQTT**

**❌ Error:** `MQTT Connection failed`

**✅ Fixes:**
```python
# Check in mqtt_service.py:
1. MQTT_BROKER = "4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud"  ✓
2. MQTT_PORT = 8883  ✓ (NOT 1883)
3. MQTT_USER = "Tuyen"  ✓
4. MQTT_PASS = "123456789tT"  ✓
5. CA_CERT present  ✓
```

**Test connection:**
```bash
# Install mosquitto-clients
# Then test:
mosquitto_pub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT -t test -m "hello"
```

---

### **No Sensor Data Showing**

**❌ Issue:** Dashboard shows null for all sensors

**✅ Checks:**
```
1. Is ESP32 running?
   → Check Serial Monitor: "✅ Connected to MQTT broker securely"

2. Are topics correct?
   → ESP32 publishes to: home/tuyenesp32/sensors  ✓
   → Backend subscribes to: home/tuyenesp32/sensors  ✓

3. Is MQTT connection alive?
   → Check backend console: "✅ Connected to MQTT broker securely"

4. Database file exists?
   → Check: c:\Pre-thesis\IOT\backend\database.db
```

**Manual test:**
```bash
# Subscribe to sensor topic in separate terminal
mosquitto_sub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT -t home/tuyenesp32/sensors

# Should see JSON messages from ESP32 every 3 seconds
```

---

### **Frontend Can't Reach Backend**

**❌ Error:** `CORS error` or `Failed to fetch from localhost:5000`

**✅ Fixes:**
```
1. Backend running on port 5000?
   → Check: http://localhost:5000/api/data in browser
   
2. CORS enabled in Flask?
   → Check app.py: CORS(app)  ✓
   
3. Frontend API URL correct?
   → Check: http://localhost:5000 (not 5001, 3000, etc)
```

---

### **Database File Issues**

**❌ Error:** `database.db locked` or `no such table`

**✅ Fixes:**
```bash
# Delete old database
rm c:\Pre-thesis\IOT\backend\database.db

# Backend will recreate it automatically
python app.py
```

---

## 📊 API Testing Commands

### **Test Sensor Data Endpoint**
```bash
curl -X GET http://localhost:5000/api/data
```

### **Test Historical Data**
```bash
curl -X GET http://localhost:5000/api/history?limit=10
```

### **Test Device Control (Light)**
```bash
curl -X POST http://localhost:5000/api/device/light/1 \
  -H "Content-Type: application/json" \
  -d '{"brightness": 75}'
```

### **Test Device Control (Fan)**
```bash
curl -X POST http://localhost:5000/api/device/fan \
  -H "Content-Type: application/json" \
  -d '{"speed": 60}'
```

### **Test Device Control (Motor)**
```bash
curl -X POST http://localhost:5000/api/device/motor \
  -H "Content-Type: application/json" \
  -d '{"direction": "forward", "speed": 80}'
```

### **Test Device Control (Stepper)**
```bash
curl -X POST http://localhost:5000/api/device/stepper \
  -H "Content-Type: application/json" \
  -d '{"direction": "cw"}'
```

---

## 🔄 Full System Test Flow

### **1. Verify Each Component Starts**
```
✅ Backend: python app.py
✅ Frontend: npm run dev
✅ ESP32: Serial Monitor showing "Connected to MQTT"
```

### **2. Check MQTT Connections**
```bash
# Terminal 1: Subscribe to sensor topic
mosquitto_sub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT -t home/tuyenesp32/sensors

# Should see JSON messages every 3 seconds
{"temperature": 24.5, "humidity": 65.3, ...}
```

### **3. Send Test Command**
```bash
# Terminal 2: Publish control command
mosquitto_pub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT \
  -t home/tuyenesp32/control \
  -m '{"device":"light1","action":"brightness","value":75}'

# Check ESP32 Serial Monitor:
# "💡 Light 1 brightness set to 75%"
```

### **4. Verify Frontend**
```
1. Open: http://localhost:5173/
2. Login: admin / admin123@
3. Should see dashboard
4. Check if sensor data is showing
5. Try clicking light/fan/motor controls
```

---

## 📝 Configuration Files

### **requirements.txt** (Fixed)
```
Flask==2.3.3
Flask-CORS==4.0.0
paho-mqtt==1.6.1
```

### **app.py** (No changes needed)
```python
# Entry point for Flask application
# Starts MQTT background thread
# Registers API routes
```

### **services/mqtt_service.py** (Fixed)
✅ Now uses:
- HiveMQ Cloud broker
- Port 8883 (MQTTS)
- TLS/SSL encryption
- CA certificate authentication
- Correct topics: home/tuyenesp32/sensors

### **routes/sensor.py** (Fixed)
✅ Now includes:
- Proper JSON payload parsing
- All device control endpoints
- Input validation
- Error handling

---

## 🆘 Emergency Troubleshooting

### **Backend crashes immediately**
```bash
# Check Python version
python --version  # Should be 3.8+

# Reinstall dependencies
pip uninstall -y Flask Flask-CORS paho-mqtt
pip install -r requirements.txt

# Run with verbose output
python -u app.py
```

### **MQTT keeps disconnecting**
```
1. Check WiFi/internet connection
2. Verify credentials one more time
3. Check HiveMQ Cloud quota
4. Restart Flask: Ctrl+C then python app.py
```

### **Database corrupted**
```bash
# Delete and recreate
rm database.db
python app.py
# Wait 10 seconds for initialization
```

### **Port already in use**
```bash
# Find what's using port 5000
netstat -ano | findstr :5000

# Kill process (Windows PowerShell)
Stop-Process -Id <PID> -Force

# Or change port in app.py
# app.run(port=5001)
```

---

## 📱 Full System Health Check

Run this to verify everything:

```python
# test_system.py
import requests
import paho.mqtt.client as mqtt

# 1. Test API
print("Testing API...")
try:
    r = requests.get('http://localhost:5000/api/data')
    print(f"✅ API responds: {r.status_code}")
except:
    print("❌ API not responding")

# 2. Test MQTT
print("\nTesting MQTT...")
try:
    client = mqtt.Client()
    client.connect("4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud", 8883)
    print("✅ MQTT connects successfully")
    client.disconnect()
except:
    print("❌ MQTT connection failed")

print("\nSystem health check complete!")
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| FULLSTACK_ARCHITECTURE.md | Complete system overview |
| esp32_smart_home.ino | ESP32 firmware |
| app.py | Flask backend entry |
| requirements.txt | Python dependencies |
| services/mqtt_service.py | MQTT integration |
| routes/sensor.py | API endpoints |

---

## ✅ Success Indicators

**Backend working correctly if you see:**
```
✅ Connected to MQTT broker securely (MQTTS port 8883)
✅ Subscribed to: home/tuyenesp32/sensors
✨ Running on http://0.0.0.0:5000
```

**Frontend working correctly if you see:**
```
VITE ready in xxx ms
➜ Local: http://localhost:5173/
Dashboard loads, login succeeds
Sensor data visible
```

**ESP32 working correctly if you see:**
```
✅ WiFi connected!
✅ Connected to MQTT broker securely (MQTTS port 8883)
✅ System initialization complete!
Sensor data publishing every 3 seconds
```

**All layers working if you see:**
```
Frontend receives data from Backend
Backend receives data from MQTT
MQTT receives commands from Frontend
ESP32 executes commands and updates sensors
```

---

**You're all set! Your IoT Smart Home system is ready to go!** 🚀
