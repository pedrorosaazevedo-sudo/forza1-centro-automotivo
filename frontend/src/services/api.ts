import axios from 'axios';

export const api = axios.create({
  baseURL: '/api'
});

// Interceptor for JWT auth
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@lemoka:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
