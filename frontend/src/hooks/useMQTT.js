/**
 * useMQTT.js — MQTT Abstraction Hook
 *
 * Currently runs a realistic mock simulation.
 * To connect to your real HiveMQ broker, replace the startSimulation()
 * block with the commented "REAL BROKER" section below.
 *
 * ══════════════════════════════════════════════════════════════
 * REAL BROKER (swap-in when ready):
 *
 *   import mqtt from 'mqtt';
 *
 *   const client = mqtt.connect('wss://YOUR_BROKER.s1.eu.hivemq.cloud:8884/mqtt', {
 *     username: 'YOUR_USERNAME',
 *     password: 'YOUR_PASSWORD',
 *     protocol: 'wss',
 *     keepalive: 60,
 *   });
 *
 *   client.on('connect', () => setIsConnected(true));
 *   client.on('close',   () => setIsConnected(false));
 *
 *   client.subscribe(['home/temperature', 'home/humidity', 'home/motion']);
 *
 *   client.on('message', (topic, payload) => {
 *     const val = payload.toString();
 *     if (topic === 'home/temperature') setSensorData(p => ({ ...p, temperature: { ...p.temperature, current: +val } }));
 *     if (topic === 'home/humidity')    setSensorData(p => ({ ...p, humidity:    { ...p.humidity,    current: +val } }));
 *     if (topic === 'home/motion')      setSensorData(p => ({ ...p, motion:      { ...p.motion,      current: val === '1' } }));
 *     setLastUpdate(new Date());
 *   });
 *
 *   return () => client.end();
 * ══════════════════════════════════════════════════════════════
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ── Constants ─────────────────────────────────────────────────
const HISTORY_POINTS   = 24;         // rolling window size
const UPDATE_INTERVAL  = 3000;       // ms between simulated ticks
const MOTION_CHANCE    = 0.07;       // 7% probability per tick

// ── Helpers ───────────────────────────────────────────────────
function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

function timeLabel() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildHistory(base, spread, points = HISTORY_POINTS) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => {
    const t = new Date(now - (points - i) * UPDATE_INTERVAL);
    return {
      time:  t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: +(base + (Math.random() - 0.5) * spread).toFixed(1),
    };
  });
}

// ── Hook ──────────────────────────────────────────────────────
export function useMQTT() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate,  setLastUpdate]  = useState(null);

  const [sensorData, setSensorData] = useState(() => ({
    temperature: { current: 27.4, history: buildHistory(27, 4) },
    humidity:    { current: 58,   history: buildHistory(58, 10) },
    motion:      { current: false, lastEvent: null, alertCount: 0 },
  }));

  const [deviceStates, setDeviceStates] = useState({
    light: { on: false, brightness: 0 },
    fan: { on: false, speed: 0 },
  });

  const [commandLog, setCommandLog] = useState([]);

  // ── Logging helper ─────────────────────────────────────────
  const addLog = useCallback((topic, payload, type = 'receive') => {
    setCommandLog(prev => [{
      id:      Date.now() + Math.random(),
      time:    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      topic,
      payload: String(payload),
      type,    // 'receive' | 'publish' | 'system' | 'alert'
    }, ...prev.slice(0, 49)]);
  }, []);

  // ── Simulation ─────────────────────────────────────────────
  const timerRef = useRef(null);

  useEffect(() => {
    // Simulate initial connection delay
    const connectTimer = setTimeout(() => {
      setIsConnected(true);
      addLog('$SYS/broker', 'HiveMQ Cloud · MQTTS · TLS 1.3 · Port 8883', 'system');
    }, 1200);

    // Periodic data ticks
    timerRef.current = setInterval(() => {
      const label = timeLabel();

      setSensorData(prev => {
        const newTemp   = +clamp(prev.temperature.current + (Math.random() - 0.48) * 0.7, 18, 40).toFixed(1);
        const newHum    = Math.round(clamp(prev.humidity.current + (Math.random() - 0.5) * 2.5, 30, 95));
        const newMotion = Math.random() < MOTION_CHANCE;
        const motionTriggered = newMotion && !prev.motion.current;

        addLog('home/temperature', `${newTemp} °C`);
        addLog('home/humidity',    `${newHum} %`);
        if (motionTriggered) addLog('home/motion', '1 — MOTION DETECTED', 'alert');

        return {
          temperature: {
            current: newTemp,
            history: [...prev.temperature.history.slice(-(HISTORY_POINTS - 1)), { time: label, value: newTemp }],
          },
          humidity: {
            current: newHum,
            history: [...prev.humidity.history.slice(-(HISTORY_POINTS - 1)), { time: label, value: newHum }],
          },
          motion: {
            current:    newMotion,
            lastEvent:  motionTriggered ? new Date().toLocaleTimeString() : prev.motion.lastEvent,
            alertCount: prev.motion.alertCount + (motionTriggered ? 1 : 0),
          },
        };
      });

      setLastUpdate(new Date());
    }, UPDATE_INTERVAL);

    return () => {
      clearTimeout(connectTimer);
      clearInterval(timerRef.current);
    };
  }, [addLog]);

  // ── Device control (publishes MQTT command) ─────────────────
  const toggleDevice = useCallback((device, value, extra = {}) => {
    setDeviceStates(prev => {
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

  return { isConnected, sensorData, deviceStates, commandLog, toggleDevice, lastUpdate };
}
