import paho.mqtt.client as mqtt
import sqlite3
import datetime
import time

MQTT_BROKER = "test.mosquitto.org"
MQTT_PORT = 1883
TOPICS = [("home/temperature", 0), ("home/humidity", 0), ("home/motion", 0)]

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS sensor_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT,
            payload TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Connected to {MQTT_BROKER} with result code {rc}")
    client.subscribe(TOPICS)

def on_message(client, userdata, msg):
    topic = msg.topic
    payload = msg.payload.decode('utf-8')
    print(f"[MQTT] Received {payload} from {topic}")
    
    # Save to SQLite
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute(
        "INSERT INTO sensor_data (topic, payload) VALUES (?, ?)",
        (topic, payload)
    )
    conn.commit()
    conn.close()

def mqtt_loop():
    client = mqtt.Client(client_id="FlaskBackendSubscriber_12345")
    client.on_connect = on_connect
    client.on_message = on_message
    
    client.connect(MQTT_BROKER, MQTT_PORT, 60)
    
    print("[MQTT] Loop started")
    client.loop_forever()

if __name__ == "__main__":
    init_db()
    mqtt_loop()
