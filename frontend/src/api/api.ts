import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
});

// Logs locais para QA: nunca imprimir credenciais ou os arquivos enviados.
const sensitiveField = /senha|password|token|authorization|cookie|secret|email|nome|name|telefone|phone|cpf|nascimento|raca|genero|sexual|filhos|bairro|comprovante|foto|^input$|^ctx$|^url$|^uri$/i;

function sanitizeForLog(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[e-mail oculto]');
  }
  if (Array.isArray(value)) return value.map(sanitizeForLog);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      key,
      sensitiveField.test(key) ? '[oculto]' : sanitizeForLog(item),
    ]));
  }
  return value;
}

function requestLabel(config?: { method?: string; url?: string }) {
  // A consulta de e-mail coloca o endereço no próprio caminho.
  const path = (config?.url || '').split('?')[0]
    .replace(/(\/verificar-email\/).*/, '$1[oculto]');
  return `${config?.method?.toUpperCase() || 'REQUEST'} ${sanitizeForLog(path)}`;
}

// Interceptor para adicionar token
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@GOUOCE:token');
  if (__DEV__) console.log(`[API REQUEST] ${requestLabel(config)}`);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para tratar erro 401
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(
        `[API RESPONSE] ${response.status} ${requestLabel(response.config)}`,
        JSON.stringify(sanitizeForLog(response.data), null, 2),
      );
    }
    return response;
  },
  async (error) => {
    if (__DEV__) {
      console.log(
        `[API ERROR] ${error.response?.status ?? 'SEM RESPOSTA'} ${requestLabel(error.config)}`,
        JSON.stringify(sanitizeForLog(error.response?.data ?? {
          code: error.code,
          message: 'Não foi possível obter uma resposta da API.',
        }), null, 2),
      );
    }
    if (error.response?.status === 401) {
      // Opcional: Lógica de refresh token ou logout
      await AsyncStorage.removeItem('@GOUOCE:token');
      await AsyncStorage.removeItem('@GOUOCE:user');
    }
    return Promise.reject(error);
  }
);
