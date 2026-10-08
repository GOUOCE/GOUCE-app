import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // 1. Se houver variável de ambiente explícita no .env (ideal para celular físico)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== '' && !envUrl.includes('ngrok')) {
    return envUrl;
  }

  // 2. Extrai automaticamente o IP da máquina host via Metro (hostUri) para o Expo Go no celular físico
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000`;
    }
  }

  // 3. Se for Web
  if (Platform.OS === 'web') {
    return 'http://localhost:8000';
  }

  // 4. Se for Emulador Android
  if (Platform.OS === 'android' && !Constants.isDevice) {
    return 'http://10.0.2.2:8000';
  }

  // 5. Fallback padrão para celular físico na mesma rede (ajuste caso necessário no .env)
  return 'http://192.168.0.4:8000';
};

export const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@GOUOCE:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar respostas e renovação automática de token (Refresh Token)
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // NÃO tenta refresh em rotas públicas/autenticação (/auth/login, /auth/refresh, etc.)
    const isAuthRoute = requestUrl.includes('/auth/login') ||
                        requestUrl.includes('/auth/refresh') ||
                        requestUrl.includes('/auth/solicitar-recuperacao') ||
                        requestUrl.includes('/auth/redefinir-senha') ||
                        requestUrl.includes('/auth/validar-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(() => {
          return Promise.reject(error);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await AsyncStorage.getItem('@GOUOCE:refreshToken');
        if (!refreshToken) {
          isRefreshing = false;
          processQueue(error, null);
          return Promise.reject(error);
        }

        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          token_atualizacao: refreshToken,
        }, { timeout: 10000 });

        const newToken = response.data.token_acesso;
        const newRefreshToken = response.data.token_atualizacao;

        await AsyncStorage.setItem('@GOUOCE:token', newToken);
        if (newRefreshToken) {
          await AsyncStorage.setItem('@GOUOCE:refreshToken', newRefreshToken);
        }

        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

        processQueue(null, newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;

        if (refreshError.response?.status === 401 || refreshError.response?.status === 403) {
          await AsyncStorage.removeItem('@GOUOCE:token');
          await AsyncStorage.removeItem('@GOUOCE:refreshToken');
          await AsyncStorage.removeItem('@GOUOCE:user');
        }

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
