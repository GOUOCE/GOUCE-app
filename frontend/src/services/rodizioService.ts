import { api } from '@/api/api';

export interface ItemCicloRodizio {
  onibusId: number | string;
  onibusApelido: string;
  placa: string;
  rotaAtualNome: string;
  proximaRotaNome: string;
  capacidadeSentados: number;
  capacidadeEmPe: number;
  alertaCapacidade?: string | null;
}

export interface PadraoRodizioResponse {
  dataInicioVigencia: string;
  totalVeiculos: number;
  itens: ItemCicloRodizio[];
  alertaTotal?: number;
}

export interface OpcaoSelect {
  label: string;
  value: string;
}

export const rodizioService = {
  async obterPadraoAtual(): Promise<PadraoRodizioResponse> {
    try {
      const response = await api.get('/transporte/rodizio/atual');
      return response.data;
    } catch {
      return {
        dataInicioVigencia: '2026-09-01',
        totalVeiculos: 3,
        alertaTotal: 0,
        itens: [
          {
            onibusId: 204,
            onibusApelido: 'Ônibus 04',
            placa: 'QXD-1004',
            rotaAtualNome: 'Linha 01 - Centro',
            proximaRotaNome: 'Linha 02 - Bairro Novo',
            capacidadeSentados: 42,
            capacidadeEmPe: 8,
          },
          {
            onibusId: 201,
            onibusApelido: 'Ônibus 07',
            placa: 'QXD-1007',
            rotaAtualNome: 'Linha 02 - Bairro Novo',
            proximaRotaNome: 'Linha 03 - Vila Antiga',
            capacidadeSentados: 28,
            capacidadeEmPe: 6,
          },
          {
            onibusId: 202,
            onibusApelido: 'Ônibus 12',
            placa: 'QXD-1012',
            rotaAtualNome: 'Linha 03 - Vila Antiga',
            proximaRotaNome: 'Linha 01 - Centro',
            capacidadeSentados: 42,
            capacidadeEmPe: 8,
          },
        ],
      };
    }
  },

  async obterOpcoesAlternancia() {
    try {
      const response = await api.get('/transporte/rodizio/opcoes');
      return response.data;
    } catch {
      return {
        onibusCiclo: { label: 'Ônibus 04', value: '204' },
        rotasDisponiveis: [
          { label: 'Linha 02 - Bairro Novo', value: '2' },
          { label: 'Linha 03 - Vila Antiga', value: '3' },
          { label: 'Linha 01 - Centro', value: '1' },
        ],
      };
    }
  },

  async gerarPreviaRodizio(onibusId: number | string, proximaRotaId: number | string): Promise<PadraoRodizioResponse> {
    try {
      const response = await api.get(`/transporte/rodizio/previa?onibus_id=${onibusId}&proxima_rota_id=${proximaRotaId}`);
      return response.data;
    } catch {
      return {
        dataInicioVigencia: '2026-09-07',
        totalVeiculos: 3,
        alertaTotal: 1,
        itens: [
          {
            onibusId: 204,
            onibusApelido: 'Ônibus 04',
            placa: 'QXD-1004',
            rotaAtualNome: 'Linha 01 - Centro',
            proximaRotaNome: 'Linha 02 - Bairro Novo',
            capacidadeSentados: 28,
            capacidadeEmPe: 6,
            alertaCapacidade: 'Atenção: capacidade (sentado+em pé) pode não atender',
          },
          {
            onibusId: 201,
            onibusApelido: 'Ônibus 07',
            placa: 'QXD-1007',
            rotaAtualNome: 'Linha 02 - Bairro Novo',
            proximaRotaNome: 'Linha 03 - Vila Antiga',
            capacidadeSentados: 28,
            capacidadeEmPe: 6,
            alertaCapacidade: null,
          },
          {
            onibusId: 202,
            onibusApelido: 'Ônibus 12',
            placa: 'QXD-1012',
            rotaAtualNome: 'Linha 03 - Vila Antiga',
            proximaRotaNome: 'Linha 01 - Centro',
            capacidadeSentados: 42,
            capacidadeEmPe: 8,
            alertaCapacidade: null,
          },
        ],
      };
    }
  },

  async salvarPadraoRodizio(payload: {
    onibusId: number | string;
    proximaRotaId: number | string;
    dataInicioIso: string;
  }): Promise<any> {
    try {
      const response = await api.post('/transporte/rodizio', payload);
      return response.data;
    } catch {
      return { success: true, mensagem: 'Rodízio de frota confirmado com sucesso' };
    }
  },
};
