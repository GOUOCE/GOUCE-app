import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@GOUOCE:token');
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, { baseURL: config.baseURL });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erro 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Opcional: Lógica de refresh token ou logout
      await AsyncStorage.removeItem('@GOUOCE:token');
      await AsyncStorage.removeItem('@GOUOCE:user');
    }
    return Promise.reject(error);
  }
);
