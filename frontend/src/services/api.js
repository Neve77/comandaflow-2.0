import axios from 'axios';
import { io } from 'socket.io-client';
import { CONFIG } from '../utils/config';

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
};

export const socket = io(CONFIG.API_BASE_URL);

export default api;
