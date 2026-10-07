import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }
  throw new Error(
    'EXPO_PUBLIC_API_URL deve apontar para o IP da máquina na rede local, por exemplo http://192.168.100.29:8000',
  );
};

export const api = axios.create({
  baseURL: getBaseUrl(),
});

// Interceptor para adicionar token e logar requisições
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
      await AsyncStorage.removeItem('@GOUOCE:token');
      await AsyncStorage.removeItem('@GOUOCE:user');
    }
    return Promise.reject(error);
  }
);
