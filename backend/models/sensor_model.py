import sqlite3
from config.config import config

class SensorModel:
    def __init__(self):
        self.db_path = config.DATABASE_PATH

    def _get_connection(self):
        return sqlite3.connect(self.db_path)

    def get_latest_data(self):
        """Get latest sensor readings from all sensors."""
        conn = self._get_connection()
        c = conn.cursor()
        query = """
            SELECT sensor_name, sensor_value, sensor_unit, topic, payload, timestamp
            FROM sensor_readings
            WHERE timestamp = (SELECT MAX(timestamp) FROM sensor_readings)
            ORDER BY timestamp DESC
        """
        c.execute(query)
        rows = c.fetchall()
        conn.close()
        
        data = {}
        for row in rows:
            sensor_name, value, unit, topic, payload, ts = row
            data[sensor_name] = {
                'value': value,
                'unit': unit,
                'topic': topic,
                'payload': payload,
                'timestamp': ts
            }
        return data

    def get_latest_by_sensor(self, sensor_name):
        """Get latest reading for a specific sensor."""
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT sensor_value, sensor_unit, timestamp, payload
            FROM sensor_readings
            WHERE sensor_name = ?
            ORDER BY timestamp DESC
            LIMIT 1
        """, (sensor_name,))
        
        row = c.fetchone()
        conn.close()
        
        if row:
            return {
                'value': row[0],
                'unit': row[1],
                'timestamp': row[2],
                'payload': row[3]
            }
        return None

    def get_history(self, limit=50, sensor_name=None, device_id=None):
        """Get historical sensor data with optional filters."""
        conn = self._get_connection()
        c = conn.cursor()
        
        if sensor_name:
            c.execute("""
                SELECT sensor_name, sensor_value, sensor_unit, timestamp, topic, payload
                FROM sensor_readings
                WHERE sensor_name = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (sensor_name, limit))
        elif device_id:
            c.execute("""
                SELECT sensor_name, sensor_value, sensor_unit, timestamp, topic, payload
                FROM sensor_readings
                WHERE device_id = ?
                ORDER BY timestamp DESC
                LIMIT ?
            """, (device_id, limit))
        else:
            c.execute("""
                SELECT sensor_name, sensor_value, sensor_unit, timestamp, topic, payload
                FROM sensor_readings
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
        
        rows = c.fetchall()
        conn.close()
        
        return [{
            'sensor_name': r[0],
            'value': r[1],
            'unit': r[2],
            'timestamp': r[3],
            'topic': r[4],
            'payload': r[5]
        } for r in rows]

    def get_device_state(self, device_name):
        """Get current state of a device."""
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT state_value, state_type, last_updated, updated_by
            FROM device_state
            WHERE device_name = ?
        """, (device_name,))
        
        row = c.fetchone()
        conn.close()
        
        if row:
            return {
                'state_value': row[0],
                'state_type': row[1],
                'last_updated': row[2],
                'updated_by': row[3]
            }
        return None

    def get_all_device_states(self):
        """Get current state of all devices."""
        conn = self._get_connection()
        c = conn.cursor()
        c.execute("SELECT device_name, state_value, state_type, last_updated FROM device_state ORDER BY device_name")
        
        rows = c.fetchall()
        conn.close()
        
        return [{
            'device_name': r[0],
            'state_value': r[1],
            'state_type': r[2],
            'last_updated': r[3]
        } for r in rows]

    def get_stats(self):
        """Get database statistics for monitoring."""
        conn = self._get_connection()
        c = conn.cursor()
        
        c.execute("SELECT COUNT(*) FROM sensor_readings")
        total_readings = c.fetchone()[0]
        
        c.execute("SELECT COUNT(DISTINCT sensor_name) FROM sensor_readings")
        unique_sensors = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM api_logs")
        total_api_calls = c.fetchone()[0]
        
        c.execute("SELECT COUNT(*) FROM mqtt_logs")
        total_mqtt_messages = c.fetchone()[0]
        
        conn.close()
        
        return {
            'total_sensor_readings': total_readings,
            'unique_sensors': unique_sensors,
            'total_api_calls': total_api_calls,
            'total_mqtt_messages': total_mqtt_messages
        }

sensor_model = SensorModel()
