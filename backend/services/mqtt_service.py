"""
MQTT Service for IoT Smart Home Backend
- Secure connection to HiveMQ Cloud using MQTTS (port 8883)
- TLS/SSL encryption for all communication
- Subscribes to ESP32 sensor data and device status
- Publishes device commands to ESP32
- Saves all data to SQLite database
"""

import paho.mqtt.client as mqtt
import ssl
from services.database import save_sensor_data

# ===== MQTT Broker Configuration (SECURE MQTTS) =====
MQTT_BROKER = "4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud"
MQTT_PORT = 8883  # Secure port with TLS/SSL
MQTT_USER = "Tuyen"
MQTT_PASS = "123456789tT"

# ===== MQTT Topics =====
# Topic for ESP32 sensor data (Temperature, Humidity, Light, Motion)
SENSOR_TOPIC = "home/tuyenesp32/sensors"
# Topic for control commands to ESP32
CONTROL_TOPIC = "home/tuyenesp32/control"

# ===== CA Certificate for TLS/SSL (Security & Privacy) =====
# Verifies the MQTT broker's authenticity, prevents MITM attacks
CA_CERT = """-----BEGIN CERTIFICATE-----
MIIFBjCCAu6gAwIBAgIRAIp9PhPWLzDvI4a9KQdrNPgwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw
WhcNMjcwMzEyMjM1OTU5WjAzMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg
RW5jcnlwdDEMMAoGA1UEAxMDUjExMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuoe8XBsAOcvKCs3UZxD5ATylTqVhyybKUvsVAbe5KPUoHu0nsyQYOWcJ
DAjs4DqwO3cOvfPlOVRBDE6uQdaZdN5R2+97/1i9qLcT9t4x1fJyyXJqC4N0lZxG
AGQUmfOx2SLZzaiSqhwmej/+71gFewiVgdtxD4774zEJuwm+UE1fj5F2PVqdnoPy
6cRms+EGZkNIGIBloDcYmpuEMpexsr3E+BUAnSeI++JjF5ZsmydnS8TbKF5pwnnw
SVzgJFDhxLyhBax7QG0AtMJBP6dYuC/FXJuluwme8f7rsIU5/agK70XEeOtlKsLP
Xzze41xNG/cLJyuqC0J3U095ah2H2QIDAQABo4H4MIH1MA4GA1UdDwEB/wQEAwIB
hjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwEgYDVR0TAQH/BAgwBgEB
/wIBADAdBgNVHQ4EFgQUxc9GpOr0w8B6bJXELbBeki8m47kwHwYDVR0jBBgwFoAU
ebRZ5nu25eQBc4AIiMgaWPbpm24wMgYIKwYBBQUHAQEEJjAkMCIGCCsGAQUFBzAC
hhZodHRwOi8veDEuaS5sZW5jci5vcmcvMBMGA1UdIAQMMAowCAYGZ4EMAQIBMCcG
A1UdHwQgMB4wHKAaoBiGFmh0dHA6Ly94MS5jLmxlbmNyLm9yZy8wDQYJKoZIhvcN
AQELBQADggIBAE7iiV0KAxyQOND1H/lxXPjDj7I3iHpvsCUf7b632IYGjukJhM1y
v4Hz/MrPU0jtvfZpQtSlET41yBOykh0FX+ou1Nj4ScOt9ZmWnO8m2OG0JAtIIE38
01S0qcYhyOE2G/93ZCkXufBL713qzXnQv5C/viOykNpKqUgxdKlEC+Hi9i2DcaR1
e9KUwQUZRhy5j/PEdEglKg3l9dtD4tuTm7kZtB8v32oOjzHTYw+7KdzdZiw/sBtn
UfhBPORNuay4pJxmY/WrhSMdzFO2q3Gu3MUBcdo27goYKjL9CTF8j/Zz55yctUoV
aneCWs/ajUX+HypkBTA+c8LGDLnWO2NKq0YD/pnARkAnYGPfUDoHR9gVSp/qRx+Z
WghiDLZsMwhN1zjtSC0uBWiugF3vTNzYIEFfaPG7Ws3jDrAMMYebQ95JQ+HIBD/R
PBuHRTBpqKlyDnkSHDHYPiNX3adPoPAcgdF3H2/W0rmoswMWgTlLn1Wu0mrks7/q
pdWfS6PJ1jty80r2VKsM/Dj3YIDfbjXKdaFU5C+8bhfJGqU3taKauuz0wHVGT3eo
6FlWkWYtbt4pgdamlwVeZEW+LM7qZEJEsMNPrfC03APKmZsJgpWCDWOKZvkZcvjV
uYkQ4omYCTX5ohy+knMjdOmdH9c7SpqEWBDC86fiNex+O0XOMEZSa8DA
-----END CERTIFICATE-----"""

# Global client reference
mqtt_client = None

def on_connect(client, userdata, flags, rc):
    """Callback when client connects to broker."""
    if rc == 0:
        print(f"✅ Connected to MQTT broker securely (MQTTS port {MQTT_PORT})")
        # Subscribe to ESP32 sensor data topic
        client.subscribe(SENSOR_TOPIC)
        print(f"📥 Subscribed to: {SENSOR_TOPIC}")
    else:
        print(f"❌ MQTT Connection failed with result code {rc}")

def on_message(client, userdata, msg):
    """Callback when message is received."""
    payload = msg.payload.decode("utf-8")
    topic = msg.topic
    print(f"📨 Message from '{topic}': {payload}")
    # Save the received data to database
    save_sensor_data(topic, payload)

def on_disconnect(client, userdata, rc):
    """Callback when client disconnects."""
    if rc != 0:
        print(f"⚠️ Unexpected MQTT disconnection. Reconnecting...")
    else:
        print(f"🔌 Disconnected from MQTT broker")

def mqtt_loop():
    """Start MQTT client loop (runs in background thread)."""
    global mqtt_client
    
    mqtt_client = mqtt.Client(client_id="FlaskBackend_SmartHome_001")
    
    # Set secure SSL/TLS configuration
    mqtt_client.tls_set(
        ca_certs=None,  # Will use system CA store
        certfile=None,
        keyfile=None,
        cert_reqs=ssl.CERT_REQUIRED,
        tls_version=ssl.PROTOCOL_TLSv1_2,
        ciphers=None
    )
    mqtt_client.tls_insecure = False  # Verify certificate
    
    # Set credentials
    mqtt_client.username_pw_set(MQTT_USER, MQTT_PASS)
    
    # Set callbacks
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message
    mqtt_client.on_disconnect = on_disconnect
    
    try:
        print(f"🔄 Connecting to MQTT broker: {MQTT_BROKER}:{MQTT_PORT}")
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_forever()
    except Exception as e:
        print(f"❌ MQTT Connection failed: {e}")

def publish_message(topic, payload):
    """
    Publish a message to the MQTT broker.
    Used to send device commands to ESP32.
    """
    try:
        if mqtt_client and mqtt_client.is_connected():
            mqtt_client.publish(topic, str(payload))
            print(f"✅ Published to '{topic}': {payload}")
            return True
        else:
            print(f"❌ MQTT client not connected")
            return False
    except Exception as e:
        print(f"❌ Failed to publish: {e}")
        return False
