import { useCallback, useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';

const HISTORY_POINTS = 24;
const UPDATE_INTERVAL = 3000;
const MOTION_CHANCE = 0.07;
const ROOM_TOPIC = 'tuyenhome/env/#';
const REALTIME_STALE_MS = 12000;
const TARGET_BLEND = 0.38;
const ROOM_KEYS = ['livingroom', 'bedroom', 'kitchen'];
const ROOM_DEFAULTS = {
  livingroom: { temperature: 27.5, humidity: 60, lux: 320 },
  bedroom: { temperature: 24.0, humidity: 55, lux: 180 },
  kitchen: { temperature: 31.2, humidity: 70, lux: 420 },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function timeLabel(withSeconds = false) {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
  });
}

function buildHistory(base, spread, points = HISTORY_POINTS) {
  const now = Date.now();
  return Array.from({ length: points }, (_, index) => {
    const time = new Date(now - (points - index) * UPDATE_INTERVAL);
    return {
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: +(base + (Math.random() - 0.5) * spread).toFixed(1),
    };
  });
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function createRoomsSnapshot() {
  return {
    livingroom: { ...ROOM_DEFAULTS.livingroom },
    bedroom: { ...ROOM_DEFAULTS.bedroom },
    kitchen: { ...ROOM_DEFAULTS.kitchen },
  };
}

function average(values, fallback = 0) {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) {
    return fallback;
  }

  return validValues.reduce((sum, value) => sum + value, 0) / validValues.length;
}

function appendHistory(history, value) {
  return [...history.slice(-(HISTORY_POINTS - 1)), { time: timeLabel(), value }];
}

function stepToward(currentValue, targetValue, jitter, min, max, decimals = 1) {
  const nextValue = currentValue + (targetValue - currentValue) * TARGET_BLEND + (Math.random() - 0.5) * jitter;
  return +clamp(nextValue, min, max).toFixed(decimals);
}

function stepHumidity(currentValue, targetValue) {
  const nextValue = currentValue + (targetValue - currentValue) * TARGET_BLEND + (Math.random() - 0.5) * 3.2;
  return Math.round(clamp(nextValue, 30, 95));
}

function stepLux(currentValue, targetValue) {
  const nextValue = currentValue + (targetValue - currentValue) * 0.42 + (Math.random() - 0.5) * 48;
  return Math.round(clamp(nextValue, 30, 900));
}

export function useMQTT() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [allRoomsData, setAllRoomsData] = useState(() => createRoomsSnapshot());
  const [sensorData, setSensorData] = useState(() => ({
    temperature: { current: 27.4, history: buildHistory(27, 4) },
    humidity: { current: 58, history: buildHistory(58, 10) },
    light: { current: 320, history: buildHistory(320, 140) },
    motion: { current: false, lastEvent: null, alertCount: 0 },
  }));
  const [deviceStates, setDeviceStates] = useState({
    light: { on: false, brightness: 0 },
    fan: { on: false, speed: 0 },
  });
  const [commandLog, setCommandLog] = useState([]);

  const clientRef = useRef(null);
  const timerRef = useRef(null);
  const simulatedRoomsRef = useRef(createRoomsSnapshot());
  const realtimeRoomsRef = useRef(createRoomsSnapshot());
  const roomRealtimeRef = useRef({
    livingroom: 0,
    bedroom: 0,
    kitchen: 0,
  });
  const listenersRef = useRef({});

  const addLog = useCallback((topic, payload, type = 'receive') => {
    setCommandLog((prev) => [
      {
        id: Date.now() + Math.random(),
        time: timeLabel(true),
        topic,
        payload: String(payload),
        type,
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const updateLegacySensorSnapshot = useCallback((rooms, previousSensorState) => {
    const temperatures = ROOM_KEYS.map((roomKey) => toNumber(rooms[roomKey]?.temperature, NaN));
    const humidities = ROOM_KEYS.map((roomKey) => toNumber(rooms[roomKey]?.humidity, NaN));
    const luxReadings = ROOM_KEYS.map((roomKey) => toNumber(rooms[roomKey]?.lux, NaN));
    const avgTemp = +average(temperatures, previousSensorState.temperature.current || 0).toFixed(1);
    const avgHum = Math.round(average(humidities, previousSensorState.humidity.current || 0));
    const avgLux = Math.round(average(luxReadings, previousSensorState.light?.current || 320));
    const nextMotion = Math.random() < MOTION_CHANCE;
    const motionTriggered = nextMotion && !previousSensorState.motion.current;

    return {
      temperature: {
        current: avgTemp,
        history: appendHistory(previousSensorState.temperature.history, avgTemp),
      },
      humidity: {
        current: avgHum,
        history: appendHistory(previousSensorState.humidity.history, avgHum),
      },
      light: {
        current: avgLux,
        history: appendHistory(previousSensorState.light?.history || [], avgLux),
      },
      motion: {
        current: nextMotion,
        lastEvent: motionTriggered ? new Date().toLocaleTimeString() : previousSensorState.motion.lastEvent,
        alertCount: previousSensorState.motion.alertCount + (motionTriggered ? 1 : 0),
      },
    };
  }, []);

  const emitTopicMessage = useCallback((topic, payload) => {
    const exactListeners = listenersRef.current[topic] || [];
    const wildcardListeners = listenersRef.current[ROOM_TOPIC] || [];

    exactListeners.forEach((callback) => callback(payload));
    wildcardListeners.forEach((callback) => callback({ topic, payload }));
  }, []);

  const on = useCallback((topic, callback) => {
    if (!listenersRef.current[topic]) {
      listenersRef.current[topic] = new Set();
    }

    listenersRef.current[topic].add(callback);
  }, []);

  const off = useCallback((topic, callback) => {
    const listeners = listenersRef.current[topic];
    if (!listeners) {
      return;
    }

    listeners.delete(callback);
    if (listeners.size === 0) {
      delete listenersRef.current[topic];
    }
  }, []);

  const publish = useCallback((topic, payload, options = {}) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topic, payload, options, (err) => {
        if (err) {
          console.error('MQTT publish error:', err);
        } else {
          addLog(topic, payload, 'publish');
        }
      });
    } else {
      console.warn('MQTT client not connected. Simulating publish to:', topic);
      addLog(topic, payload, 'publish');
    }
  }, [addLog]);

  useEffect(() => {
    const client = mqtt.connect('wss://4d9428ecfbbe4084896b1c3a240cbe9e.s1.eu.hivemq.cloud:8884/mqtt', {
      username: 'Tuyen',
      password: '123456789tT',
      protocol: 'wss',
      keepalive: 60,
      reconnectPeriod: 1000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setIsConnected(true);
      addLog('$SYS/broker', 'HiveMQ Cloud · MQTTS · TLS 1.3 · Port 8883', 'system');
      client.subscribe([ROOM_TOPIC, 'home/motion'], { qos: 1 }, (error) => {
        if (error) {
          console.error('MQTT subscribe error:', error);
        }
      });
    });

    client.on('message', (topic, message) => {
      const payloadText = message.toString();
      emitTopicMessage(topic, payloadText);

      if (topic === 'home/motion') {
        const isMotion = payloadText === '1';
        setSensorData((prev) => ({
          ...prev,
          motion: {
            current: isMotion,
            lastEvent: isMotion ? new Date().toLocaleTimeString() : prev.motion.lastEvent,
            alertCount: prev.motion.alertCount + (isMotion ? 1 : 0),
          },
        }));
        addLog(topic, payloadText, 'receive');
        return;
      }

      try {
        const roomKey = topic.split('/')[2];
        if (!ROOM_KEYS.includes(roomKey)) {
          return;
        }

        const payload = JSON.parse(payloadText);
        const currentRoom = realtimeRoomsRef.current[roomKey] || ROOM_DEFAULTS[roomKey];
        const nextRooms = {
          ...realtimeRoomsRef.current,
          [roomKey]: {
            temperature: toNumber(payload.temperature, currentRoom.temperature),
            humidity: toNumber(payload.humidity, currentRoom.humidity),
            lux: toNumber(payload.lux ?? payload.light, currentRoom.lux),
          },
        };

        roomRealtimeRef.current[roomKey] = Date.now();
        realtimeRoomsRef.current = nextRooms;
        setLastUpdate(new Date());
        addLog(topic, payloadText, 'receive');
      } catch (error) {
        console.error('MQTT message parse error:', error);
      }
    });

    client.on('error', (error) => {
      console.error('MQTT connection error:', error);
    });

    client.on('close', () => {
      setIsConnected(false);
    });

    client.on('offline', () => {
      setIsConnected(false);
    });

    return () => {
      client.end();
      clientRef.current = null;
    };
  }, [addLog, emitTopicMessage, updateLegacySensorSnapshot]);

  useEffect(() => {
    const initialRooms = createRoomsSnapshot();
    simulatedRoomsRef.current = initialRooms;
    realtimeRoomsRef.current = initialRooms;
    setAllRoomsData(initialRooms);
    setSensorData((prev) => updateLegacySensorSnapshot(initialRooms, prev));

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const previousRooms = simulatedRoomsRef.current;
      const nextRooms = ROOM_KEYS.reduce((accumulator, roomKey) => {
        const currentRoom = previousRooms[roomKey] || ROOM_DEFAULTS[roomKey];
        const lastRealtimeAt = roomRealtimeRef.current[roomKey] || 0;
        const hasFreshRealtime = now - lastRealtimeAt <= REALTIME_STALE_MS;
        const targetRoom = hasFreshRealtime
          ? realtimeRoomsRef.current[roomKey] || ROOM_DEFAULTS[roomKey]
          : ROOM_DEFAULTS[roomKey];
        const targetTemperature = toNumber(targetRoom.temperature, ROOM_DEFAULTS[roomKey].temperature);
        const targetHumidity = toNumber(targetRoom.humidity, ROOM_DEFAULTS[roomKey].humidity);
        const targetLux = toNumber(targetRoom.lux, ROOM_DEFAULTS[roomKey].lux);
        const baseTemperature = toNumber(currentRoom.temperature, ROOM_DEFAULTS[roomKey].temperature);
        const baseHumidity = toNumber(currentRoom.humidity, ROOM_DEFAULTS[roomKey].humidity);
        const baseLux = toNumber(currentRoom.lux, ROOM_DEFAULTS[roomKey].lux);

        accumulator[roomKey] = {
          temperature: stepToward(baseTemperature, targetTemperature, 0.9, 18, 40),
          humidity: stepHumidity(baseHumidity, targetHumidity),
          lux: stepLux(baseLux, targetLux),
        };
        return accumulator;
      }, {});

      simulatedRoomsRef.current = nextRooms;
      setAllRoomsData(nextRooms);
      setSensorData((prev) => updateLegacySensorSnapshot(nextRooms, prev));
      setLastUpdate(new Date());
    }, UPDATE_INTERVAL);

    return () => {
      clearInterval(timerRef.current);
    };
  }, [updateLegacySensorSnapshot]);

  const toggleDevice = useCallback((device, value, extra = {}) => {
    setDeviceStates((prev) => {
      if (device === 'light') {
        const brightness = extra.brightness ?? value;
        addLog('home/device/light', brightness > 0 ? `${brightness}%` : 'OFF', 'publish');
        return { ...prev, light: { on: brightness > 0, brightness } };
      }

      if (device === 'fan') {
        const speed = extra.speed ?? value;
        addLog('home/device/fan', speed > 0 ? `${speed}%` : 'OFF', 'publish');
        return { ...prev, fan: { on: speed > 0, speed } };
      }

      return prev;
    });
  }, [addLog]);

  const activeEspRooms = ROOM_KEYS.filter((roomKey) => (
    Date.now() - (roomRealtimeRef.current[roomKey] || 0) <= REALTIME_STALE_MS
  ));

  const telemetryMeta = {
    modeLabel: activeEspRooms.length > 0 ? 'Live ESP + Simulated' : 'Simulated Mesh Only',
    espNodeCount: activeEspRooms.length,
    simulatedNodeCount: 6,
    activeEspRooms,
    totalVisibleNodes: 6,
  };

  return {
    isConnected,
    sensorData,
    allRoomsData,
    deviceStates,
    commandLog,
    toggleDevice,
    publish,
    lastUpdate,
    on,
    off,
    telemetryMeta,
  };
}
