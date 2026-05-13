# Configuration Management for IoT Backend
import os

class Config:
    """Base configuration."""
    
    # Database
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'iot_smart_home.db')
    
    # MQTT Configuration
    MQTT_BROKER = "4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud"
    MQTT_PORT = 8883
    MQTT_USERNAME = "Tuyen"
    MQTT_PASSWORD = "123456789tT"
    MQTT_DEVICE_ID = "ESP32_SmartHome_001"
    
    # MQTT Topics
    MQTT_TOPIC_SENSORS = "home/tuyenesp32/sensors"
    MQTT_TOPIC_CONTROL = "home/tuyenesp32/control"
    
    # Flask Configuration
    FLASK_PORT = 5000
    FLASK_HOST = "0.0.0.0"
    FLASK_DEBUG = True
    
    # Credentials (for demo)
    ADMIN_USERNAME = "admin"
    ADMIN_PASSWORD = "admin123@"
    
    # Device Configuration
    DEVICES = {
        'light1': {
            'name': 'Light 1',
            'type': 'pwm_light',
            'min': 0,
            'max': 100,
            'unit': '%'
        },
        'light2': {
            'name': 'Light 2',
            'type': 'pwm_light',
            'min': 0,
            'max': 100,
            'unit': '%'
        },
        'fan': {
            'name': 'Fan',
            'type': 'pwm_fan',
            'min': 0,
            'max': 100,
            'unit': '%'
        },
        'dcmotor': {
            'name': 'DC Motor',
            'type': 'dc_motor',
            'states': ['stop', 'forward', 'backward']
        },
        'stepper': {
            'name': 'Stepper Motor',
            'type': 'stepper_motor',
            'states': ['stop', 'cw', 'ccw']
        }
    }
    
    # Sensors Configuration
    SENSORS = {
        'temperature': {
            'name': 'Temperature',
            'unit': '°C',
            'min': -20,
            'max': 50
        },
        'humidity': {
            'name': 'Humidity',
            'unit': '%',
            'min': 0,
            'max': 100
        },
        'light': {
            'name': 'Light Level',
            'unit': 'lux',
            'min': 0,
            'max': 100000
        },
        'motion': {
            'name': 'Motion Detection',
            'unit': 'bool',
            'values': ['detected', 'clear']
        }
    }

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    TESTING = False

# Configuration selector
ENV = os.getenv('FLASK_ENV', 'development')
config = DevelopmentConfig() if ENV == 'development' else ProductionConfig()
