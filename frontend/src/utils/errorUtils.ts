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

  const campos: Record<string, string> = {
    assentos: 'Quantidade de assentos', qtd_assentos: 'Quantidade de assentos',
    capacidade_em_pe: 'Capacidade em pé', capacidade_maxima: 'Capacidade em pé',
    placa: 'Placa', placa_onibus: 'Placa',
  };

  // 1. Caso { detail: { erros: [...] } }
  if (data?.detail?.erros && Array.isArray(data.detail.erros)) {
    return data.detail.erros.join('\n');
  }

  // 2. Caso { error: { details: [...] } }
  if (data?.error?.details && Array.isArray(data.error.details)) {
    const mensagens = data.error.details
      .map((d: any) => (typeof d === 'string' ? d : (campos[d.field] && d.message ? `${campos[d.field]}: ${d.message}` : d.message || JSON.stringify(d))))
      .filter(Boolean);
    return Array.from(new Set(mensagens)).join('\n');
  }

  // 3. Caso FastAPI 422 { detail: [ { loc: [...], msg: "..." } ] }
  if (Array.isArray(data?.detail)) {
    const mensagens = data.detail
      .map((err: any) => {
        const rawField = Array.isArray(err.loc) ? err.loc.slice(-1)[0] : '';
        const msg = err.msg || '';
        if (rawField && msg) {
          return `${campos[rawField] || rawField}: ${msg}`;
        }
        return msg || rawField || JSON.stringify(err);
      })
      .filter(Boolean);

    return Array.from(new Set(mensagens)).join('\n');
  }

  // 4. Caso { detail: "..." } - Padrão FastAPI
  if (data?.detail && typeof data.detail === 'string') {
    return data.detail;
  }

  // 5. Caso { error: { message: "..." } }
  if (data?.error?.message) {
    return data.error.message;
  }

  return defaultMessage;
}
