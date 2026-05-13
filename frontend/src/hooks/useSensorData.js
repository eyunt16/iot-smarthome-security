import { useState, useEffect } from 'react';
import { api } from '../services/api';
import mqttService from '../services/mqttService';

const SENSOR_TOPICS = {
  'home/temperature': 'temperature',
  'home/humidity': 'humidity',
  'home/motion': 'motion'
};

const createInitialData = () => ({
  temperature: null,
  humidity: null,
  motion: null,
  timestamps: {
    temperature: null,
    humidity: null,
    motion: null
  },
  lastUpdated: null
});

function parseSensorValue(sensorKey, rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return null;
  }

  if (sensorKey === 'motion') {
    return Number(rawValue) === 1;
  }

  const numericValue = Number.parseFloat(rawValue);
  return Number.isNaN(numericValue) ? null : numericValue;
}

export function useSensorData(pollingInterval = 3000) {
  const [data, setData] = useState(createInitialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let pollingId = null;

    const stopPolling = () => {
      if (pollingId) {
        clearInterval(pollingId);
        pollingId = null;
      }
    };

    const fetchData = async () => {
      try {
        const responseData = await api.get('/data');
        if (isMounted) {
          setData({
            temperature: parseSensorValue('temperature', responseData.temperature?.value),
            humidity: parseSensorValue('humidity', responseData.humidity?.value),
            motion: parseSensorValue('motion', responseData.motion?.value),
            timestamps: {
              temperature: responseData.temperature?.timestamp ?? null,
              humidity: responseData.humidity?.timestamp ?? null,
              motion: responseData.motion?.timestamp ?? null
            },
            lastUpdated: new Date().toISOString()
          });
          setError(null);
        }
      } catch (err) {
        if (isMounted) setError('Lost connection to backend server.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const startPolling = () => {
      if (!pollingId) {
        pollingId = setInterval(fetchData, pollingInterval);
      }
    };

    const topicListeners = Object.entries(SENSOR_TOPICS).map(([topic, sensorKey]) => {
      const handleMessage = (payload) => {
        if (!isMounted) return;

        const timestamp = new Date().toISOString();
        setData((current) => ({
          ...current,
          [sensorKey]: parseSensorValue(sensorKey, payload),
          timestamps: {
            ...current.timestamps,
            [sensorKey]: timestamp
          },
          lastUpdated: timestamp
        }));
        setError(null);
        setIsLoading(false);
      };

      mqttService.on(topic, handleMessage);
      return { topic, handleMessage };
    });

    const unsubscribeConnection = mqttService.onConnectionChange((connected) => {
      if (!isMounted) return;

      setIsRealtimeConnected(connected);
      if (connected) {
        stopPolling();
      } else {
        startPolling();
      }
    });

    fetchData();
    mqttService.connect();

    if (!mqttService.isConnected()) {
      startPolling();
    }

    return () => {
      isMounted = false;
      stopPolling();
      unsubscribeConnection();
      topicListeners.forEach(({ topic, handleMessage }) => {
        mqttService.off(topic, handleMessage);
      });
    };
  }, [pollingInterval]);

  return { data, isLoading, error, isRealtimeConnected };
}
