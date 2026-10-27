const DICIONARIO_CAMPOS: Record<string, string> = {
  assentos: 'Qtd. de Assentos',
  capacidade_em_pe: 'Capac. Máxima em Pé',
  placa: 'Placa',
  nome: 'Nome',
  email: 'E-mail',
  telefone: 'Telefone',
  bairro_id: 'Bairro',
  faculdade_id: 'Instituição de Ensino',
  horario_saida: 'Horário de Saída',
  horario_retorno: 'Horário de Retorno',
};

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
    return 'Este e-mail já está cadastrado na plataforma GOUCE.';
  }

  // 1. Caso { detail: { erros: [...] } }
  if (data?.detail?.erros && Array.isArray(data.detail.erros)) {
    return data.detail.erros.join('\n');
  }

  // 2. Caso { error: { details: [...] } }
  if (data?.error?.details && Array.isArray(data.error.details)) {
    const mensagens = data.error.details
      .map((d: any) => {
        if (typeof d === 'string') return d;
        const nomeCampoRaw = d.field || '';
        const rotuloAmigavel = DICIONARIO_CAMPOS[nomeCampoRaw] || nomeCampoRaw;
        const msg = d.message || '';
        if (rotuloAmigavel && msg) {
          return `${rotuloAmigavel}: ${msg}`;
        }
        return msg || rotuloAmigavel || JSON.stringify(d);
      })
      .filter(Boolean);

    // Evita duplicatas mantendo a ordem
    return Array.from(new Set(mensagens)).join('\n');
  }

  // 3. Caso FastAPI 422 { detail: [ { loc: [...], msg: "..." } ] }
  if (Array.isArray(data?.detail)) {
    const mensagens = data.detail
      .map((err: any) => {
        const rawField = Array.isArray(err.loc) ? err.loc.slice(-1)[0] : '';
        const rotuloAmigavel = DICIONARIO_CAMPOS[rawField] || rawField;
        const msg = err.msg || '';
        if (rotuloAmigavel && msg) {
          return `${rotuloAmigavel}: ${msg}`;
        }
        return msg || rotuloAmigavel || JSON.stringify(err);
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
