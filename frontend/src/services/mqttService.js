import mqtt from 'mqtt';

// 1. CHỈNH LẠI ĐÚNG ĐÀI PHÁT THANH HIVEMQ CỦA BẠN (Dùng WSS và Port 8884 cho Frontend)
const MQTT_URL = 'wss://4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud:8884/mqtt'; 

// 2. CHỈNH LẠI TOPIC ĐỂ HỨNG DATA CỦA TẤT CẢ CÁC PHÒNG (Dùng Wildcard #)
const SENSOR_TOPICS = [
  'tuyenhome/env/#'
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

    // 3. THÊM TÀI KHOẢN MẬT KHẨU HIVEMQ VÀO ĐÂY
    this.client = mqtt.connect(MQTT_URL, {
      clientId: `web_client_${Math.random().toString(16).slice(3)}`,
      username: 'Tuyen',
      password: '123456789tT',
      clean: true,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      this.isClientConnected = true;
      console.log('✅ Đã kết nối thành công tới HiveMQ Broker qua WebSocket');
      SENSOR_TOPICS.forEach((topic) => {
        this.client.subscribe(topic);
      });
      this.notifyConnectionChange(true);
    });

    this.client.on('message', (topic, message) => {
      const payload = message.toString();
      // Bắn data về cho các component đang lắng nghe
      if (this.callbacks[topic]) {
        this.callbacks[topic].forEach((cb) => cb(payload));
      }
      // Vì dùng wildcard 'tuyenhome/env/#', ta kích hoạt luôn callback cho wildcard nếu component có đăng ký
      if (this.callbacks['tuyenhome/env/#']) {
         this.callbacks['tuyenhome/env/#'].forEach((cb) => cb({ topic, payload }));
      }
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT Error:', err);
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