import { AxiosError } from 'axios';

/**
 * Extrai uma mensagem de erro legível de uma resposta da API (FastAPI)
 * Suporta formatos:
 * 1. { detail: { erros: ["msg1", "msg2"] } }
 * 2. { detail: "mensagem simples" }
 * 3. { error: { message: "mensagem" } } (Legado)
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Erro ao processar solicitação. Tente novamente.'): string {
  if (!error.response) {
    if (error.message === 'Network Error') {
      return 'Erro de conexão. Verifique sua internet ou se o servidor está online.';
    }
    return error.message || defaultMessage;
  }

  const data = error.response.data;

  // 1. Caso { detail: { erros: [...] } } - Padronizado na issue do cadastro
  if (data?.detail?.erros && Array.isArray(data.detail.erros)) {
    return data.detail.erros.join('\n');
  }

  // 1.1 Caso { error: { details: [...] } } - Padronizado na issue do [object Object]
  if (data?.error?.details && Array.isArray(data.error.details)) {
    return data.error.details.map((d: any) => d.message).join('\n');
  }

  // 2. Caso { detail: "..." } - Padrão FastAPI
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // 3. Caso { error: { message: "..." } } - Legado/Alguns middlewares
  if (data?.error?.message) {
    return data.error.message;
  }

  return defaultMessage;
}
