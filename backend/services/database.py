import sqlite3
import os
from datetime import datetime
from config.config import config

def get_db_path():
    """Get database path."""
    db_dir = os.path.dirname(config.DATABASE_PATH)
    os.makedirs(db_dir, exist_ok=True)
    return config.DATABASE_PATH

def init_db():
    """Initialize the SQLite database with improved schema."""
    db_path = get_db_path()
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # Users table - for authentication
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'customer',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME,
            is_active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Add role column to existing users table if it doesn't exist
    c.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in c.fetchall()]
    if 'role' not in columns:
        c.execute('ALTER TABLE users ADD COLUMN role TEXT DEFAULT "customer"')
    
    # Devices table - for device configuration and state
    c.execute('''
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_name TEXT UNIQUE NOT NULL,
            device_type TEXT NOT NULL,
            device_id TEXT UNIQUE,
            status TEXT DEFAULT 'offline',
            last_seen DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Sensor readings table - for actual sensor data
    c.execute('''
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_id TEXT NOT NULL,
            sensor_name TEXT NOT NULL,
            sensor_value REAL,
            sensor_unit TEXT,
            topic TEXT,
            payload TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(device_id) REFERENCES devices(device_id)
        )
    ''')
    
    # Device state table - for current device state (light brightness, fan speed, etc.)
    c.execute('''
        CREATE TABLE IF NOT EXISTS device_state (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            device_name TEXT UNIQUE NOT NULL,
            state_value TEXT,
            state_type TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT DEFAULT 'system'
        )
    ''')
    
    # API logs table - for tracking API calls
    c.execute('''
        CREATE TABLE IF NOT EXISTS api_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            endpoint TEXT,
            method TEXT,
            status_code INTEGER,
            request_data TEXT,
            response_data TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # MQTT logs table - for tracking MQTT messages
    c.execute('''
        CREATE TABLE IF NOT EXISTS mqtt_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT,
            message TEXT,
            direction TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create indexes for better query performance
    c.execute('CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings(timestamp)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_sensor_readings_device ON sensor_readings(device_id)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs(timestamp)')
    c.execute('CREATE INDEX IF NOT EXISTS idx_mqtt_logs_timestamp ON mqtt_logs(timestamp)')
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at: {get_db_path()}")

def save_sensor_data(topic, payload, device_id="ESP32_SmartHome_001"):
    """Save an incoming MQTT payload into the sensor_readings table."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        # Extract sensor name from topic (e.g., "home/tuyenesp32/sensors" -> sensors)
        sensor_name = topic.split('/')[-1] if '/' in topic else 'unknown'
        
        c.execute("""
            INSERT INTO sensor_readings 
            (device_id, sensor_name, topic, payload) 
            VALUES (?, ?, ?, ?)
        """, (device_id, sensor_name, topic, payload))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error saving sensor data: {e}")
        return False

def update_device_state(device_name, state_value, state_type='string', updated_by='api'):
    """Update or insert device state."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("""
            INSERT OR REPLACE INTO device_state 
            (device_name, state_value, state_type, last_updated, updated_by)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
        """, (device_name, state_value, state_type, updated_by))
        
        conn.commit()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Error updating device state: {e}")
        return False

def get_device_state(device_name):
    """Get current device state."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("SELECT state_value, last_updated FROM device_state WHERE device_name = ?", (device_name,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return {'state': result[0], 'last_updated': result[1]}
        return None
    except Exception as e:
        print(f"❌ Error getting device state: {e}")
        return None

def log_api_call(endpoint, method, status_code, request_data=None, response_data=None):
    """Log API calls for monitoring."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("""
            INSERT INTO api_logs 
            (endpoint, method, status_code, request_data, response_data)
            VALUES (?, ?, ?, ?, ?)
        """, (endpoint, method, status_code, request_data, response_data))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"❌ Error logging API call: {e}")

def log_mqtt_message(topic, message, direction='incoming'):
    """Log MQTT messages for monitoring."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("""
            INSERT INTO mqtt_logs 
            (topic, message, direction)
            VALUES (?, ?, ?)
        """, (topic, message, direction))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"❌ Error logging MQTT message: {e}")

def cleanup_old_data(days=30):
    """Clean up old sensor data to keep database size manageable."""
    db_path = get_db_path()
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        
        c.execute("""
            DELETE FROM sensor_readings 
            WHERE timestamp < datetime('now', '-' || ? || ' days')
        """, (days,))
        
        deleted_count = c.rowcount
        conn.commit()
        conn.close()
        
        if deleted_count > 0:
            print(f"✅ Cleaned up {deleted_count} old sensor readings")
        return True
    except Exception as e:
        print(f"❌ Error cleaning up old data: {e}")
        return False
