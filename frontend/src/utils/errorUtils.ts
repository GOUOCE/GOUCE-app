import { AxiosError } from 'axios';

/**
 * Extrai uma mensagem de erro padronizada, clara e específica de uma resposta da API (FastAPI)
 */
export function getErrorMessage(error: any, defaultMessage: string = 'Erro ao processar solicitação. Tente novamente.'): string {
  if (!error.response) {
    if (error.message === 'Network Error' || error.message?.includes('Network')) {
      return 'Erro de conexão com o servidor. Verifique sua internet ou tente novamente em instantes.';
    }
    return error.message || defaultMessage;
  }

  const data = error.response.data;

  // Trata conflitos de cadastro duplicado específicos
  if (data?.error?.code === 'REGISTRATION_CONFLICT') {
    return 'Já existe um cadastro ativo com estes dados (verifique o e-mail ou o número de WhatsApp informado).';
  }

  if (data?.error?.code === 'EMAIL_ALREADY_REGISTERED') {
    return 'Este e-mail já está cadastrado na plataforma GOUOCE.';
  }

  // 1. Caso { detail: { erros: [...] } }
  if (data?.detail?.erros && Array.isArray(data.detail.erros)) {
    return data.detail.erros.join('\n');
  }

  // 2. Caso { error: { details: [...] } }
  if (data?.error?.details && Array.isArray(data.error.details)) {
    return data.error.details
      .map((d: any) => (typeof d === 'string' ? d : d.message || (d.field ? `${d.field}: ${d.message}` : JSON.stringify(d))))
      .join('\n');
  }

  // 3. Caso { detail: "..." } - Padrão FastAPI
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // 4. Caso { error: { message: "..." } }
  if (data?.error?.message) {
    return data.error.message;
  }

  return defaultMessage;
}
