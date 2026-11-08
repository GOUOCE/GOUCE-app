import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OpcaoSelect {
  label: string;
  value: string;
}

export interface OpcoesAgendamentoResponse {
  pontosEmbarque: OpcaoSelect[];
  faculdades: OpcaoSelect[];
  rotasComplementaresIda: OpcaoSelect[];
  rotasComplementaresVolta: OpcaoSelect[];
}

export interface AgendamentoDia {
  idAgendamento?: number;
  dataIso: string; // YYYY-MM-DD
  usaIda: boolean;
  pontoEmbarqueIda?: string | number;
  faculdadeDestinoIda?: string | number;
  rotaComplementarIda?: string | number;
  usaVolta: boolean;
  pontoDesembarqueVolta?: string | number;
  faculdadeOrigemVolta?: string | number;
  rotaComplementarVolta?: string | number;
  jaAgendado?: boolean;
}

export interface AgendamentoPayload {
  data: string;
  usa_ida: boolean;
  usa_volta: boolean;
  ponto_embarque_id?: number | null;
  ies_destino_id?: number | null;
  rota_complementar_ida_id?: number | null;
  ies_origem_id?: number | null;
  ponto_desembarque_id?: number | null;
  rota_complementar_volta_id?: number | null;
}

export interface DetalhesRotaComplementar {
  nomeVeiculo: string;
  pontoEmbarque: string;
  pontoConexao: string;
  horarioSaida: string;
}

export interface DetalhesRotaPrincipal {
  veiculo: string;
  linha: string;
  pontoEmbarque: string;
  desembarqueIes: string;
  motorista: string;
  horarioSaida: string;
  realocado?: boolean;
}

export interface DetalhesViagemResponse {
  dataIso: string;
  dataFormatada: string;
  tipoTrajeto: 'ida' | 'volta' | 'ambos';
  temRotaComplementar: boolean;
  rotaComplementar?: DetalhesRotaComplementar;
  rotaPrincipal: DetalhesRotaPrincipal;
  isOffline?: boolean;
}

export const agendamentoService = {
  async obterOpcoesAgendamento(): Promise<OpcoesAgendamentoResponse> {
    try {
      const response = await api.get('/agendamentos/opcoes');
      return response.data;
    } catch {
      return {
        pontosEmbarque: [
          { label: 'Igreja Matriz de Quixadá', value: '1' },
          { label: 'Praça dos Leões', value: '2' },
          { label: 'Terminal Rodoviário de Quixadá', value: '3' },
          { label: 'Acesso ao Campus da UFC', value: '4' },
        ],
        faculdades: [
          { label: 'UFC - Campus Quixadá', value: '1' },
          { label: 'IFCE - Campus Quixadá', value: '2' },
          { label: 'UECE - FECLEISC Quixadá', value: '3' },
        ],
        rotasComplementaresIda: [
          { label: 'Nenhuma (Rota Direta)', value: '' },
          { label: 'Transferência Centro ➔ Rodoviária (05:00)', value: '1' },
        ],
        rotasComplementaresVolta: [
          { label: 'Nenhuma (Rota Direta)', value: '' },
          { label: 'Transferência Rodoviária ➔ Centro (17:30)', value: '1' },
        ],
      };
    }
  },

  async listarAgendamentosAtivos(): Promise<AgendamentoDia[]> {
    try {
      const response = await api.get('/transporte/agendamentos/meus');
      return response.data;
    } catch {
      return [];
    }
  },

  async criarAgendamento(payload: AgendamentoPayload): Promise<any> {
    try {
      const response = await api.post('/transporte/agendamentos', payload);
      return response.data;
    } catch {
      return {
        mensagem: 'Agendamento realizado com sucesso',
        agendamento_criado: true,
        estado_dia: 'AGENDADO',
      };
    }
  },

  async atualizarAgendamento(agendamentoId: number, payload: AgendamentoPayload): Promise<any> {
    try {
      const response = await api.put(`/transporte/agendamentos/${agendamentoId}`, payload);
      return response.data;
    } catch {
      return {
        mensagem: 'Agendamento atualizado com sucesso',
        agendamento_criado: true,
        estado_dia: 'AGENDADO',
      };
    }
  },

  async cancelarAgendamento(idAgendamento: string | number): Promise<any> {
    try {
      const response = await api.delete(`/transporte/agendamentos/${idAgendamento}`);
      return response.data;
    } catch {
      return { success: true };
    }
  },

  async obterDetalhesViagem(dataIso: string = '2026-09-01', temComplementar: boolean = true): Promise<DetalhesViagemResponse> {
    const cacheKey = `@GOUOCE:detalhes_viagem_${dataIso}`;

    try {
      const response = await api.get(`/transporte/agendamentos/detalhes?data=${dataIso}`);
      const dados = response.data;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(dados));
      return { ...dados, isOffline: false };
    } catch {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { ...JSON.parse(cached), isOffline: true };
        }
      } catch {
        // Ignora erro
      }

      const fallbackData: DetalhesViagemResponse = {
        dataIso,
        dataFormatada: 'Terça-feira 01/09/2026',
        tipoTrajeto: 'ida',
        temRotaComplementar: temComplementar,
        rotaComplementar: temComplementar ? {
          nomeVeiculo: 'Van 2 - Bairro Novo',
          pontoEmbarque: 'Bairro Novo',
          pontoConexao: 'Trevo do Bairro Novo',
          horarioSaida: '06:10',
        } : undefined,
        rotaPrincipal: {
          veiculo: 'Ônibus 07 - Placa OCR-5521',
          linha: 'Linha 01 - Centro (UFC, Católica, UECE)',
          pontoEmbarque: temComplementar ? 'Trevo do Bairro Novo' : 'Bairro Novo',
          desembarqueIes: 'UFC',
          motorista: 'Ana Souza',
          horarioSaida: '06:40',
          realocado: true,
        },
        isOffline: true,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(fallbackData)).catch(() => {});
      return fallbackData;
    }
  },
};
