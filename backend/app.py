import threading
from flask import Flask
from flask_cors import CORS
from services.database import init_db, log_api_call
from services.mqtt_service import mqtt_loop
from routes.auth import auth_bp
from routes.sensor import sensor_bp
from config.config import config

def create_app():
    app = Flask(__name__)
    CORS(app)  # Allow frontend to access API
    
    # Initialize Database with improved schema
    init_db()

    # Register Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(sensor_bp)
    
    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return {
            'status': 'running',
            'database': 'connected',
            'version': '2.0'
        }, 200

    return app

if __name__ == '__main__':
    # Start MQTT subscriber in a daemon thread so it runs in background
    mqtt_thread = threading.Thread(target=mqtt_loop, daemon=True)
    mqtt_thread.start()
    
    app = create_app()
    print(f"\n🚀 Starting IoT Backend...")
    print(f"📌 Flask Host: {config.FLASK_HOST}")
    print(f"📌 Flask Port: {config.FLASK_PORT}")
    print(f"📌 Database: {config.DATABASE_PATH}")
    print(f"📌 MQTT Broker: {config.MQTT_BROKER}:{config.MQTT_PORT}\n")
    
    # Run server without reloader to prevent double MQTT threads
    app.run(host=config.FLASK_HOST, port=config.FLASK_PORT, debug=config.FLASK_DEBUG, use_reloader=False)
