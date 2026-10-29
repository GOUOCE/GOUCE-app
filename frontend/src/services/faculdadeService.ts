import { api } from '../api/api';

export interface FaculdadeItem {
  id: number;
  nome: string;
  sigla: string;
  campus: string;
  ativo: boolean;
  viagens_programadas_pendentes?: boolean;
}

// Converte o registro da API; a sigla vem do banco e fica vazia quando não existe (#259)
function mapearFaculdade(f: any): FaculdadeItem {
  return {
    id: f.id_faculdade || f.id,
    nome: f.nome_faculdade || f.nome || '',
    sigla: f.sigla || f.sigla_faculdade || '',
    campus: f.campus_faculdade || f.campus || '',
    ativo: f.ativo ?? true,
    viagens_programadas_pendentes: Boolean(f.viagens_programadas_pendentes),
  };
}

export const faculdadeService = {
  async listarFaculdades(busca = ''): Promise<FaculdadeItem[]> {
    const response = await api.get<any[]>('/faculdades');
    const lista = response.data || [];

    const mapeados: FaculdadeItem[] = lista.map(mapearFaculdade);

    const q = busca.toLowerCase().trim();
    if (!q) return mapeados;

    return mapeados.filter(
      (f) =>
        f.nome.toLowerCase().includes(q) ||
        f.sigla.toLowerCase().includes(q) ||
        f.campus.toLowerCase().includes(q)
    );
  },

  async obterFaculdadePorId(id: number): Promise<FaculdadeItem | undefined> {
    const response = await api.get<any>(`/faculdades/${id}`);
    return response.data ? mapearFaculdade(response.data) : undefined;
  },

  async criarFaculdade(nome: string, sigla: string, campus: string): Promise<FaculdadeItem> {
    const nomeLimpo = nome.trim();
    const siglaLimpa = sigla.trim();
    const campusLimpo = campus.trim();

    try {
      const response = await api.post<any>('/faculdades', {
        nome_faculdade: nomeLimpo,
        sigla_faculdade: siglaLimpa,
        campus_faculdade: campusLimpo,
      });
      return mapearFaculdade(response.data?.data || response.data);
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta faculdade já está cadastrada.');
      }
      throw error;
    }
  },

  async atualizarFaculdade(id: number, nome: string, sigla: string, campus: string): Promise<FaculdadeItem> {
    try {
      const response = await api.patch<any>(`/faculdades/${id}`, {
        nome_faculdade: nome.trim(),
        sigla_faculdade: sigla.trim(),
        campus_faculdade: campus.trim(),
      });
      return mapearFaculdade(response.data?.data || response.data);
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta faculdade já está cadastrada.');
      }
      throw error;
    }
  },

  // Os erros seguem para a tela com a resposta da API (ou sem resposta, em falha de conexão);
  // a tela usa getErrorMessage para montar a mensagem em português (#263)
  async inativarFaculdade(id: number): Promise<void> {
    await api.patch(`/faculdades/${id}/inativar`);
  },

  async reativarFaculdade(id: number): Promise<void> {
    await api.patch(`/faculdades/${id}/ativar`);
  },
};
