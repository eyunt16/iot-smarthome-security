# 📊 Complete IoT Fullstack Architecture Diagrams

## 1. System Overview Diagram

```
╔════════════════════════════════════════════════════════════════════════════╗
║                   IoT SMART HOME FULLSTACK ARCHITECTURE                    ║
╚════════════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (User Interface)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                    ┌─────────────────────────────────┐                     │
│                    │   React Dashboard (Web)         │                     │
│                    │  http://localhost:5173          │                     │
│                    ├─────────────────────────────────┤                     │
│                    │ • Login Page                    │                     │
│                    │ • Sensor Display                │                     │
│                    │ • Device Controls               │                     │
│                    │ • Analytics/History             │                     │
│                    │ • System Health                 │                     │
│                    └─────────────────────────────────┘                     │
│                                                                             │
│              ┌──────────────────────┬──────────────────────┐               │
│              │                      │                      │               │
│        ┌─────▼──────────────┐  ┌────▼──────────────┐  ┌───▼──────────────┐│
│        │ React Native App   │  │ Mobile Dashboard │  │ Desktop Client    ││
│        │ (iOS/Android)      │  │ (Tablet)         │  │ (Chrome/Firefox)  ││
│        └────────────────────┘  └──────────────────┘  └───────────────────┘│
│                                                                             │
│  Communication:                                                            │
│  └── REST API (HTTP)                                                       │
│  └── WebSocket (Real-time updates)                                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                              HTTP REST API
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Backend Services)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│                ┌─────────────────────────────────────────┐                │
│                │ Flask Server (Python)                   │                │
│                │ http://localhost:5000                   │                │
│                ├─────────────────────────────────────────┤                │
│                │                                         │                │
│  ┌─────────────┤ Routes (Blueprints)                    │                │
│  │             │ ├── /api/login (auth_bp)              │                │
│  │             │ ├── /api/data (sensor_bp)              │                │
│  │             │ ├── /api/history (sensor_bp)           │                │
│  │             │ ├── /api/device/light/N (sensor_bp)    │                │
│  │             │ ├── /api/device/fan (sensor_bp)        │                │
│  │             │ ├── /api/device/motor (sensor_bp)      │                │
│  │             │ ├── /api/device/stepper (sensor_bp)    │                │
│  │             │ └── /api/devices/status (sensor_bp)    │                │
│  │             │                                         │                │
│  │             └─────────────────────────────────────────┘                │
│  │                                                                         │
│  └──► Services Layer                                                      │
│       ├── mqtt_service.py (MQTT Client)                                   │
│       │   ├── mqtt_loop() - Background thread                             │
│       │   ├── publish_message() - Send commands                           │
│       │   ├── on_message() - Receive sensor data                          │
│       │   └── Configuration: MQTTS, port 8883                             │
│       │                                                                    │
│       └── database.py (SQLite)                                            │
│           ├── init_db() - Create tables                                   │
│           └── save_sensor_data() - Store data                             │
│                                                                            │
│       Models Layer                                                        │
│       └── sensor_model.py                                                 │
│           ├── get_latest_data()                                           │
│           └── get_history()                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                              MQTTS (Port 8883)
                            TLS/SSL Encryption
                        Username/Password Auth
                                    │
    ┌───────────────────────────────┼────────────────────────────────┐
    │                               │                                │
┌───▼─────────────────────┐   ┌─────▼────────────────────┐  ┌────────▼──────┐
│ DEVICE LAYER            │   │ BROKER LAYER            │  │ STORAGE LAYER  │
├─────────────────────────┤   ├─────────────────────────┤  ├────────────────┤
│                         │   │                         │  │                │
│ ESP32 Microcontroller   │   │ HiveMQ Cloud Broker     │  │ SQLite Database│
│                         │   │                         │  │                │
│ ┌─────────────────────┐ │   │ ┌─────────────────────┐ │  │ ┌────────────┐ │
│ │ Sensors             │ │   │ │ Characteristics     │ │  │ │ Table:     │ │
│ ├─────────────────────┤ │   │ ├─────────────────────┤ │  │ │ sensor_data│ │
│ │ • DHT11             │ │   │ │ Server: 4d9428... │ │  │ │ ├────────────│ │
│ │ • PIR Motion        │ │   │ │ Port: 8883          │ │  │ │ • id        │ │
│ │ • LDR Light         │ │   │ │ Protocol: MQTTS     │ │  │ │ • topic     │ │
│ │ • GPIO Inputs       │ │◄──┤ │ Encryption: TLS/SSL │ │  │ │ • payload   │ │
│ └─────────────────────┘ │   │ │ Auth: Yes           │ │  │ │ • timestamp │ │
│                         │   │ │ Uptime: 99.99%      │ │  │ │ └────────────│ │
│ ┌─────────────────────┐ │   │ └─────────────────────┘ │  │ │               │
│ │ Outputs (PWM)       │ │   │                         │  │ │ Max Size:     │
│ ├─────────────────────┤ │   │ Topics:                 │  │ │ Unlimited     │
│ │ • Light 1           │ │   │ ├─ home/tuyenesp32/    │  │ │ (auto-growth) │
│ │ • Light 2           │ │   │ │   sensors             │  │ │               │
│ │ • Fan               │ │   │ ├─ home/tuyenesp32/    │  │ │ Location:     │
│ │ • DC Motor          │ │───┤ │   control             │  │ │ ./database.db │
│ │ • Stepper Motor     │ │   │ └─ [Reserved]           │  │ │               │
│ └─────────────────────┘ │   │                         │  │ └────────────────│
│                         │   └─────────────────────────┘  │                │
│ Code: 550+ lines        │                               │                │
│ Upload via Arduino IDE  │                               │                │
│ Baud: 115200            │                               │                │
└─────────────────────────┘                               └────────────────┘
```

---

## 2. Data Flow Diagram (Sensor Reading)

```
SENSOR READING & PUBLISHING FLOW:

┌──────────────────────────┐
│  ESP32 Main Loop         │
│  (Every 3 seconds)       │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Read Sensors:           │
│  • DHT11.readTemp()      │
│  • DHT11.readHumidity()  │
│  • analogRead(LDR)       │
│  • digitalRead(MOTION)   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Create JSON Payload                             │
│  {                                               │
│    "temperature": 24.5,                          │
│    "humidity": 65.3,                             │
│    "light": 78,                                  │
│    "motion": false,                              │
│    "timestamp": 45823921                         │
│  }                                               │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Publish via MQTT (SECURE)                       │
│  Topic: home/tuyenesp32/sensors                  │
│  Port: 8883                                      │
│  Encryption: TLS/SSL                             │
│  Auth: Tuyen / 123456789tT                       │
└────────┬─────────────────────────────────────────┘
         │
         ▼ (Encrypted over internet)
┌──────────────────────────────────────────────────┐
│  HiveMQ Cloud Broker                             │
│  Stores message temporarily                      │
└────────┬─────────────────────────────────────────┘
         │
         ├─────────────────────────────┐
         │                             │
         ▼                             ▼
┌────────────────────┐       ┌─────────────────────┐
│ Backend Subscriber │       │ Frontend Subscriber │
│ (daemon thread)    │       │ (JavaScript client) │
└────────┬───────────┘       └─────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Backend on_message() callback                   │
│  Parse JSON payload                              │
│  Extract data fields                             │
│  Save to SQLite database                         │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  SQLite Database                                 │
│  INSERT INTO sensor_data:                        │
│  (topic, payload, timestamp)                     │
└──────────────────────────────────────────────────┘
```

---

## 3. Device Control Flow (Command Path)

```
DEVICE CONTROL FLOW (User interacts → Device responds):

┌─────────────────────────────────────┐
│  User clicks Light Slider to 75%    │
│  in React Dashboard                 │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  React Component: handleLightChange(75)          │
│  Creates API call                                │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  HTTP POST Request (REST API)                    │
│  POST http://localhost:5000/api/device/light/1  │
│  Body: {"brightness": 75}                        │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Flask Backend: control_light() route            │
│  1. Validate brightness (0-100)                  │
│  2. Create JSON command:                         │
│     {                                            │
│       "device": "light1",                        │
│       "action": "brightness",                    │
│       "value": 75                                │
│     }                                            │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Publish to MQTT (SECURE)                        │
│  Topic: home/tuyenesp32/control                  │
│  Port: 8883                                      │
│  Encryption: TLS/SSL                             │
│  Auth: Tuyen / 123456789tT                       │
└────────┬─────────────────────────────────────────┘
         │
         ▼ (Encrypted over internet)
┌──────────────────────────────────────────────────┐
│  HiveMQ Cloud Broker                             │
│  Routes message to subscribers                   │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  ESP32 MQTT Subscriber                           │
│  Receives command on topic                       │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  callback() function parses JSON                 │
│  if (device == "light1")                         │
│  handleLightControl(1, 75)                       │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Calculate PWM Value                             │
│  pwmValue = (75 * 255) / 100 = 191               │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Output PWM Signal                               │
│  ledcWrite(LIGHT1_CHANNEL, 191)                  │
│  GPIO 17 outputs 75% duty cycle                  │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────┐
│  Hardware Response                               │
│  LED connected to GPIO 17                        │
│  Receives PWM signal                             │
│  Brightens to 75% intensity                      │
└──────────────────────────────────────────────────┘
         │
         └──► User sees light dim to 75%
```

---

## 4. Security & Encryption Flow

```
SECURE COMMUNICATION FLOW (MQTTS):

┌───────────────────────────────────────────────────────────────┐
│  Plaintext Data (Before Encryption)                           │
│  {"temperature": 24.5, "humidity": 65.3, ...}                │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Step 1: Client Authentication                                │
│  ├─ Username: Tuyen                                           │
│  ├─ Password: 123456789tT                                     │
│  └─ Device ID: ESP32_SmartHome_001                            │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Step 2: TLS/SSL Handshake                                    │
│  ├─ Protocol: TLSv1.2                                         │
│  ├─ Port: 8883 (Secure)                                       │
│  ├─ Client sends certificates                                 │
│  └─ Server verifies identity                                  │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Step 3: Server Certificate Verification (CRITICAL)          │
│  ├─ Server presents CA certificate                            │
│  ├─ Client verifies against CA Root:                          │
│  │   ISRG Root X1 (embedded in code)                          │
│  ├─ Prevents Man-in-the-Middle attacks                        │
│  └─ Certificate valid until: 2027-03-12                       │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Step 4: Encryption Session Established                       │
│  ├─ Symmetric encryption key created                          │
│  ├─ Algorithm: AES-256-GCM (High Security)                    │
│  ├─ All following data encrypted with this key               │
│  └─ Prevents eavesdropping                                    │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Encrypted Data in Transit                                    │
│  (Over Internet)                                              │
│  ╔════════════════════════════════════════════════╗            │
│  ║ [Encrypted Binary Data Stream]                 ║            │
│  ║ Cannot be intercepted or modified              ║            │
│  ║ Only broker/authorized client can decrypt      ║            │
│  ╚════════════════════════════════════════════════╝            │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Step 5: Message Decryption at Broker                        │
│  ├─ Broker has symmetric key from handshake                   │
│  ├─ Decrypts incoming message                                 │
│  ├─ Validates message integrity                               │
│  └─ Routes to authorized subscribers                          │
└─────┬─────────────────────────────────────────────────────────┘
      │
      ▼
┌───────────────────────────────────────────────────────────────┐
│  Step 6: Plaintext Data at Destination                       │
│  ├─ Backend: {"temperature": 24.5, ...}                      │
│  ├─ Save to database                                          │
│  ├─ Return via API                                            │
│  └─ Frontend: Display data                                    │
└───────────────────────────────────────────────────────────────┘

Security Benefits:
✓ Encryption prevents eavesdropping
✓ Certificate verification prevents MITM
✓ Authentication prevents unauthorized access
✓ Audit trail via timestamps
✓ JSON validation prevents injection
```

---

## 5. Component Architecture Map

```
FULLSTACK COMPONENT DEPENDENCIES:

Frontend Dependencies:
├── React 18+
│   ├── react-dom
│   └── react-router (navigation)
├── MQTT Client (mqtt package)
├── Tailwind CSS (styling)
└── Vite (build tool)

Backend Dependencies:
├── Flask 2.3.3
│   ├── Flask-CORS (cross-origin)
│   └── Blueprints (routing)
├── Paho-MQTT 1.6.1
│   ├── Client (subscribe/publish)
│   ├── SSL/TLS support
│   └── Automatic reconnect
└── SQLite3 (built-in)
    └── Database operations

ESP32 Dependencies:
├── Arduino Framework
├── WiFi.h (connectivity)
├── WiFiClientSecure.h (TLS/SSL)
├── PubSubClient.h (MQTT)
├── DHT.h (sensor reading)
├── ArduinoJson.h (JSON parsing)
└── AccelStepper.h (motor control)

External Services:
└── HiveMQ Cloud
    ├── MQTT Broker
    ├── MQTTS support
    └── CA Certificate
```

---

## 6. Port & Network Map

```
LOCAL NETWORK & PORTS:

┌────────────────────────────────────────────────────────────┐
│  Developer Machine (Windows)                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Port 5173  ◄─── Frontend (Vite dev server)               │
│             └─→ http://localhost:5173                     │
│                                                             │
│  Port 5000  ◄─── Backend (Flask API)                      │
│             └─→ http://localhost:5000                     │
│                                                             │
│  Port COM3  ◄─── Serial Monitor (ESP32 upload)            │
│             └─→ 115200 baud rate                          │
│                                                             │
└────────────────────┬──────────────────────────────────────┘
                     │
                     │ Internet Connection
                     │
┌────────────────────┴──────────────────────────────────────┐
│  MQTT Broker (HiveMQ Cloud)                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Port 8883  ◄─── MQTTS (MQTT over TLS/SSL)               │
│             ├─→ Backend connection (Python)              │
│             ├─→ ESP32 connection (C++)                   │
│             ├─→ Frontend connection (JavaScript)         │
│             └─→ Encryption: TLS/SSL (Port 1883 blocked)  │
│                                                             │
└────────────────────┬──────────────────────────────────────┘
                     │
┌────────────────────┴──────────────────────────────────────┐
│  ESP32 Device (On WiFi Network)                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  WiFi SSID: International University                       │
│             └─→ Connects to WiFi                          │
│                                                             │
│  MQTT Connection: Subscribes to control topic             │
│                  Publishes to sensor topic                │
│                                                             │
│  GPIO Pins: As defined in esp32_smart_home.ino           │
│             └─→ Sensors & actuators connected           │
│                                                             │
└────────────────────────────────────────────────────────────┘

Network Flow:
Frontend (5173) ◄─→ Backend (5000) ◄─→ MQTT Broker (8883) ◄─→ ESP32
└─ HTTP/REST ─┘    └─ MQTT/MQTTS ─┘                    └─ WiFi MQTT ─┘
```

---

## 7. Authentication & Authorization Flow

```
AUTHENTICATION CHAIN:

User Login:
┌──────────────────┐
│  Frontend Login  │
│  admin / admin@  │
└────────┬─────────┘
         │
         ▼
     POST /api/login
         │
         ▼
┌────────────────────────────────────────┐
│  Flask auth.py                         │
│  Verify credentials                    │
│  Return JWT token                      │
└────────┬───────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Frontend stores token                 │
│  Includes in future API requests       │
│  Cookies or LocalStorage               │
└────────────────────────────────────────┘

Device Authentication:
┌────────────────────────────────────────┐
│  MQTT Broker Credentials               │
├────────────────────────────────────────┤
│  Username: Tuyen                       │
│  Password: 123456789tT                 │
│  Device ID: ESP32_SmartHome_001        │
│  Certificate: CA verification          │
└────────┬───────────────────────────────┘
         │
         ├─► Backend (Python)
         ├─► ESP32 (C++)
         └─► Frontend (JavaScript)

Access Control:
         ▼
┌────────────────────────────────────────┐
│  Topic-Based Authorization             │
├────────────────────────────────────────┤
│  home/tuyenesp32/sensors               │
│  └─► All authenticated clients READ    │
│                                        │
│  home/tuyenesp32/control               │
│  └─► All authenticated clients WRITE   │
└────────────────────────────────────────┘
```

---

This comprehensive architecture ensures:
- ✅ **Security**: MQTTS encryption, certificates, authentication
- ✅ **Scalability**: Modular design, easy to add components
- ✅ **Reliability**: Error handling, automatic reconnect
- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Performance**: Async operations, efficient data storage

