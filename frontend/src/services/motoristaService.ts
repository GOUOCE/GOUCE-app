import { api } from '../api/api';

export interface MotoristaItem {
  id: number;
  nome: string;
  telefone: string;
  ativo: boolean;
  alocacoes_pendentes?: boolean;
}

export const motoristaService = {
  async listarMotoristas(busca = '', incluirInativos = true): Promise<MotoristaItem[]> {
    const params: any = {};
    if (incluirInativos) params.incluir_inativos = true;
    if (busca && busca.trim()) params.nome = busca.trim();

    const response = await api.get<any[]>('/motoristas', { params });
    const lista = response.data || [];

    const mapeados: MotoristaItem[] = lista.map((m) => ({
      id: m.id,
      nome: m.nome,
      telefone: m.telefone,
      ativo: m.ativo ?? true,
      alocacoes_pendentes: Boolean(m.alocacoes_pendentes),
    }));

    const q = busca.toLowerCase().trim();
    if (!q) return mapeados;

    return mapeados.filter(
      (m) =>
        m.nome.toLowerCase().includes(q) ||
        m.telefone.toLowerCase().includes(q)
    );
  },

  async obterMotoristaPorId(id: number): Promise<MotoristaItem | undefined> {
    const response = await api.get<any>(`/motoristas/${id}`);
    const m = response.data;
    if (m) {
      return {
        id: m.id,
        nome: m.nome,
        telefone: m.telefone,
        ativo: m.ativo ?? true,
        alocacoes_pendentes: Boolean(m.alocacoes_pendentes),
      };
    }
    return undefined;
  },

  async criarMotorista(nome: string, telefone: string): Promise<MotoristaItem> {
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();

    try {
      const response = await api.post<any>('/motoristas', {
        nome: nomeLimpo,
        telefone: telefoneLimpo,
      });
      const m = response.data?.data || response.data;
      return {
        id: m.id || Date.now(),
        nome: m.nome || nomeLimpo,
        telefone: m.telefone || telefoneLimpo,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('registrado')) {
        throw new Error('Este profissional já está registrado.');
      }
      throw error;
    }
  },

  async atualizarMotorista(id: number, nome: string, telefone: string): Promise<MotoristaItem> {
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();

    try {
      const response = await api.patch<any>(`/motoristas/${id}`, {
        nome: nomeLimpo,
        telefone: telefoneLimpo,
      });
      const m = response.data?.data || response.data;
      return {
        id: m.id || id,
        nome: m.nome || nomeLimpo,
        telefone: m.telefone || telefoneLimpo,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('registrado')) {
        throw new Error('Este profissional já está registrado.');
      }
      throw error;
    }
  },

  async inativarMotorista(id: number): Promise<void> {
    await api.patch(`/motoristas/${id}/inativar`);
  },

  async reativarMotorista(id: number): Promise<void> {
    await api.patch(`/motoristas/${id}/reativar`);
  },
};
