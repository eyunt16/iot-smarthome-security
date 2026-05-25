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

// Chan phan cung thuc te
static const uint8_t DHT_PIN = 15;
static const uint8_t DHT_TYPE = DHT11;
static const uint8_t PIR_PIN = 33;
static const uint8_t LDR_PIN = 32;
static const uint8_t RELAY_LED_PIN = 17;

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
    case MQTT_CONNECTION_TIMEOUT: return "Het thoi gian ket noi";
    case MQTT_CONNECTION_LOST: return "Mat ket noi MQTT";
    case MQTT_CONNECT_FAILED: return "Loi mang hoac bat tay TLS";
    case MQTT_DISCONNECTED: return "Client dang ngat ket noi";
    case MQTT_CONNECTED: return "Da ket noi";
    case MQTT_CONNECT_BAD_PROTOCOL: return "Sai giao thuc MQTT";
    case MQTT_CONNECT_BAD_CLIENT_ID: return "Client ID khong hop le";
    case MQTT_CONNECT_UNAVAILABLE: return "Broker tam thoi khong san sang";
    case MQTT_CONNECT_BAD_CREDENTIALS: return "Sai username/password";
    case MQTT_CONNECT_UNAUTHORIZED: return "Khong duoc xac thuc";
    default: return "Loi khong xac dinh";
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

  Serial.println("[TLS] Dang dong bo thoi gian NTP de xac thuc chung chi...");
  configTime(GMT_OFFSET_SEC, DAYLIGHT_OFFSET_SEC, NTP_SERVER_1, NTP_SERVER_2);

  unsigned long startMs = millis();
  while (!isTimeSynced() && millis() - startMs < 15000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (isTimeSynced()) {
    Serial.println("[TLS] Dong bo gio thanh cong.");
  } else {
    Serial.println("[TLS] Khong dong bo duoc gio. Neu TLS fail, hay kiem tra Internet/NTP.");
  }
}

void publishOutputState() {
  const char* stateText = outputState ? "ON" : "OFF";
  mqttClient.publish(TOPIC_LIGHT_STATE, stateText, true);
  Serial.print("[MQTT] Da cap nhat trang thai output: ");
  Serial.println(stateText);
}

void applyOutputState(bool turnOn) {
  outputState = turnOn;
  digitalWrite(RELAY_LED_PIN, outputState ? HIGH : LOW);

  Serial.print("[THIET BI] Output GPIO ");
  Serial.print(RELAY_LED_PIN);
  Serial.print(" -> ");
  Serial.println(outputState ? "BAT" : "TAT");

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
  Serial.print("[WIFI] Dang ket noi toi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startMs = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startMs < WIFI_CONNECT_TIMEOUT_MS) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("[WIFI] Ket noi WiFi thanh cong.");
    Serial.print("[WIFI] IP: ");
    Serial.println(WiFi.localIP());
    Serial.print("[WIFI] RSSI: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.print("[WIFI] Ket noi WiFi that bai. Ma trang thai: ");
    Serial.println(WiFi.status());
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

  Serial.print("[MQTT] Nhan du lieu topic ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(message);

  if (strcmp(topic, TOPIC_LIGHT_SET) == 0) {
    if (strcmp(message, "ON") == 0) {
      applyOutputState(true);
    } else if (strcmp(message, "OFF") == 0) {
      applyOutputState(false);
    } else {
      Serial.println("[MQTT] Lenh khong hop le. Chi chap nhan ON hoac OFF.");
    }
  }
}

// ==========================================================================================================
// MQTT RECONNECT
// ==========================================================================================================
bool reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[MQTT] Bo qua reconnect vi WiFi chua san sang.");
    return false;
  }

  syncClockForTLS();

  String clientId = "TuyenHome-ESP32-";
  clientId += String((uint32_t)ESP.getEfuseMac(), HEX);

  Serial.println("[MQTT] Dang thu ket noi HiveMQ Cloud bang TLS...");
  Serial.print("[MQTT] Broker: ");
  Serial.println(HIVEMQ_URL);
  Serial.print("[MQTT] Port: ");
  Serial.println(HIVEMQ_PORT);
  Serial.print("[MQTT] Client ID: ");
  Serial.println(clientId);

  bool connected = mqttClient.connect(
    clientId.c_str(),
    HIVEMQ_USERNAME,
    HIVEMQ_PASSWORD
  );

  if (connected) {
    Serial.println("[MQTT] Ket noi MQTTS thanh cong.");

    mqttClient.publish(TOPIC_DEVICE_STATUS, "online", true);

    if (mqttClient.subscribe(TOPIC_LIGHT_SET)) {
      Serial.print("[MQTT] Da subscribe topic dieu khien: ");
      Serial.println(TOPIC_LIGHT_SET);
    } else {
      Serial.println("[MQTT] Subscribe topic dieu khien that bai.");
    }

    publishOutputState();
    return true;
  }

  int8_t state = mqttClient.state();
  Serial.print("[MQTT] Ket noi that bai. Ma loi = ");
  Serial.print(state);
  Serial.print(" | ");
  Serial.println(mqttStateToText(state));

  if (state == MQTT_CONNECT_FAILED) {
    Serial.println("[MQTT] Goi y: kiem tra Root CA, gio he thong, URL broker, Internet, hoac TLS handshake.");
  } else if (state == MQTT_CONNECT_BAD_CREDENTIALS || state == MQTT_CONNECT_UNAUTHORIZED) {
    Serial.println("[MQTT] Goi y: kiem tra HIVEMQ_USERNAME va HIVEMQ_PASSWORD.");
  }

  return false;
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

  Serial.println("[CAM BIEN] Doc du lieu phan cung thuc te...");

  if (!isnan(temperature)) {
    char tempPayload[16];
    dtostrf(temperature, 0, 1, tempPayload);
    mqttClient.publish(TOPIC_TEMP, tempPayload, true);
    Serial.print("[CAM BIEN] Nhiet do: ");
    Serial.print(tempPayload);
    Serial.println(" C");
  } else {
    Serial.println("[CAM BIEN] Loi doc DHT11 - nhiet do.");
  }

  if (!isnan(humidity)) {
    char humidityPayload[16];
    dtostrf(humidity, 0, 1, humidityPayload);
    mqttClient.publish(TOPIC_HUMIDITY, humidityPayload, true);
    Serial.print("[CAM BIEN] Do am: ");
    Serial.print(humidityPayload);
    Serial.println(" %");
  } else {
    Serial.println("[CAM BIEN] Loi doc DHT11 - do am.");
  }

  const char* motionPayload = pirState == HIGH ? "1" : "0";
  mqttClient.publish(TOPIC_MOTION, motionPayload, true);
  Serial.print("[CAM BIEN] Chuyen dong PIR: ");
  Serial.println(pirState == HIGH ? "CO CHUYEN DONG" : "KHONG CO CHUYEN DONG");

  char lightPayload[8];
  snprintf(lightPayload, sizeof(lightPayload), "%d", lightPercent);
  mqttClient.publish(TOPIC_LIGHT_LEVEL, lightPayload, true);
  Serial.print("[CAM BIEN] Anh sang LDR: ");
  Serial.print(lightPercent);
  Serial.print("% (ADC=");
  Serial.print(ldrRaw);
  Serial.println(")");
}

// ==========================================================================================================
// SETUP
// ==========================================================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("============================================================");
  Serial.println("TUYEN HOME - ESP32 SMART HOME");
  Serial.println("MQTTS / TLS voi HiveMQ Cloud - Port 8883");
  Serial.println("============================================================");

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
    connectWiFi();
  }

  if (!mqttClient.connected()) {
    unsigned long now = millis();
    if (now - lastReconnectAttemptMs >= MQTT_RECONNECT_INTERVAL_MS) {
      lastReconnectAttemptMs = now;
      reconnectMQTT();
    }
  } else {
    mqttClient.loop();

    unsigned long now = millis();
    if (now - lastSensorPublishMs >= SENSOR_PUBLISH_INTERVAL_MS) {
      lastSensorPublishMs = now;
      publishSensorData();
    }
  }
}
