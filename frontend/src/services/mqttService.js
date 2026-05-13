import mqtt from 'mqtt';

const MQTT_URL = 'ws://test.mosquitto.org:8080/mqtt'; // Websocket port for test.mosquitto.org
const SENSOR_TOPICS = [
  'home/temperature',
  'home/humidity',
  'home/motion',
  'home/device/light',
  'home/device/fan',
  'home/device/servo',
  'home/device/dc',
  'home/device/stepper'
];

class MQTTService {
  constructor() {
    this.client = null;
    this.callbacks = {};
    this.connectionCallbacks = new Set();
    this.isClientConnected = false;
  }

  connect() {
    if (this.client) return;

    this.client = mqtt.connect(MQTT_URL, {
      clientId: `web_client_${Math.random().toString(16).slice(3)}`,
      clean: true,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      this.isClientConnected = true;
      console.log('Connected to MQTT Broker via WebSocket');
      SENSOR_TOPICS.forEach((topic) => {
        this.client.subscribe(topic);
      });
      this.notifyConnectionChange(true);
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString();
      if (this.callbacks[topic]) {
        this.callbacks[topic].forEach((cb) => cb(payload));
      }
    });

    this.client.on('error', (err) => {
      console.error('MQTT Error:', err);
    });

    this.client.on('reconnect', () => {
      this.isClientConnected = false;
      this.notifyConnectionChange(false);
    });

    this.client.on('close', () => {
      this.isClientConnected = false;
      this.notifyConnectionChange(false);
    });

    this.client.on('offline', () => {
      this.isClientConnected = false;
      this.notifyConnectionChange(false);
    });
  }

  on(topic, callback) {
    if (!this.callbacks[topic]) {
      this.callbacks[topic] = [];
    }
    this.callbacks[topic].push(callback);
  }

  off(topic, callback) {
    if (!this.callbacks[topic]) return;
    this.callbacks[topic] = this.callbacks[topic].filter((cb) => cb !== callback);
  }

  publish(topic, message) {
    if (this.client && this.client.connected) {
      this.client.publish(topic, message);
    }
  }

  onConnectionChange(callback) {
    this.connectionCallbacks.add(callback);
    callback(this.isClientConnected);

    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  notifyConnectionChange(isConnected) {
    this.connectionCallbacks.forEach((callback) => callback(isConnected));
  }

  isConnected() {
    return this.isClientConnected;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.isClientConnected = false;
      this.notifyConnectionChange(false);
    }
  }
}

export default new MQTTService();
