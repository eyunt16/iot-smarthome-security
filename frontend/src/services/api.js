import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('authUser');
      window.location.href = '/login';
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
