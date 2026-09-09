import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
});

// Interceptor para adicionar token futuramente
api.interceptors.request.use((config) => {
  // Lógica para recuperar token do storage
  return config;
});
