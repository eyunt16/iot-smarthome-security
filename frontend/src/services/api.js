import axios from 'axios';
import {
  AUTH_STATE_CHANGE_EVENT,
  clearAuthSession,
  getStoredToken,
} from './authSession';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').trim();

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const requestUrl = String(error.config?.url || '');
    const isAuthBoundaryRequest =
      requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthBoundaryRequest && getStoredToken()) {
      clearAuthSession();

      if (window.location.pathname !== '/login') {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }

      window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGE_EVENT));
    }

    return Promise.reject(error);
  },
);

export async function loginUser(payload) {
  return api.post('/auth/login', payload);
}

export async function registerUser(payload) {
  return api.post('/auth/register', payload);
}

export async function getLockedUsers() {
  return api.get('/auth/users/locked');
}

export async function unlockUser(userId) {
  return api.patch(`/auth/users/${userId}/unlock`);
}

export async function getAllUsers() {
  return api.get('/auth/users');
}

export async function createCustomerAccount(payload) {
  return api.post('/auth/users/customer', payload);
}

export async function changePassword(payload) {
  return api.put('/auth/change-password', payload);
}

export async function getSecurityLogs() {
  return api.get('/auth/logs');
}

export async function clearSecurityLogs() {
  return api.delete('/auth/logs');
}

export async function banUser(userId) {
  return api.post(`/auth/users/${userId}/ban`);
}

export async function unbanUser(userId) {
  return api.post(`/auth/users/${userId}/unban`);
}

export async function unlockDoor(pin) {
  return api.post('/auth/door/unlock', { pin });
}
