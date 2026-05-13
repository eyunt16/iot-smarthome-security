# Quick Reference: Dashboard & ESP32 Communication

## MQTT Connection Setup

```javascript
// React/Frontend MQTT Setup
import { useEffect, useState } from 'react';
import mqtt from 'mqtt';

// Connection Configuration
const MQTT_BROKER = "4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud";
const MQTT_PORT = 8883;  // Secure MQTTS
const MQTT_USERNAME = "Tuyen";
const MQTT_PASSWORD = "123456789tT";

// Topics
const SENSOR_TOPIC = "home/tuyenesp32/sensors";
const CONTROL_TOPIC = "home/tuyenesp32/control";

// Connect to MQTT Broker
const client = mqtt.connect(`mqtts://${MQTT_BROKER}:${MQTT_PORT}`, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  clientId: `Dashboard_${Date.now()}`
});

// Subscribe to sensor data
client.subscribe(SENSOR_TOPIC);

// Listen for sensor updates
client.on('message', (topic, message) => {
  if (topic === SENSOR_TOPIC) {
    const sensorData = JSON.parse(message.toString());
    console.log('Sensor Data:', sensorData);
    // Update dashboard display
  }
});
```

---

## 📤 Sending Commands to ESP32

### **1. Light Dimming (0-100%)**
```javascript
const setLightBrightness = (lightNumber, brightness) => {
  const payload = {
    device: `light${lightNumber}`,
    action: "brightness",
    value: brightness  // 0-100
  };
  
  client.publish(
    CONTROL_TOPIC,
    JSON.stringify(payload)
  );
};

// Usage Examples
setLightBrightness(1, 0);      // Turn off light 1
setLightBrightness(1, 50);     // 50% brightness
setLightBrightness(2, 100);    // Full brightness
```

**MQTT Packet:**
```json
Topic: home/tuyenesp32/control
Payload: {"device":"light1","action":"brightness","value":75}
```

---

### **2. Fan Speed Control (0-100%)**
```javascript
const setFanSpeed = (speed) => {
  const payload = {
    device: "fan",
    action: "speed",
    value: speed  // 0-100
  };
  
  client.publish(
    CONTROL_TOPIC,
    JSON.stringify(payload)
  );
};

// Usage Examples
setFanSpeed(0);       // Off
setFanSpeed(50);      // Medium
setFanSpeed(100);     // High
```

**ESP32 Behavior:**
```
Speed 0%   → OFF (PWM 0)
Speed 50%  → MEDIUM (PWM 127)
Speed 100% → MAX (PWM 255)
```

---

### **3. DC Motor Direction Control**
```javascript
const setDCMotor = (direction, speed = 100) => {
  const payload = {
    device: "dcmotor",
    action: direction,  // "forward", "reverse", "stop"
    value: speed        // 0-100 (ignored for "stop")
  };
  
  client.publish(
    CONTROL_TOPIC,
    JSON.stringify(payload)
  );
};

// Usage Examples
setDCMotor("forward", 75);   // Forward at 75% speed
setDCMotor("reverse", 50);   // Reverse at 50% speed
setDCMotor("stop");          // Stop motor
setDCMotor("forward", 0);    // Also stops motor
```

**Motor States:**
```
Forward + Speed  → IN1=HIGH, IN2=LOW, EN=PWM
Reverse + Speed  → IN1=LOW, IN2=HIGH, EN=PWM
Stop             → IN1=LOW, IN2=LOW, EN=0
```

---

### **4. Stepper Motor Control (Precise Positioning)**
```javascript
const setStepperMotor = (direction) => {
  const payload = {
    device: "stepper",
    action: direction  // "cw", "ccw", "stop"
  };
  
  client.publish(
    CONTROL_TOPIC,
    JSON.stringify(payload)
  );
};

// Usage Examples
setStepperMotor("cw");       // Clockwise rotation
setStepperMotor("ccw");      // Counter-clockwise
setStepperMotor("stop");     // Stop and hold position
```

**Stepper Behavior:**
```
"cw"   → moveTo(10000)    [50 rotations forward]
"ccw"  → moveTo(-10000)   [50 rotations backward]
"stop" → stop()           [Halt movement]
```

---

## 📥 Receiving Sensor Data

### **Sensor Payload Structure**
```json
{
  "temperature": 24.5,
  "humidity": 65.3,
  "light": 78,
  "motion": true,
  "timestamp": 45823921
}
```

### **Frontend Handler**
```javascript
const handleSensorData = (message) => {
  try {
    const data = JSON.parse(message);
    
    // Type-safe access
    const temp = data.temperature;      // float (°C)
    const humidity = data.humidity;     // float (%)
    const lightLevel = data.light;      // integer (0-100%)
    const motionDetected = data.motion; // boolean
    const timestamp = data.timestamp;   // integer (ms)
    
    // Update UI State
    setTemperature(temp.toFixed(1) + "°C");
    setHumidity(humidity.toFixed(1) + "%");
    setLightLevel(lightLevel + "%");
    setMotionStatus(motionDetected ? "🔴 Detected" : "🟢 Clear");
    setLastUpdate(new Date(timestamp));
    
  } catch (error) {
    console.error("Sensor data parse error:", error);
  }
};
```

### **Parsing Validation**
```javascript
const isValidSensorData = (data) => {
  return (
    typeof data.temperature === 'number' &&
    typeof data.humidity === 'number' &&
    typeof data.light === 'number' &&
    typeof data.motion === 'boolean' &&
    typeof data.timestamp === 'number'
  );
};
```

---

## 🎮 React Component Examples

### **Light Control Component**
```jsx
import React, { useState } from 'react';

const LightControl = ({ lightNumber, onCommand }) => {
  const [brightness, setBrightness] = useState(50);
  
  const handleSlideChange = (e) => {
    const value = parseInt(e.target.value);
    setBrightness(value);
    
    // Send command to ESP32
    onCommand({
      device: `light${lightNumber}`,
      action: "brightness",
      value: value
    });
  };
  
  return (
    <div className="light-control">
      <h3>💡 Light {lightNumber}</h3>
      <input
        type="range"
        min="0"
        max="100"
        value={brightness}
        onChange={handleSlideChange}
      />
      <p>{brightness}%</p>
    </div>
  );
};

export default LightControl;
```

### **Fan Speed Component**
```jsx
const FanControl = ({ onCommand }) => {
  const speeds = [
    { label: "Off", value: 0 },
    { label: "Low", value: 33 },
    { label: "Medium", value: 66 },
    { label: "High", value: 100 }
  ];
  
  const handleSpeedChange = (speed) => {
    onCommand({
      device: "fan",
      action: "speed",
      value: speed
    });
  };
  
  return (
    <div className="fan-control">
      <h3>🌀 Fan Speed</h3>
      {speeds.map((speed) => (
        <button
          key={speed.value}
          onClick={() => handleSpeedChange(speed.value)}
        >
          {speed.label}
        </button>
      ))}
    </div>
  );
};

export default FanControl;
```

### **Motor Direction Component**
```jsx
const MotorControl = ({ onCommand }) => {
  const [speed, setSpeed] = useState(50);
  
  const handleControl = (direction) => {
    onCommand({
      device: "dcmotor",
      action: direction,
      value: direction === "stop" ? 0 : speed
    });
  };
  
  return (
    <div className="motor-control">
      <h3>⚙️ DC Motor</h3>
      
      <label>Speed: {speed}%</label>
      <input
        type="range"
        min="0"
        max="100"
        value={speed}
        onChange={(e) => setSpeed(parseInt(e.target.value))}
      />
      
      <div className="controls">
        <button onClick={() => handleControl("forward")}>⬆️ Forward</button>
        <button onClick={() => handleControl("stop")}>⏹️ Stop</button>
        <button onClick={() => handleControl("reverse")}>⬇️ Reverse</button>
      </div>
    </div>
  );
};

export default MotorControl;
```

### **Stepper Motor Component**
```jsx
const StepperControl = ({ onCommand }) => {
  const handleRotation = (direction) => {
    onCommand({
      device: "stepper",
      action: direction
    });
  };
  
  return (
    <div className="stepper-control">
      <h3>📍 Stepper Motor</h3>
      
      <button onClick={() => handleRotation("cw")}>
        🔄 Clockwise
      </button>
      <button onClick={() => handleRotation("stop")}>
        ⏸️ Stop
      </button>
      <button onClick={() => handleRotation("ccw")}>
        🔄 Counter-Clockwise
      </button>
    </div>
  );
};

export default StepperControl;
```

### **Sensor Display Component**
```jsx
const SensorDisplay = ({ sensorData }) => {
  if (!sensorData) return <p>Waiting for sensor data...</p>;
  
  return (
    <div className="sensor-display">
      <h3>📊 Sensor Data</h3>
      
      <div className="sensor-card">
        <span>🌡️ Temperature</span>
        <strong>{sensorData.temperature.toFixed(1)}°C</strong>
      </div>
      
      <div className="sensor-card">
        <span>💧 Humidity</span>
        <strong>{sensorData.humidity.toFixed(1)}%</strong>
      </div>
      
      <div className="sensor-card">
        <span>☀️ Light Level</span>
        <strong>{sensorData.light}%</strong>
      </div>
      
      <div className="sensor-card">
        <span>🚨 Motion</span>
        <strong>{sensorData.motion ? "🔴 Detected" : "🟢 Clear"}</strong>
      </div>
      
      <div className="timestamp">
        Last Update: {new Date(sensorData.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

export default SensorDisplay;
```

---

## 🔒 Security Notes for Frontend

### **Connection Security**
```javascript
// ✅ CORRECT - Uses MQTTS (port 8883)
const options = {
  protocol: 'mqtts',
  port: 8883,
  username: 'Tuyen',
  password: '123456789tT'
};

// ❌ WRONG - Uses unencrypted MQTT
const options = {
  protocol: 'mqtt',
  port: 1883  // No encryption!
};
```

### **Credential Management**
```javascript
// ❌ BAD - Hardcoded credentials
const client = mqtt.connect('mqtts://broker', {
  username: 'Tuyen',
  password: '123456789tT'
});

// ✅ GOOD - Environment variables
const client = mqtt.connect(`mqtts://${process.env.REACT_APP_MQTT_BROKER}`, {
  username: process.env.REACT_APP_MQTT_USER,
  password: process.env.REACT_APP_MQTT_PASS
});
```

### **.env.example**
```
REACT_APP_MQTT_BROKER=4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud
REACT_APP_MQTT_PORT=8883
REACT_APP_MQTT_USER=Tuyen
REACT_APP_MQTT_PASS=123456789tT
REACT_APP_SENSOR_TOPIC=home/tuyenesp32/sensors
REACT_APP_CONTROL_TOPIC=home/tuyenesp32/control
```

---

## 📋 Troubleshooting Checklist

### **Connection Issues**
- [ ] MQTT port is 8883 (not 1883)
- [ ] Using `mqtts://` protocol (not `mqtt://`)
- [ ] Credentials are correct
- [ ] Broker address is correct
- [ ] WiFi available at frontend location

### **Command Not Working**
- [ ] JSON payload is valid
- [ ] Device name matches ("light1", "fan", "dcmotor", "stepper")
- [ ] Action field is correct
- [ ] Value is within valid range (0-100)
- [ ] Topic name is correct: `home/tuyenesp32/control`

### **Sensor Data Not Updating**
- [ ] Subscribed to correct topic: `home/tuyenesp32/sensors`
- [ ] JSON parsing is working
- [ ] ESP32 is connected and publishing
- [ ] Check browser console for errors
- [ ] Verify timestamp is changing

### **Security Warnings**
- [ ] Self-signed certificate? Browser may warn
- [ ] Check CA certificate is valid
- [ ] Ensure MQTTS port 8883 is not blocked
- [ ] Firewall settings allow outbound MQTT

---

## 🚀 Testing Commands (MQTT CLI)

```bash
# Subscribe to sensor data
mosquitto_sub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT \
  -t "home/tuyenesp32/sensors" --cafile ca.crt

# Send light command
mosquitto_pub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT \
  -t "home/tuyenesp32/control" \
  -m '{"device":"light1","action":"brightness","value":75}'

# Send motor command
mosquitto_pub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT \
  -t "home/tuyenesp32/control" \
  -m '{"device":"dcmotor","action":"forward","value":80}'

# Send stepper command
mosquitto_pub -h 4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud \
  -p 8883 -u Tuyen -P 123456789tT \
  -t "home/tuyenesp32/control" \
  -m '{"device":"stepper","action":"cw"}'
```

---

## 📞 Quick Reference Table

| Device | Command | Value Range | Unit |
|--------|---------|-------------|------|
| Light 1 | brightness | 0-100 | % |
| Light 2 | brightness | 0-100 | % |
| Fan | speed | 0-100 | % |
| DC Motor | forward/reverse/stop | 0-100 | % |
| Stepper | cw/ccw/stop | N/A | Direction |

| Sensor | Type | Range | Unit |
|--------|------|-------|------|
| Temperature | float | -40 to 50 | °C |
| Humidity | float | 0 to 100 | % |
| Light | int | 0 to 100 | % |
| Motion | boolean | true/false | - |

---

*Last Updated: April 2026*  
*For IoT Smart Home Dashboard Integration*
