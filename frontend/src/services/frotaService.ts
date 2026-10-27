import { api } from '../api/api';

export interface OnibusItem {
  id: number | string;
  identificacao: string;
  placa: string;
  assentos: number;
  capacidade_em_pe: number;
  ativo: boolean;
  alocacoes_pendentes?: boolean;
}

export const frotaService = {
  async listarOnibus(busca = '', incluirInativos = true): Promise<OnibusItem[]> {
    const params: any = { incluir_inativos: incluirInativos };
    if (busca && busca.trim()) params.placa = busca.trim();

    const response = await api.get<any[]>('/onibus', { params });
    const lista = response.data || [];

    const mapeados: OnibusItem[] = lista.map((o, idx) => {
      const placaFinal = o.placa_onibus || o.placa || `PLACA-${idx}`;
      return {
        id: o.id || placaFinal,
        identificacao: o.apelido_onibus || o.identificacao || `Ônibus ${placaFinal}`,
        placa: placaFinal,
        assentos: o.qtd_assentos ?? o.assentos ?? 40,
        capacidade_em_pe: o.capacidade_maxima ?? o.capacidade_em_pe ?? 10,
        ativo: o.ativo ?? true,
        alocacoes_pendentes: Boolean(o.alocacoes_pendentes),
      };
    });

    const q = busca.toLowerCase().trim();
    if (!q) return mapeados;

    return mapeados.filter(
      (o) =>
        o.identificacao.toLowerCase().includes(q) ||
        o.placa.toLowerCase().includes(q)
    );
  },

  async obterOnibusPorId(placaOuId: number | string): Promise<OnibusItem | undefined> {
    const response = await api.get<any>(`/onibus/${placaOuId}`);
    const o = response.data;
    if (o) {
      const placaFinal = o.placa_onibus || o.placa || String(placaOuId);
      return {
        id: o.id || placaFinal,
        identificacao: o.apelido_onibus || o.identificacao || `Ônibus ${placaFinal}`,
        placa: placaFinal,
        assentos: o.qtd_assentos ?? o.assentos ?? 40,
        capacidade_em_pe: o.capacidade_maxima ?? o.capacidade_em_pe ?? 10,
        ativo: o.ativo ?? true,
        alocacoes_pendentes: Boolean(o.alocacoes_pendentes),
      };
    }
    return undefined;
  },

  async criarOnibus(
    placa: string,
    assentos: number,
    capacidadeEmPe: number,
    identificacao?: string
  ): Promise<OnibusItem> {
    const placaLimpa = placa.trim().toUpperCase();

    try {
      const response = await api.post<any>('/onibus', {
        placa: placaLimpa,
        assentos,
        capacidade_em_pe: capacidadeEmPe,
        apelido: identificacao,
      });
      const o = response.data?.data || response.data;
      return {
        id: o.id || o.placa_onibus || placaLimpa,
        identificacao: o.apelido_onibus || identificacao || `Ônibus ${placaLimpa}`,
        placa: o.placa_onibus || placaLimpa,
        assentos: o.qtd_assentos ?? assentos,
        capacidade_em_pe: o.capacidade_maxima ?? capacidadeEmPe,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('registrado')) {
        throw new Error('Este veículo já está registrado.');
      }
      throw error;
    }
  },

  async atualizarOnibus(
    placaOuId: number | string,
    placa: string,
    assentos: number,
    capacidadeEmPe: number,
    identificacao?: string
  ): Promise<OnibusItem> {
    const placaLimpa = placa.trim().toUpperCase();

    try {
      const response = await api.patch<any>(`/onibus/${placaOuId}`, {
        placa: placaLimpa,
        assentos,
        capacidade_em_pe: capacidadeEmPe,
        apelido: identificacao,
      });
      const o = response.data?.data || response.data;
      return {
        id: o.id || o.placa_onibus || placaLimpa,
        identificacao: o.apelido_onibus || identificacao || `Ônibus ${placaLimpa}`,
        placa: o.placa_onibus || placaLimpa,
        assentos: o.qtd_assentos ?? assentos,
        capacidade_em_pe: o.capacidade_maxima ?? capacidadeEmPe,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('registrado')) {
        throw new Error('Este veículo já está registrado.');
      }
      throw error;
    }
  },

  async inativarOnibus(placaOuId: number | string): Promise<void> {
    try {
      await api.patch(`/onibus/${placaOuId}/inativar`);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.response?.data?.message || error.message;
      if (error.response?.status === 409 || msg) {
        throw new Error(msg || 'Este veículo possui alocações pendentes e não pode ser inativado no momento.');
      }
      throw error;
    }
  },

  async reativarOnibus(placaOuId: number | string): Promise<void> {
    await api.patch(`/onibus/${placaOuId}/ativar`);
  },
};
