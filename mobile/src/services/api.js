import { Platform } from 'react-native';

// Expo Go on a physical device cannot reach localhost on your computer.
// Use your active Wi-Fi/LAN IPv4 address here and update it if your network changes.
const LAN_HOST_IP = '192.168.1.94';
const EMULATOR_HOST_IP = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const USE_EMULATOR_HOST = false;

const HOST_IP = USE_EMULATOR_HOST ? EMULATOR_HOST_IP : LAN_HOST_IP;
const API_BASE_URL = `http://${HOST_IP}:5000/api`;

export const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.message || `API Error: ${response.status}`);
      error.status = response.status;
      error.data = data;
      error.response = {
        status: response.status,
        data,
      };
      throw error;
    }

    return data;
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(responseData?.message || `API Error: ${response.status}`);
      error.status = response.status;
      error.data = responseData;
      error.response = {
        status: response.status,
        data: responseData,
      };
      throw error;
    }

    return responseData;
  }
};
