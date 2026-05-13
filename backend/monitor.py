#!/usr/bin/env python3
"""
Backend Data Monitoring Dashboard
Shows real-time system statistics, logs, and device status
"""

import sqlite3
import os
import sys
from datetime import datetime, timedelta
from config.config import config

class BackendMonitor:
    def __init__(self):
        self.db_path = config.DATABASE_PATH
    
    def _get_connection(self):
        """Get database connection."""
        if not os.path.exists(self.db_path):
            print(f"❌ Database not found at: {self.db_path}")
            print(f"Please run the backend first: python app.py")
            return None
        return sqlite3.connect(self.db_path)
    
    def print_header(self, title):
        """Print formatted header."""
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}\n")
    
    def show_system_overview(self):
        """Show overall system status."""
        self.print_header("📊 SYSTEM OVERVIEW")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        
        # Database size
        db_size = os.path.getsize(self.db_path) / 1024  # KB
        print(f"📁 Database Size: {db_size:.2f} KB")
        
        # Total records
        c.execute("SELECT COUNT(*) FROM sensor_readings")
        total_readings = c.fetchone()[0]
        print(f"📈 Total Sensor Readings: {total_readings:,}")
        
        # Unique sensors
        c.execute("SELECT COUNT(DISTINCT sensor_name) FROM sensor_readings")
        unique_sensors = c.fetchone()[0]
        print(f"📊 Unique Sensors: {unique_sensors}")
        
        # API calls today
        c.execute("""
            SELECT COUNT(*) FROM api_logs
            WHERE date(timestamp) = date('now')
        """)
        api_today = c.fetchone()[0]
        print(f"🔌 API Calls Today: {api_today}")
        
        # MQTT messages today
        c.execute("""
            SELECT COUNT(*) FROM mqtt_logs
            WHERE date(timestamp) = date('now')
        """)
        mqtt_today = c.fetchone()[0]
        print(f"📡 MQTT Messages Today: {mqtt_today}")
        
        conn.close()
    
    def show_latest_sensor_data(self):
        """Show latest sensor readings."""
        self.print_header("📡 LATEST SENSOR DATA")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        c.execute("""
            SELECT DISTINCT sensor_name, sensor_value, sensor_unit, timestamp
            FROM sensor_readings
            WHERE timestamp = (SELECT MAX(timestamp) FROM sensor_readings)
            ORDER BY sensor_name
        """)
        
        rows = c.fetchall()
        
        if not rows:
            print("❌ No sensor data found")
        else:
            print(f"{'Sensor Name':<20} {'Value':<15} {'Unit':<10} {'Timestamp':<25}")
            print("-" * 70)
            for row in rows:
                name, value, unit, ts = row
                print(f"{name:<20} {str(value):<15} {str(unit):<10} {ts:<25}")
        
        conn.close()
    
    def show_device_states(self):
        """Show current device states."""
        self.print_header("🎮 CURRENT DEVICE STATES")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        c.execute("""
            SELECT device_name, state_value, last_updated, updated_by
            FROM device_state
            ORDER BY device_name
        """)
        
        rows = c.fetchall()
        
        if not rows:
            print("❌ No device states found")
        else:
            print(f"{'Device':<20} {'State':<20} {'Last Updated':<20} {'Updated By':<15}")
            print("-" * 75)
            for row in rows:
                device, state, updated, by = row
                state_str = str(state)[:19]
                print(f"{device:<20} {state_str:<20} {updated:<20} {by:<15}")
        
        conn.close()
    
    def show_recent_api_calls(self, limit=10):
        """Show recent API calls."""
        self.print_header(f"🔌 RECENT API CALLS (Last {limit})")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        c.execute("""
            SELECT endpoint, method, status_code, timestamp
            FROM api_logs
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        
        rows = c.fetchall()
        
        if not rows:
            print("❌ No API logs found")
        else:
            print(f"{'Endpoint':<25} {'Method':<8} {'Status':<8} {'Timestamp':<25}")
            print("-" * 66)
            for row in rows:
                endpoint, method, status, ts = row
                color = "✅" if status < 400 else "❌"
                print(f"{endpoint:<25} {method:<8} {color} {status:<6} {ts:<25}")
        
        conn.close()
    
    def show_recent_mqtt_messages(self, limit=10):
        """Show recent MQTT messages."""
        self.print_header(f"📡 RECENT MQTT MESSAGES (Last {limit})")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        c.execute("""
            SELECT topic, direction, message, timestamp
            FROM mqtt_logs
            ORDER BY timestamp DESC
            LIMIT ?
        """, (limit,))
        
        rows = c.fetchall()
        
        if not rows:
            print("❌ No MQTT logs found")
        else:
            print(f"{'Topic':<30} {'Direction':<10} {'Message':<20} {'Timestamp':<25}")
            print("-" * 85)
            for row in rows:
                topic, direction, message, ts = row
                direction_emoji = "📤" if direction == "outgoing" else "📥"
                msg_preview = str(message)[:19]
                print(f"{topic:<30} {direction_emoji} {direction:<8} {msg_preview:<20} {ts:<25}")
        
        conn.close()
    
    def show_sensor_statistics(self):
        """Show sensor statistics."""
        self.print_header("📊 SENSOR STATISTICS")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        
        c.execute("""
            SELECT sensor_name, COUNT(*) as count, 
                   MIN(sensor_value) as min_val, 
                   MAX(sensor_value) as max_val,
                   AVG(sensor_value) as avg_val
            FROM sensor_readings
            WHERE sensor_value IS NOT NULL
            GROUP BY sensor_name
            ORDER BY sensor_name
        """)
        
        rows = c.fetchall()
        
        if not rows:
            print("❌ No sensor statistics available")
        else:
            print(f"{'Sensor':<20} {'Count':<10} {'Min':<12} {'Max':<12} {'Avg':<12}")
            print("-" * 66)
            for row in rows:
                name, count, min_v, max_v, avg_v = row
                print(f"{name:<20} {count:<10} {str(min_v)[:11]:<12} {str(max_v)[:11]:<12} {str(avg_v)[:11]:<12}")
        
        conn.close()
    
    def show_hourly_api_stats(self):
        """Show API statistics by hour."""
        self.print_header("📊 API STATISTICS (Last 24 Hours)")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        c.execute("""
            SELECT 
                strftime('%H:00', timestamp) as hour,
                COUNT(*) as total_calls,
                SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) as success,
                SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
            FROM api_logs
            WHERE timestamp > datetime('now', '-24 hours')
            GROUP BY hour
            ORDER BY hour DESC
        """)
        
        rows = c.fetchall()
        
        if not rows:
            print("❌ No API statistics available")
        else:
            print(f"{'Hour':<10} {'Total':<8} {'Success':<10} {'Errors':<8}")
            print("-" * 36)
            for row in rows:
                hour, total, success, errors = row
                errors = errors if errors else 0
                print(f"{hour:<10} {total:<8} {success:<10} {errors:<8}")
        
        conn.close()
    
    def cleanup_old_data(self, days=30):
        """Clean up old sensor data."""
        self.print_header(f"🧹 CLEANING OLD DATA (Older than {days} days)")
        
        conn = self._get_connection()
        if not conn:
            return
        
        c = conn.cursor()
        
        c.execute("""
            DELETE FROM sensor_readings
            WHERE timestamp < datetime('now', '-' || ? || ' days')
        """, (days,))
        
        deleted = c.rowcount
        conn.commit()
        conn.close()
        
        print(f"✅ Deleted {deleted} old sensor readings")
    
    def show_full_dashboard(self):
        """Show complete monitoring dashboard."""
        print("\n")
        print("╔" + "="*58 + "╗")
        print("║" + " "*12 + "🚀 IoT BACKEND DATA MONITOR 🚀" + " "*16 + "║")
        print("╚" + "="*58 + "╝")
        
        self.show_system_overview()
        self.show_latest_sensor_data()
        self.show_device_states()
        self.show_recent_api_calls(5)
        self.show_recent_mqtt_messages(5)
        self.show_sensor_statistics()
        self.show_hourly_api_stats()
        
        print("\n" + "="*60)
        print("📈 Dashboard last updated:", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
        print("="*60 + "\n")

def main():
    """Main entry point."""
    monitor = BackendMonitor()
    
    if len(sys.argv) > 1:
        command = sys.argv[1].lower()
        
        if command == 'overview':
            monitor.show_system_overview()
        elif command == 'sensors':
            monitor.show_latest_sensor_data()
        elif command == 'devices':
            monitor.show_device_states()
        elif command == 'api':
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            monitor.show_recent_api_calls(limit)
        elif command == 'mqtt':
            limit = int(sys.argv[2]) if len(sys.argv) > 2 else 10
            monitor.show_recent_mqtt_messages(limit)
        elif command == 'stats':
            monitor.show_sensor_statistics()
        elif command == 'cleanup':
            days = int(sys.argv[2]) if len(sys.argv) > 2 else 30
            monitor.cleanup_old_data(days)
        elif command == 'help':
            print("""
Backend Monitor Usage:
  python monitor.py              # Show full dashboard
  python monitor.py overview     # Show system overview
  python monitor.py sensors      # Show latest sensor data
  python monitor.py devices      # Show device states
  python monitor.py api [limit]  # Show recent API calls (default: 10)
  python monitor.py mqtt [limit] # Show recent MQTT messages (default: 10)
  python monitor.py stats        # Show sensor statistics
  python monitor.py cleanup [days] # Clean old data (default: 30 days)
  python monitor.py help         # Show this help message
            """)
        else:
            print(f"Unknown command: {command}")
            print("Use 'python monitor.py help' for available commands")
    else:
        monitor.show_full_dashboard()

if __name__ == '__main__':
    main()
