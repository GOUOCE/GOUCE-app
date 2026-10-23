import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getBaseUrl = () => {
  // 1. Extrai o IP da máquina host via Metro (hostUri) para funcionar em qualquer celular ou emulador
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:8000`;
    }
  }

  // 2. Se houver variável de ambiente no .env
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('ngrok')) {
    return envUrl;
  }

  // 3. Fallback para o IP da máquina local (192.168.0.4)
  return Platform.OS === 'web' ? 'http://localhost:8000' : 'http://192.168.0.4:8000';
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

// Rotas públicas de autenticação: um 401 aqui é resposta de negócio
// (senha errada, conta pendente, token inválido), não sessão expirada.
const ROTAS_SEM_REFRESH = [
  '/auth/login',
  '/auth/refresh',
  '/auth/solicitar-recuperacao',
  '/auth/redefinir-senha',
  '/auth/validar-token',
];

const deveTentarRefresh = (config: any) => {
  if (!config || config._retry) return false;
  if (ROTAS_SEM_REFRESH.some(rota => config.url?.startsWith(rota))) return false;
  // Requisição sem token não tem sessão para renovar
  return Boolean(config.headers?.Authorization);
};

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

    if (error.response?.status === 401 && deveTentarRefresh(originalRequest)) {
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
          throw new Error('No refresh token available');
        }

        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
          token_atualizacao: refreshToken,
        });

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
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        await AsyncStorage.removeItem('@GOUOCE:token');
        await AsyncStorage.removeItem('@GOUOCE:refreshToken');
        await AsyncStorage.removeItem('@GOUOCE:user');
        // Devolve o erro original para a tela mostrar a mensagem da API
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);
