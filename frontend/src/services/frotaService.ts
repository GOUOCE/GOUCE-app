import { api } from '../api/api';

export interface OnibusItem {
  id: number;
  identificacao: string;
  placa: string;
  assentos: number;
  capacidade_em_pe: number;
  ativo: boolean;
  alocacoes_pendentes?: boolean;
}

// Mocks iniciais de ônibus do protótipo
let ONIBUS_MOCK: OnibusItem[] = [
  {
    id: 1,
    identificacao: 'Ônibus 04',
    placa: 'OCR-1234',
    assentos: 42,
    capacidade_em_pe: 10,
    ativo: true,
    alocacoes_pendentes: true, // Para testar bloqueio de inativação
  },
  {
    id: 2,
    identificacao: 'Ônibus 07',
    placa: 'OCR-5521',
    assentos: 32,
    capacidade_em_pe: 6,
    ativo: true,
    alocacoes_pendentes: false,
  },
  {
    id: 3,
    identificacao: 'Ônibus 12',
    placa: 'OCR-8890',
    assentos: 42,
    capacidade_em_pe: 10,
    ativo: false,
    alocacoes_pendentes: false,
  },
];

export const frotaService = {
  async listarOnibus(busca = ''): Promise<OnibusItem[]> {
    try {
      const response = await api.get<any[]>('/onibus');
      const listaApi = response.data || [];
      const lista = listaApi.length > 0 ? listaApi : ONIBUS_MOCK;

      const mapeados: OnibusItem[] = lista.map((o, idx) => ({
        id: o.id || idx + 1,
        identificacao: o.apelido_onibus || o.identificacao || `Ônibus ${idx + 1 < 10 ? `0${idx + 1}` : idx + 1}`,
        placa: o.placa_onibus || o.placa,
        assentos: o.qtd_assentos ?? o.assentos ?? 40,
        capacidade_em_pe: o.capacidade_maxima ?? o.capacidade_em_pe ?? 10,
        ativo: o.ativo ?? true,
        alocacoes_pendentes: Boolean(o.alocacoes_pendentes),
      }));

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (o) =>
          o.identificacao.toLowerCase().includes(q) ||
          o.placa.toLowerCase().includes(q)
      );
    } catch (error) {
      console.warn('Backend /onibus indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      if (!q) return JSON.parse(JSON.stringify(ONIBUS_MOCK));

      return JSON.parse(JSON.stringify(ONIBUS_MOCK)).filter(
        (o: OnibusItem) =>
          o.identificacao.toLowerCase().includes(q) ||
          o.placa.toLowerCase().includes(q)
      );
    }
  },

  async obterOnibusPorId(id: number | string): Promise<OnibusItem | undefined> {
    try {
      const todos = await this.listarOnibus();
      const encontrado = todos.find((o) => String(o.id) === String(id) || o.placa === String(id));
      if (encontrado) return encontrado;
    } catch (err) {
      console.warn('Erro ao obter ônibus por ID, usando mock:', err);
    }

    const o = ONIBUS_MOCK.find((item) => String(item.id) === String(id) || item.placa === String(id));
    return o ? JSON.parse(JSON.stringify(o)) : undefined;
  },

  async criarOnibus(
    placa: string,
    assentos: number,
    capacidadeEmPe: number,
    identificacao?: string
  ): Promise<OnibusItem> {
    const placaLimpa = placa.trim().toUpperCase();

    const jaExiste = ONIBUS_MOCK.some(
      (o) => o.placa.replace(/[^A-Z0-9]/g, '') === placaLimpa.replace(/[^A-Z0-9]/g, '')
    );

    if (jaExiste) {
      throw new Error('Este veículo já está registrado.');
    }

    try {
      const response = await api.post<any>('/onibus', {
        placa: placaLimpa,
        assentos,
        capacidade_em_pe: capacidadeEmPe,
        apelido: identificacao,
      });
      const o = response.data?.data || response.data;
      return {
        id: o.id || Date.now(),
        identificacao: o.apelido_onibus || identificacao || `Ônibus ${placaLimpa}`,
        placa: o.placa_onibus || placaLimpa,
        assentos: o.qtd_assentos ?? assentos,
        capacidade_em_pe: o.capacidade_maxima ?? capacidadeEmPe,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Este veículo já está registrado.');
      }

      if (!error.response) {
        const proximoNumero = ONIBUS_MOCK.length + 1;
        const nomeIdentificacao = identificacao?.trim() || `Ônibus ${proximoNumero < 10 ? `0${proximoNumero}` : proximoNumero}`;

        const novoOnibus: OnibusItem = {
          id: Date.now(),
          identificacao: nomeIdentificacao,
          placa: placaLimpa,
          assentos,
          capacidade_em_pe: capacidadeEmPe,
          ativo: true,
          alocacoes_pendentes: false,
        };

        ONIBUS_MOCK.unshift(novoOnibus);
        return JSON.parse(JSON.stringify(novoOnibus));
      }

      throw error;
    }
  },

  async atualizarOnibus(
    id: number | string,
    placa: string,
    assentos: number,
    capacidadeEmPe: number,
    identificacao?: string
  ): Promise<OnibusItem> {
    const placaLimpa = placa.trim().toUpperCase();

    const duplicado = ONIBUS_MOCK.some(
      (o) => o.id !== Number(id) && o.placa !== String(id) && o.placa.replace(/[^A-Z0-9]/g, '') === placaLimpa.replace(/[^A-Z0-9]/g, '')
    );

    if (duplicado) {
      throw new Error('Este veículo já está registrado.');
    }

    try {
      const onibusAtual = await this.obterOnibusPorId(id as any);
      const placaAtual = onibusAtual?.placa || String(id);

      const response = await api.patch<any>(`/onibus/${placaAtual}`, {
        placa: placaLimpa,
        assentos,
        capacidade_em_pe: capacidadeEmPe,
        apelido: identificacao,
      });
      const o = response.data?.data || response.data;
      return {
        id: o.id || Number(id) || Date.now(),
        identificacao: o.apelido_onibus || identificacao || `Ônibus ${placaLimpa}`,
        placa: o.placa_onibus || placaLimpa,
        assentos: o.qtd_assentos ?? assentos,
        capacidade_em_pe: o.capacidade_maxima ?? capacidadeEmPe,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Este veículo já está registrado.');
      }

      if (!error.response) {
        const index = ONIBUS_MOCK.findIndex((o) => o.id === Number(id) || o.placa === String(id));
        if (index !== -1) {
          ONIBUS_MOCK[index].placa = placaLimpa;
          ONIBUS_MOCK[index].assentos = assentos;
          ONIBUS_MOCK[index].capacidade_em_pe = capacidadeEmPe;
          if (identificacao) ONIBUS_MOCK[index].identificacao = identificacao.trim();
          return JSON.parse(JSON.stringify(ONIBUS_MOCK[index]));
        }
      }

      throw error;
    }
  },

  async inativarOnibus(id: number | string): Promise<void> {
    const onibusLocal = ONIBUS_MOCK.find((o) => o.id === Number(id) || o.placa === String(id));
    if (onibusLocal && onibusLocal.alocacoes_pendentes) {
      throw new Error('Este veículo possui alocações pendentes e não pode ser inativado no momento.');
    }

    try {
      const placa = onibusLocal?.placa || String(id);
      await api.patch(`/onibus/${placa}/inativar`);
      if (onibusLocal) onibusLocal.ativo = false;
    } catch (error: any) {
      if (!error.response) {
        if (onibusLocal) {
          onibusLocal.ativo = false;
          return;
        }
      }
      throw error;
    }
  },

  async reativarOnibus(id: number | string): Promise<void> {
    const onibusLocal = ONIBUS_MOCK.find((o) => o.id === Number(id) || o.placa === String(id));
    try {
      const placa = onibusLocal?.placa || String(id);
      await api.patch(`/onibus/${placa}/ativar`);
      if (onibusLocal) onibusLocal.ativo = true;
    } catch (error: any) {
      if (!error.response) {
        if (onibusLocal) {
          onibusLocal.ativo = true;
          return;
        }
      }
      throw error;
    }
  },
};
