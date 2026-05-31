;/*
 * ==========================================================================================================
 * TUYEN HOME - ESP32 SMART HOME FIRMWARE
 * Gia dinh hien tai dua tren codebase san co:
 * - DHT11: GPIO 15
 * - PIR Motion: GPIO 33
 * - LDR analog: GPIO 32
 * - LED/Relay dieu khien: GPIO 17
 * ==========================================================================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>
#include <string.h>

// ==========================================================================================================
// CONFIGURATION BLOCK
// ==========================================================================================================
const char* WIFI_SSID = "S-HOME";
const char* WIFI_PASSWORD = "123456789a";

const char* HIVEMQ_URL = "4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud";
const uint16_t HIVEMQ_PORT = 8883;
const char* HIVEMQ_USERNAME = "Tuyen";
const char* HIVEMQ_PASSWORD = "123456789tT";

static const uint8_t DHT_PIN = 15;
static const uint8_t DHT_TYPE = DHT11;
static const uint8_t PIR_PIN = 33;
static const uint8_t LDR_PIN = 32;
static const uint8_t RELAY_LED_PIN = 17;

// Configuration for connection status LED (GPIO 2 on ESP32, active high)
#define STATUS_LED_PIN 2
#define LED_ON HIGH
#define LED_OFF LOW

// MQTT topics
const char* TOPIC_TEMP = "tuyenhome/sensor/temperature";
const char* TOPIC_HUMIDITY = "tuyenhome/sensor/humidity";
const char* TOPIC_MOTION = "tuyenhome/sensor/motion";
const char* TOPIC_LIGHT_LEVEL = "tuyenhome/sensor/light";
const char* TOPIC_LIGHT_SET = "tuyenhome/device/light/set";
const char* TOPIC_LIGHT_STATE = "tuyenhome/device/light/state";
const char* TOPIC_DEVICE_STATUS = "tuyenhome/device/status";

// Chu ky gui du lieu
const unsigned long SENSOR_PUBLISH_INTERVAL_MS = 5000;
const unsigned long MQTT_RECONNECT_INTERVAL_MS = 5000;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 20000;

// Can dong bo thoi gian de ESP32 xac thuc chung chi TLS dung cach
const char* NTP_SERVER_1 = "pool.ntp.org";
const char* NTP_SERVER_2 = "time.nist.gov";
const long GMT_OFFSET_SEC = 0;
const int DAYLIGHT_OFFSET_SEC = 0;

// Root CA cho HiveMQ Cloud / Let's Encrypt (ISRG Root X1)
static const char HIVEMQ_ROOT_CA[] = R"EOF(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh
cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4
WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu
ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY
MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzm54rVygc
h77ct984kIxuPOZXoHj3dcKi/vVqbvYATyjb3miGbESTtrFj/RQSa78f0uoxmyF+
0TM8ukj13Xnfs7j/EvEhmkvBioZxaUpmZmyPfjxwv60pIgbz5MDmgK7iS4+3mX6U
A5/TR5d8mUgjU+g4rk8Kb4Mu0UlXjIB0ttov0DiNewNwIRt18jA8+o+u3dpjq+sW
T8KOEUt+zwvo/7V3LvSye0rgTBIlDHCNAymg4VMk7BPZ7hm/ELNKjD+Jo2FR3qyH
B5T0Y3HsLuJvW5iB4YlcNHlsdu87kGJ55tukmi8mxdAQ4Q7e2RCOFvu396j3x+UC
B5iPNgiV5+I3lg02dZ77DnKxHZu8A/lJBdiB3QW0KtZB6awBdpUKD9jf1b0SHzUv
KBds0pjBqAlkd25HN7rOrFleaJ1/ctaJxQZBKT5ZPt0m9STJEadao0xAH0ahmbWn
OlFuhjuefXKnEgV4We0+UXgVCwOPjdAvBbI+e0ocS3MFEvzG6uBQE3xDk3SzynTn
jh8BCNAw1FtxNrQHusEwMFxIt4I7mKZ9YIqioymCzLq9gwQbooMDQaHWBfEbwrbw
qHyGO0aoSCqI3Haadr8faqU9GY/rOPNk3sgrDQoo//fb4hVC1CLQJ13hef4Y53CI
rU7m2Ys6xt0nUW7/vGT1M0NPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNV
HRMBAf8EBTADAQH/MB0GA1UdDgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkq
hkiG9w0BAQsFAAOCAgEAVR9YqbyyqFDQDLHYGmkgJykIrGF1XIpu+ILlaS/V9lZL
ubhzEFnTIZd+50xx+7LSYK05qAvqFyFWhfFQDlnrzuBZ6brJFe+GnY+EgPbk6ZGQ
3BebYhtF8GaV0nxvwuo77x/Py9auJ/GpsMiu/X1+mvoiBOv/2X/qkSsisRcOj/KK
NFtY2PwByVS5uCbMiogziUwthDyC3+6WVwW6LLv3xLfHTjuCvjHIInNzktHCgKQ5
ORAzI4JMPJ+GslWYHb4phowim57iaztXOoJwTdwJx4nLCgdNbOhdjsnvzqvHu7Ur
TkXWStAmzOVyyghqpZXjFaH3pO3JLF+l+/+sKAIuvtd7u+Nxe5AW0wdeRlN8NwdC
jNPElpzVmbUq4JUagEiuTDkHzsxHpFKVK7q4+63SM1N95R1NbdWhscdCb+ZAJzVc
oyi3B43njTOQ5yOf+1CceWxG1bQVs5ZufpsMljq4Ui0/1lvh+wjChP4kqKOJ2qxq
4RgqsahDYVvTH9w7jXbyLeiNdd8XM2w9U/t7y0Ff/9yi0GE44Za4rF2LN9d11TPA
mRGunUHBcnWEvgJBQl9nJEiU0Zsnvgc/ubhPgXRR4Xq37Z0j4r7g1SgEEzwxA57d
emyPxgcYxn/eR44/KJ4EBs+lVDR3veyJm+kXQ99b21/+jh5Xos1AnX5iItreGCc=
-----END CERTIFICATE-----
)EOF";

// ==========================================================================================================
// GLOBAL OBJECTS
// ==========================================================================================================
WiFiClientSecure secureClient;
PubSubClient mqttClient(secureClient);
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastSensorPublishMs = 0;
unsigned long lastReconnectAttemptMs = 0;
bool outputState = false;

// ==========================================================================================================
// HELPER FUNCTIONS
// ==========================================================================================================
const char* mqttStateToText(int8_t state) {
  switch (state) {
    case MQTT_CONNECTION_TIMEOUT: return "Connection timeout";
    case MQTT_CONNECTION_LOST: return "MQTT connection lost";
    case MQTT_CONNECT_FAILED: return "Network error or TLS handshake failed";
    case MQTT_DISCONNECTED: return "Client disconnected";
    case MQTT_CONNECTED: return "Connected";
    case MQTT_CONNECT_BAD_PROTOCOL: return "Incorrect MQTT protocol";
    case MQTT_CONNECT_BAD_CLIENT_ID: return "Invalid Client ID";
    case MQTT_CONNECT_UNAVAILABLE: return "Broker temporarily unavailable";
    case MQTT_CONNECT_BAD_CREDENTIALS: return "Incorrect username/password";
    case MQTT_CONNECT_UNAUTHORIZED: return "Unauthorized";
    default: return "Unknown error";
  }
}

bool isTimeSynced() {
  time_t now = time(nullptr);
  return now > 1700000000;
}

void syncClockForTLS() {
  if (isTimeSynced()) {
    return;
  }

  Serial.println("[TLS] Syncing NTP time to verify certificate...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER_1, NTP_SERVER_2);

  unsigned long startMs = millis();
  while (!isTimeSynced() && millis() - startMs < 15000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (isTimeSynced()) {
    Serial.println("[TLS] Time synchronized successfully.");
  } else {
    Serial.println("[TLS] Failed to sync time. If TLS fails, check Internet/NTP.");
  }
}

void publishOutputState() {
  const char* stateText = outputState ? "ON" : "OFF";
  mqttClient.publish(TOPIC_LIGHT_STATE, stateText, true);
  Serial.print("[MQTT] Output state updated: ");
  Serial.println(stateText);
}

void applyOutputState(bool turnOn) {
  outputState = turnOn;
  digitalWrite(RELAY_LED_PIN, outputState ? HIGH : LOW);

  Serial.print("[DEVICE] Output GPIO ");
  Serial.print(RELAY_LED_PIN);
  Serial.print(" -> ");
  Serial.println(outputState ? "ON" : "OFF");

  if (mqttClient.connected()) {
    publishOutputState();
  }
}

// ==========================================================================================================
// WIFI
// ==========================================================================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.println();
  Serial.print("[WIFI] Connecting to SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 20) {
    // Blink fast (200ms period: 100ms ON, 100ms OFF)
    // 500ms delay per retry, so we can do two cycles of 200ms plus 100ms
    digitalWrite(STATUS_LED_PIN, LED_ON);
    delay(100);
    digitalWrite(STATUS_LED_PIN, LED_OFF);
    delay(100);
    digitalWrite(STATUS_LED_PIN, LED_ON);
    delay(100);
    digitalWrite(STATUS_LED_PIN, LED_OFF);
    delay(200);

    Serial.print(".");
    retries++;
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    // FIX 3: After WiFi connects: "WiFi OK - IP: " + IP address
    Serial.println("WiFi OK - IP: " + WiFi.localIP().toString());
    Serial.print("[WIFI] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("[WIFI] WiFi connection failed. Restarting...");
    delay(1000);
    ESP.restart();
  }
}

// ==========================================================================================================
// MQTT CALLBACK
// ==========================================================================================================
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  char message[32];
  unsigned int copyLength = length < sizeof(message) - 1 ? length : sizeof(message) - 1;
  memcpy(message, payload, copyLength);
  message[copyLength] = '\0';

  Serial.println("Command received: " + String(topic) + " -> " + String(message));

  if (strcmp(topic, TOPIC_LIGHT_SET) == 0) {
    if (strcmp(message, "ON") == 0) {
      applyOutputState(true);
    } else if (strcmp(message, "OFF") == 0) {
      applyOutputState(false);
    } else {
      Serial.println("[MQTT] Invalid command. Only ON or OFF is accepted.");
    }
  }
}

// ==========================================================================================================
// MQTT RECONNECT
// ==========================================================================================================
bool reconnectMQTT() {
  // Set the Root CA certificate before connecting
  secureClient.setCACert(HIVEMQ_ROOT_CA);

  // Make sure it uses port 8883
  mqttClient.setServer(HIVEMQ_URL, 8883);

  while (!mqttClient.connected()) {
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi lost - reconnecting...");
      return false;
    }

    syncClockForTLS();

    String clientId = "TuyenHome-ESP32-";
    clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

    Serial.println("[MQTT] Attempting to connect to HiveMQ Cloud using TLS...");
    Serial.print("[MQTT] Client ID: ");
    Serial.println(clientId);

    bool connected = mqttClient.connect(
      clientId.c_str(),
      HIVEMQ_USERNAME,
      HIVEMQ_PASSWORD
    );

    if (connected) {
      Serial.println("MQTT Connected to HiveMQ");
      // FIX 3: After MQTT connects: "MQTT OK - HiveMQ port 8883"
      Serial.println("MQTT OK - HiveMQ port 8883");

      // Stay ON solid when fully connected
      digitalWrite(STATUS_LED_PIN, LED_ON);

      mqttClient.publish(TOPIC_DEVICE_STATUS, "online", true);

      if (mqttClient.subscribe(TOPIC_LIGHT_SET)) {
        Serial.print("[MQTT] Subscribed to control topic: ");
        Serial.println(TOPIC_LIGHT_SET);
      } else {
        Serial.println("[MQTT] Subscription to control topic failed.");
      }

      publishOutputState();
      return true;
    }

    // Prints the exact error code if connection fails
    int8_t state = mqttClient.state();
    Serial.print("MQTT connection failed, error code: ");
    Serial.print(state);
    Serial.print(" | ");
    Serial.println(mqttStateToText(state));

    // Blink slow (1000ms: 500ms ON, 500ms OFF) while connecting/retrying
    // Retries every 5 seconds, so we do 5 blinks of 1 second each
    for (int i = 0; i < 5; i++) {
      digitalWrite(STATUS_LED_PIN, LED_ON);
      delay(500);
      digitalWrite(STATUS_LED_PIN, LED_OFF);
      delay(500);
    }
  }

  return true;
}

// ==========================================================================================================
// SENSOR PUBLISH
// ==========================================================================================================
void publishSensorData() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int pirState = digitalRead(PIR_PIN);
  int ldrRaw = analogRead(LDR_PIN);
  int lightPercent = map(ldrRaw, 0, 4095, 0, 100);
  lightPercent = constrain(lightPercent, 0, 100);

  Serial.println("[SENSOR] Reading physical hardware data...");

  if (!isnan(temperature)) {
    char tempPayload[16];
    dtostrf(temperature, 0, 1, tempPayload);
    mqttClient.publish(TOPIC_TEMP, tempPayload, true);
    Serial.println("Published: " + String(TOPIC_TEMP) + " -> " + String(tempPayload));
  } else {
    Serial.println("[SENSOR] Error reading DHT11 - temperature.");
  }

  if (!isnan(humidity)) {
    char humidityPayload[16];
    dtostrf(humidity, 0, 1, humidityPayload);
    mqttClient.publish(TOPIC_HUMIDITY, humidityPayload, true);
    Serial.println("Published: " + String(TOPIC_HUMIDITY) + " -> " + String(humidityPayload));
  } else {
    Serial.println("[SENSOR] Error reading DHT11 - humidity.");
  }

  const char* motionPayload = pirState == HIGH ? "1" : "0";
  mqttClient.publish(TOPIC_MOTION, motionPayload, true);
  Serial.println("Published: " + String(TOPIC_MOTION) + " -> " + String(motionPayload));

  char lightPayload[8];
  snprintf(lightPayload, sizeof(lightPayload), "%d", lightPercent);
  mqttClient.publish(TOPIC_LIGHT_LEVEL, lightPayload, true);
  Serial.println("Published: " + String(TOPIC_LIGHT_LEVEL) + " -> " + String(lightPayload));
}

// ==========================================================================================================
// SETUP
// ==========================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("=== FIRMWARE STARTING ===");

  pinMode(STATUS_LED_PIN, OUTPUT);
  digitalWrite(STATUS_LED_PIN, LED_OFF); // Off initially

  pinMode(RELAY_LED_PIN, OUTPUT);
  applyOutputState(false);

  pinMode(PIR_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  dht.begin();

  connectWiFi();
  syncClockForTLS();

  secureClient.setCACert(HIVEMQ_ROOT_CA);
  secureClient.setTimeout(15000);

  mqttClient.setServer(HIVEMQ_URL, HIVEMQ_PORT);
  mqttClient.setCallback(mqttCallback);

  reconnectMQTT();
}

// ==========================================================================================================
// LOOP
// ==========================================================================================================
void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost - reconnecting...");
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    Serial.println("MQTT lost - reconnecting...");
    reconnectMQTT();
  } else {
    mqttClient.loop();

    unsigned long now = millis();
    if (now - lastSensorPublishMs >= SENSOR_PUBLISH_INTERVAL_MS) {
      lastSensorPublishMs = now;
      publishSensorData();
    }
  }
}
