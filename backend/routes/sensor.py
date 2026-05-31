from flask import Blueprint, jsonify, request
from models.sensor_model import sensor_model
from services.mqtt_service import publish_message
import json

sensor_bp = Blueprint('sensor_bp', __name__)

# Device defaults
DEVICE_DEFAULTS = {
    'light1': '0',
    'light2': '0',
    'fan': '0',
    'dcmotor': 'stop',
    'stepper': 'stop',
}

@sensor_bp.route('/api/data', methods=['GET'])
def get_sensor_data():
    """Retrieve the latest sensor data from ESP32."""
    try:
        data = sensor_model.get_latest_data()
        # Parse JSON payload if present
        if data.get('payload'):
            try:
                parsed = json.loads(data['payload'])
                return jsonify({
                    'temperature': parsed.get('temperature'),
                    'humidity': parsed.get('humidity'),
                    'light': parsed.get('light'),
                    'motion': parsed.get('motion'),
                    'timestamp': data.get('timestamp')
                })
            except json.JSONDecodeError:
                return jsonify(data)
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sensor_bp.route('/api/devices', methods=['GET'])
def get_devices():
    """Compatibility endpoint for frontend device state polling."""
    try:
        return jsonify({
            'light': {
                'value': DEVICE_DEFAULTS['light1'],
                'timestamp': None,
            },
            'fan': {
                'value': DEVICE_DEFAULTS['fan'],
                'timestamp': None,
            },
            'servo': {
                'value': 'STOP',
                'timestamp': None,
            },
            'dc': {
                'value': DEVICE_DEFAULTS['dcmotor'].upper(),
                'timestamp': None,
            },
            'stepper': {
                'value': DEVICE_DEFAULTS['stepper'].upper(),
                'timestamp': None,
            },
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sensor_bp.route('/api/history', methods=['GET'])
def get_sensor_history():
    """Retrieve historical sensor data."""
    limit = request.args.get('limit', default=50, type=int)
    try:
        history = sensor_model.get_history(limit=limit)
        # Parse JSON payloads
        parsed_history = []
        for record in history:
            try:
                if record.get('payload'):
                    payload = json.loads(record['payload'])
                    parsed_history.append({
                        'topic': record['topic'],
                        'data': payload,
                        'timestamp': record['timestamp']
                    })
            except json.JSONDecodeError:
                parsed_history.append(record)
        return jsonify(parsed_history)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@sensor_bp.route('/api/device/control', methods=['POST'])
def control_device():
    """Send control commands to ESP32 via MQTT."""
    try:
        data = request.json or {}
        device = data.get('device')
        action = data.get('action')
        value = data.get('value')
        
        if not device or not action:
            return jsonify({"error": "Missing device or action"}), 400
        
        # Build command payload
        command_payload = {
            "device": device,
            "action": action
        }
        
        # Add value if present (for brightness/speed controls)
        if value is not None:
            command_payload["value"] = value
        
        # Publish to MQTT control topic
        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )
        
        if success:
            return jsonify({
                "status": "success",
                "message": f"Command sent to {device}",
                "command": command_payload
            })
        else:
            return jsonify({
                "status": "error",
                "message": "Failed to send command"
            }), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/device/command', methods=['POST'])
def control_device_compat():
    """Compatibility endpoint for legacy frontend command requests."""
    try:
        data = request.json or {}
        device = data.get('device')
        command = data.get('command')

        if not device or command is None:
            return jsonify({"error": "Missing device or command"}), 400

        normalized_command = str(command).strip()
        lowered_command = normalized_command.lower()

        command_payload = {
            "device": device,
            "action": lowered_command,
            "value": normalized_command,
        }

        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )

        if success:
            return jsonify({
                "status": "success",
                "message": f"Command sent to {device}",
                "command": command_payload
            })

        return jsonify({
            "status": "error",
            "message": "Failed to send command"
        }), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/device/toggle', methods=['POST'])
def toggle_device():
    """Compatibility endpoint for simple on/off toggles from the frontend."""
    try:
        data = request.json or {}
        device = data.get('device')
        state = data.get('state')

        if not device or state is None:
            return jsonify({"error": "Missing device or state"}), 400

        command_payload = {
            "device": device,
            "action": "toggle",
            "value": str(state),
        }

        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )

        if success:
            return jsonify({
                "status": "success",
                "message": f"Toggle command sent to {device}",
                "command": command_payload
            })

        return jsonify({
            "status": "error",
            "message": "Failed to send command"
        }), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/device/light/<light_num>', methods=['POST'])
def control_light(light_num):
    """Control light brightness (0-100%)."""
    try:
        data = request.json or {}
        brightness = data.get('brightness', 0)
        
        # Validate brightness range
        brightness = max(0, min(100, int(brightness)))
        
        command_payload = {
            "device": f"light{light_num}",
            "action": "brightness",
            "value": brightness
        }
        
        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )
        
        # Also publish plain text command to home/door/control for ESP8266 relay compatibility
        state_text = "unlock" if brightness > 0 else "lock"
        publish_message("home/door/control", state_text)
        
        if success:
            return jsonify({
                "status": "success",
                "light": light_num,
                "brightness": brightness
            })
        else:
            return jsonify({"status": "error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/device/fan', methods=['POST'])
def control_fan():
    """Control fan speed (0-100%)."""
    try:
        data = request.json or {}
        speed = data.get('speed', 0)
        
        # Validate speed range
        speed = max(0, min(100, int(speed)))
        
        command_payload = {
            "device": "fan",
            "action": "speed",
            "value": speed
        }
        
        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )
        
        if success:
            return jsonify({
                "status": "success",
                "speed": speed
            })
        else:
            return jsonify({"status": "error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/device/motor', methods=['POST'])
def control_motor():
    """Control DC motor (forward/reverse/stop with speed)."""
    try:
        data = request.json or {}
        direction = data.get('direction', 'stop')  # forward, reverse, stop
        speed = data.get('speed', 0)
        
        # Validate inputs
        if direction not in ['forward', 'reverse', 'stop']:
            return jsonify({"error": "Invalid direction"}), 400
        
        speed = max(0, min(100, int(speed)))
        
        command_payload = {
            "device": "dcmotor",
            "action": direction,
            "value": speed if direction != 'stop' else 0
        }
        
        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )
        
        if success:
            return jsonify({
                "status": "success",
                "direction": direction,
                "speed": speed
            })
        else:
            return jsonify({"status": "error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/device/stepper', methods=['POST'])
def control_stepper():
    """Control stepper motor (cw/ccw/stop)."""
    try:
        data = request.json or {}
        direction = data.get('direction', 'stop')  # cw, ccw, stop
        
        # Validate input
        if direction not in ['cw', 'ccw', 'stop']:
            return jsonify({"error": "Invalid direction"}), 400
        
        command_payload = {
            "device": "stepper",
            "action": direction
        }
        
        success = publish_message(
            "home/tuyenesp32/control",
            json.dumps(command_payload)
        )
        
        if success:
            return jsonify({
                "status": "success",
                "direction": direction
            })
        else:
            return jsonify({"status": "error"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@sensor_bp.route('/api/devices/status', methods=['GET'])
def get_device_status():
    """Get latest sensor reading."""
    try:
        data = sensor_model.get_latest_data()
        if data and data.get('payload'):
            try:
                parsed = json.loads(data['payload'])
                return jsonify({
                    "status": "success",
                    "sensors": parsed
                })
            except json.JSONDecodeError:
                return jsonify(data)
        return jsonify({"status": "no_data"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
