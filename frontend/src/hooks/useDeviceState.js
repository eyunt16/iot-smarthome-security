import { useEffect, useState } from 'react';
import { api } from '../services/api';
import mqttService from '../services/mqttService';

const DEVICE_TOPICS = {
  'home/device/light': 'light',
  'home/device/fan': 'fan',
  'home/device/servo': 'servo',
  'home/device/dc': 'dc',
  'home/device/stepper': 'stepper'
};

const DEVICE_DEFAULTS = {
  light: '0',
  fan: '0',
  servo: 'STOP',
  dc: 'STOP',
  stepper: 'STOP'
};

const createInitialDevices = () =>
  Object.fromEntries(
    Object.entries(DEVICE_DEFAULTS).map(([key, value]) => [
      key,
      {
        value,
        timestamp: null,
        isPending: false,
        error: '',
      },
    ])
  );

export function useDeviceState() {
  const [devices, setDevices] = useState(createInitialDevices);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const syncDevices = async () => {
      try {
        const response = await api.get('/devices');
        if (!isMounted) {
          return;
        }

        setDevices((current) =>
          Object.fromEntries(
            Object.keys(current).map((deviceId) => [
              deviceId,
              {
                ...current[deviceId],
                value: response[deviceId]?.value ?? DEVICE_DEFAULTS[deviceId],
                timestamp: response[deviceId]?.timestamp ?? current[deviceId].timestamp,
                error: '',
              },
            ])
          )
        );
        setError('');
      } catch {
        if (isMounted) {
          setError('Cannot connect to device controller.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const listeners = Object.entries(DEVICE_TOPICS).map(([topic, deviceId]) => {
      const handleMessage = (payload) => {
        if (!isMounted) return;

        setDevices((current) => ({
          ...current,
          [deviceId]: {
            ...current[deviceId],
            value: payload,
            timestamp: new Date().toISOString(),
            isPending: false,
            error: '',
          },
        }));
      };

      mqttService.on(topic, handleMessage);
      return { topic, handleMessage };
    });

    syncDevices();
    mqttService.connect();

    return () => {
      isMounted = false;
      listeners.forEach(({ topic, handleMessage }) => mqttService.off(topic, handleMessage));
    };
  }, []);

  const sendCommand = async (deviceId, command) => {
    setDevices((current) => ({
      ...current,
      [deviceId]: {
        ...current[deviceId],
        isPending: true,
        error: '',
      },
    }));

    try {
      const response = await api.post('/device/command', {
        device: deviceId,
        command: String(command),
      });

      setDevices((current) => ({
        ...current,
        [deviceId]: {
          ...current[deviceId],
          value: String(command),
          timestamp: new Date().toISOString(),
          isPending: false,
          error: '',
        },
      }));

      return {
        ok: true,
        message: response.message ?? `${deviceId} updated successfully.`,
      };
    } catch {
      setDevices((current) => ({
        ...current,
        [deviceId]: {
          ...current[deviceId],
          isPending: false,
          error: 'Device not responding.',
        },
      }));

      return {
        ok: false,
        message: 'Device not responding.',
      };
    }
  };

  return {
    devices,
    isLoading,
    error,
    sendCommand,
  };
}
