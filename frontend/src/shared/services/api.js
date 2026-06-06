import axios from 'axios';
import { io } from 'socket.io-client';
import { CONFIG } from '../config/config';

const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const setToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
  socket.auth = { ...(socket.auth || {}), token, room: 'admin' };
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('comanda_token');
      localStorage.removeItem('comanda_user');
      setToken(null);
      window.dispatchEvent(new Event('comanda:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const socket = io(CONFIG.API_BASE_URL, {
  auth: {
    token: localStorage.getItem('comanda_token'),
    room: 'admin'
  }
});

export default api;
