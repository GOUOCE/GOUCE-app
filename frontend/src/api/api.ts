import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // 1. Prioridade máxima: Extrai automaticamente o IP da máquina host via Metro (hostUri)
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      const url = `http://${hostIp}:8000`;
      console.log('[API] Conectando via Host IP dinâmico do Metro:', url);
      return url;
    }
  }

  // 2. Se houver variável de ambiente explícita no .env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('ngrok')) {
    console.log('[API] Conectando via EXPO_PUBLIC_API_URL:', envUrl);
    return envUrl;
  }

  // 3. Fallbacks por plataforma
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  return 'http://localhost:8000';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

// Interceptor para adicionar token e logar requisições
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@GOUOCE:token');
  console.log(`[API REQUEST] ${config.method?.toUpperCase()} ${config.url}`, { baseURL: config.baseURL, data: config.data });
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.log('[API REQUEST ERROR]', error);
  return Promise.reject(error);
});

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    console.log(`[API RESPONSE] ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.log('[API ERROR RESPONSE]', error.message, error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('@GOUOCE:token');
      await AsyncStorage.removeItem('@GOUOCE:user');
    }
    return Promise.reject(error);
  }
);
