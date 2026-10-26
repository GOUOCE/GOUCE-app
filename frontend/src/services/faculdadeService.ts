import { api } from '../api/api';

export interface FaculdadeItem {
  id: number;
  nome: string;
  sigla: string;
  campus: string;
  ativo: boolean;
  viagens_programadas_pendentes?: boolean;
}

export const faculdadeService = {
  async listarFaculdades(busca = ''): Promise<FaculdadeItem[]> {
    const response = await api.get<any[]>('/faculdades');
    const lista = response.data || [];

    const mapeados: FaculdadeItem[] = lista.map((f) => {
      const nomeCompleto = f.nome_faculdade || f.nome || '';
      const siglaDb = f.sigla || f.sigla_faculdade || '';
      const siglaExtraida = siglaDb || (nomeCompleto.length <= 10 ? nomeCompleto : nomeCompleto.split(' ')[0]);

      return {
        id: f.id_faculdade || f.id,
        nome: nomeCompleto,
        sigla: siglaExtraida,
        campus: f.campus_faculdade || f.campus,
        ativo: f.ativo ?? true,
        viagens_programadas_pendentes: Boolean(f.viagens_programadas_pendentes),
      };
    });

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
    const f = response.data;
    if (f) {
      const nomeCompleto = f.nome_faculdade || f.nome || '';
      const siglaDb = f.sigla || f.sigla_faculdade || '';
      const siglaExtraida = siglaDb || (nomeCompleto.length <= 10 ? nomeCompleto : nomeCompleto.split(' ')[0]);

      return {
        id: f.id_faculdade || f.id,
        nome: nomeCompleto,
        sigla: siglaExtraida,
        campus: f.campus_faculdade || f.campus,
        ativo: f.ativo ?? true,
        viagens_programadas_pendentes: Boolean(f.viagens_programadas_pendentes),
      };
    }
    return undefined;
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
      const f = response.data?.data || response.data;
      return {
        id: f.id_faculdade || f.id || Date.now(),
        nome: f.nome_faculdade || nomeLimpo,
        sigla: f.sigla || f.sigla_faculdade || siglaLimpa || 'UNI',
        campus: f.campus_faculdade || campusLimpo,
        ativo: true,
      };
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
      const f = response.data?.data || response.data;
      return {
        id: f.id_faculdade || id,
        nome: f.nome_faculdade || nome,
        sigla: f.sigla || f.sigla_faculdade || sigla || 'UNI',
        campus: f.campus_faculdade || campus,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta faculdade já está cadastrada.');
      }
      throw error;
    }
  },

  async inativarFaculdade(id: number): Promise<void> {
    try {
      await api.patch(`/faculdades/${id}/inativar`);
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.detail) {
        const msg = error.response.data.detail || error.response.data.message;
        if (msg) throw new Error(msg);
      }
      throw error;
    }
  },

  async reativarFaculdade(id: number): Promise<void> {
    await api.patch(`/faculdades/${id}/ativar`);
  },
};
