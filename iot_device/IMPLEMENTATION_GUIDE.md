# ESP32 Smart Home System - Implementation Guide

## Project Overview

**Title:** IoT Based Smart Home Prototype With Security and Privacy Solution

This document provides complete implementation details for the updated ESP32 code that supports your dashboard UI with advanced device control capabilities.

---

## 🔒 Security & Privacy Features

### 1. **MQTTS (MQTT over TLS/SSL)**
- **Port:** 8883 (secure, encrypted)
- **Authentication:** Username + Password + CA Certificate
- **Encryption:** All sensor data encrypted during transmission
- **Protection:** Prevents eavesdropping and Man-in-the-Middle (MITM) attacks
- **Implementation:** `WiFiClientSecure` + CA certificate verification

### 2. **Device Authentication**
- Unique client ID for each ESP32 device
- Credential-based authentication to MQTT broker
- Secure credential storage (production: use ESP32 NVS or secure enclave)

### 3. **Data Privacy**
- JSON payload serialization ensures clean, validated data format
- No sensitive data leakage through plaintext communication
- Encrypted MQTT topics (transmitted over TLS/SSL)

---

## 📦 Required Libraries

### Arduino IDE Library Manager
```
1. PubSubClient (Knolleary) - MQTT client
2. DHT (Adafruit DHT sensor) - Temperature/Humidity sensor
3. ArduinoJson (Benoit Blanchon) - JSON serialization
4. AccelStepper (Mike McCauley) - Stepper motor control
```

### Installation Steps:
1. Arduino IDE → Sketch → Include Library → Manage Libraries
2. Search and install each library
3. Verify installation by checking: File → Examples

---

## 🔌 Pin Configuration

### **Sensor Pins**
```c
DHTPIN = GPIO 15       // Temperature & Humidity sensor
MOTION_SENSOR = GPIO 33 // PIR motion detector
LDR_PIN = GPIO 32      // Light sensor (analog)
```

### **Output Control Pins**

#### **Dimmable Lights (PWM Brightness Control)**
```c
LIGHT1_PIN = GPIO 17   // Light 1 - PWM dimming (0-100%)
LIGHT2_PIN = GPIO 16   // Light 2 - PWM dimming (0-100%)
```

#### **Variable Speed Fan (PWM Control)**
```c
FAN_PIN = GPIO 25      // Ceiling fan speed (0-100%)
```

#### **DC Motor with H-Bridge (Direction + Speed)**
```c
DC_MOTOR_IN1 = GPIO 18  // Forward direction pin
DC_MOTOR_IN2 = GPIO 19  // Reverse direction pin
DC_MOTOR_EN = GPIO 26   // Speed control (PWM)
```

#### **Stepper Motor (Precise Positioning)**
```c
STEPPER_STEP_PIN = GPIO 27  // Pulse signal
STEPPER_DIR_PIN = GPIO 28   // Direction control
```

---

## 🎛️ MQTT Topics & Payload Structure

### **Subscribe Topic (Incoming Commands)**
```
home/tuyenesp32/control
```

### **Publish Topic (Outgoing Sensor Data)**
```
home/tuyenesp32/sensors
```

### **Command Payload Examples**

#### **1. Light Dimming (0-100% brightness)**
```json
{
  "device": "light1",
  "action": "brightness",
  "value": 75
}
```
- Value range: 0-100 (percentage)
- Controls LED brightness via PWM

#### **2. Fan Speed Control (0-100%)**
```json
{
  "device": "fan",
  "action": "speed",
  "value": 60
}
```
- Value range: 0-100 (percentage)
- 0% = OFF, 100% = MAX SPEED

#### **3. DC Motor Direction + Speed**
```json
{
  "device": "dcmotor",
  "action": "forward|reverse|stop",
  "value": 80
}
```
- Actions: "forward", "reverse", "stop"
- Value: speed 0-100 (ignored if action="stop")
- H-Bridge control ensures smooth directional changes

#### **4. Stepper Motor Control**
```json
{
  "device": "stepper",
  "action": "cw|ccw|stop"
}
```
- Actions: "cw" (Clockwise), "ccw" (Counter-Clockwise), "stop"
- Precise positioning using AccelStepper library

### **Sensor Data Payload (Published)**
```json
{
  "temperature": 24.5,
  "humidity": 65.3,
  "light": 78,
  "motion": true,
  "timestamp": 45823921
}
```
- **temperature:** °C (float, 1 decimal place)
- **humidity:** % (float, 1 decimal place)
- **light:** 0-100% brightness level
- **motion:** true/false (motion detected)
- **timestamp:** milliseconds since boot

---

## 💡 Device Control Implementation Details

### **1. PWM Dimmable Lights**

**Technical Details:**
- PWM Frequency: 5 kHz (standard for LED lighting)
- Resolution: 8-bit (0-255 values mapping to 0-100%)
- Formula: `pwm_value = (percentage × 255) / 100`

**Code Flow:**
```cpp
// Dashboard sends: {"device": "light1", "value": 75}
// ESP32 calculates: pwm_value = (75 × 255) / 100 = 191
// ESP32 sets: ledcWrite(LIGHT1_CHANNEL, 191)
```

**Benefits:**
- Smooth dimming from 0-100%
- Energy efficient (no heat dissipation)
- Longer LED lifespan

### **2. Variable Speed Fan (PWM)**

**Technical Details:**
- Same PWM configuration as lights
- 0% = fan OFF
- 100% = fan at maximum speed
- Smooth acceleration via dashboard UI

**Code Flow:**
```cpp
// Dashboard sends: {"device": "fan", "value": 60}
// ESP32 calculates: pwm_value = (60 × 255) / 100 = 153
// ESP32 sets: ledcWrite(FAN_CHANNEL, 153)
```

### **3. DC Motor with H-Bridge (Bidirectional)**

**Technical Details:**
- H-Bridge driver (2-channel): IN1, IN2, EN
- Enable pin (EN) uses PWM for speed control
- Direction controlled via logic levels

**Truth Table:**
| IN1 | IN2 | Direction  |
|-----|-----|-----------|
| HIGH | LOW | Forward   |
| LOW  | HIGH | Reverse   |
| LOW  | LOW  | Stop/Brake|

**Code Flow:**
```cpp
// Forward: digitalWrite(IN1, HIGH), digitalWrite(IN2, LOW)
// Reverse: digitalWrite(IN1, LOW), digitalWrite(IN2, HIGH)
// Speed: ledcWrite(EN, pwm_value) where pwm_value = (speed × 255) / 100
```

**Example:**
```cpp
// Dashboard sends: {"device": "dcmotor", "action": "reverse", "value": 50}
// ESP32 sets: IN1=LOW, IN2=HIGH, EN_PWM=127 (50% speed)
// Result: Motor rotates reverse at 50% speed
```

### **4. Stepper Motor (AccelStepper)**

**Technical Details:**
- Uses DRIVER mode (STEP + DIR pins)
- Acceleration control: 1000 steps/s²
- Max speed: 1000 steps/s
- Precise positioning capability

**Code Flow:**
```cpp
// Dashboard sends: {"device": "stepper", "action": "cw"}
// ESP32 sets: stepper.moveTo(10000) // 10000 steps CW
// In loop(): stepper.run() executes movement with acceleration
```

**Step Resolution:**
- Typical NEMA 17: 200 steps/revolution
- 10,000 steps = 50 full rotations
- Smooth acceleration prevents mechanical stress

---

## 📊 JSON Sensor Data Structure

### **Previous Format (Comma-Separated)**
```
65,24,78,1,none,none,75
```
**Problems:** Hard to parse, unclear field order, no error handling

### **New Format (JSON)**
```json
{
  "temperature": 24.5,
  "humidity": 65.3,
  "light": 78,
  "motion": true,
  "timestamp": 45823921
}
```
**Advantages:**
- Clear field names (self-documenting)
- Easy frontend parsing (JSON.parse())
- Extensible format
- Type safety
- Timestamp for data correlation

---

## 🔧 Integration with Your Dashboard

### **Frontend Command Structure**

Your React dashboard should send commands like:

```javascript
// Light dimming
const sendLightCommand = async (lightNum, brightness) => {
  const payload = {
    device: `light${lightNum}`,
    action: "brightness",
    value: brightness // 0-100
  };
  await publishToMQTT(
    "home/tuyenesp32/control",
    JSON.stringify(payload)
  );
};

// Fan speed
const sendFanCommand = async (speed) => {
  const payload = {
    device: "fan",
    action: "speed",
    value: speed // 0-100
  };
  await publishToMQTT(
    "home/tuyenesp32/control",
    JSON.stringify(payload)
  );
};

// DC Motor direction
const sendMotorCommand = async (direction, speed) => {
  const payload = {
    device: "dcmotor",
    action: direction, // "forward", "reverse", "stop"
    value: speed // 0-100 (ignored for "stop")
  };
  await publishToMQTT(
    "home/tuyenesp32/control",
    JSON.stringify(payload)
  );
};

// Stepper motor
const sendStepperCommand = async (direction) => {
  const payload = {
    device: "stepper",
    action: direction // "cw", "ccw", "stop"
  };
  await publishToMQTT(
    "home/tuyenesp32/control",
    JSON.stringify(payload)
  );
};
```

### **Frontend Sensor Data Parsing**

```javascript
const handleSensorMessage = (message) => {
  try {
    const data = JSON.parse(message);
    
    // Update state with sensor readings
    setTemperature(data.temperature);
    setHumidity(data.humidity);
    setLightLevel(data.light);
    setMotionDetected(data.motion);
    setLastUpdate(new Date(data.timestamp));
    
  } catch (error) {
    console.error("Failed to parse sensor data:", error);
  }
};
```

---

## ✅ Verification Checklist

### **Before Deployment:**

- [ ] All required libraries installed in Arduino IDE
- [ ] Pin definitions match your hardware setup
- [ ] MQTT credentials updated (username, password)
- [ ] MQTT broker address verified (HiveMQ Cloud)
- [ ] WiFi SSID and password correct
- [ ] CA certificate is current (expires 2027-03-12)
- [ ] H-Bridge motor driver pins correct
- [ ] Stepper motor wiring verified
- [ ] Serial monitor shows no connection errors

### **During Testing:**

- [ ] WiFi connects successfully
- [ ] MQTT connection established over port 8883
- [ ] Sensor data publishes every 3 seconds
- [ ] Command reception working (check Serial output)
- [ ] Lights dim smoothly (0-100%)
- [ ] Fan speed adjusts properly
- [ ] DC motor changes direction smoothly
- [ ] Stepper motor rotates in both directions

### **Security Verification:**

- [ ] MQTTS port 8883 confirmed (not 1883)
- [ ] CA certificate loaded correctly
- [ ] Connection uses TLS/SSL (encrypted traffic)
- [ ] No plaintext passwords in topics
- [ ] JSON payloads properly formatted

---

## 🚀 Uploading to ESP32

### **Step 1: Board Configuration**
```
Arduino IDE → Tools → Board → ESP32 → ESP32 Dev Module
```

### **Step 2: Port Selection**
```
Tools → Port → COM3 (or your ESP32 port)
```

### **Step 3: Compile & Upload**
```
Sketch → Upload
or Ctrl+U
```

### **Step 4: Monitor Output**
```
Tools → Serial Monitor → 115200 baud
Watch for initialization messages
```

---

## 📝 Troubleshooting Guide

| Issue | Cause | Solution |
|-------|-------|----------|
| WiFi won't connect | Wrong SSID/Password | Verify WiFi credentials |
| MQTT connection fails | Wrong broker address | Check MQTT server URL |
| Port 1883 error | Using insecure port | Ensure using port 8883 |
| CA certificate error | Invalid certificate | Re-download certificate from HiveMQ Cloud |
| Sensor data not received | Topic mismatch | Verify `sensor_topic` variable |
| Commands not working | Wrong JSON format | Check command structure matches specification |
| Motor won't move | Pin configuration error | Verify H-Bridge/Stepper pins in code |

---

## 📚 References

### **Libraries Documentation:**
- [ArduinoJson](https://arduinojson.org/)
- [AccelStepper](http://www.airspayce.com/mikem/arduino/AccelStepper/)
- [PubSubClient](https://pubsubclient.knolleary.net/)

### **Hardware:**
- [ESP32 Datasheet](https://www.espressif.com/en/products/microcontrollers/esp32/resources)
- [DHT11 Sensor](https://www.adafruit.com/product/386)
- [HiveMQ Cloud MQTT Broker](https://www.hivemq.cloud/)

---

## 🔐 Security Best Practices

### **For Production Deployment:**

1. **Rotate Credentials Regularly**
   - Change MQTT password periodically
   - Use environment variables instead of hardcoding

2. **Use ESP32 NVS (Non-Volatile Storage)**
   ```cpp
   // Store sensitive data in encrypted NVS
   nvs_flash_init();
   // Never store credentials in source code
   ```

3. **Implement Rate Limiting**
   - Add delays between command executions
   - Prevent command flooding attacks

4. **Monitor Device Health**
   - Log all MQTT connections/disconnections
   - Alert on failed authentication attempts

5. **Regular Firmware Updates**
   - Implement OTA (Over-The-Air) update capability
   - Monitor for library security patches

---

## 📞 Support & Maintenance

**Created for:** IoT Based Smart Home Prototype With Security and Privacy Solution  
**Compatible Frontend:** React Dashboard (your implementation)  
**Last Updated:** April 2026  
**Version:** 2.0 (PWM, H-Bridge, Stepper, JSON, MQTTS)

---

*This implementation ensures your smart home system meets modern IoT security standards while providing advanced device control capabilities through your dashboard UI.*
