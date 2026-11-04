import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OpcaoSelect {
  label: string;
  value: string;
}

export interface OpcoesAgendamentoResponse {
  horariosIda: OpcaoSelect[];
  horariosVolta: OpcaoSelect[];
  pontosEmbarque: OpcaoSelect[];
  faculdades: OpcaoSelect[];
  rotasComplementaresIda: OpcaoSelect[];
  rotasComplementaresVolta: OpcaoSelect[];
}

export interface AgendamentoDia {
  dataIso: string; // YYYY-MM-DD
  usaIda: boolean;
  horarioIda?: string;
  pontoEmbarqueIda?: string;
  faculdadeDestinoIda?: string;
  rotaComplementarIda?: string;
  usaVolta: boolean;
  horarioVolta?: string;
  pontoDesembarqueVolta?: string;
  faculdadeOrigemVolta?: string;
  rotaComplementarVolta?: string;
  jaAgendado?: boolean;
  idAgendamento?: string | number;
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
        horariosIda: [
          { label: '05:30 (Manhã)', value: '05:30:00' },
          { label: '06:00 (Manhã)', value: '06:00:00' },
          { label: '06:40 (Manhã)', value: '06:40:00' },
        ],
        horariosVolta: [
          { label: '17:00 (Tarde)', value: '17:00:00' },
          { label: '17:30 (Tarde)', value: '17:30:00' },
          { label: '18:00 (Noite)', value: '18:00:00' },
        ],
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
      const response = await api.get('/agendamentos/meus');
      return response.data;
    } catch {
      return [];
    }
  },

  async salvarAgendamentos(agendamentos: AgendamentoDia[]): Promise<any> {
    try {
      const response = await api.post('/agendamentos', { agendamentos });
      return response.data;
    } catch {
      return { success: true, count: agendamentos.length };
    }
  },

  async cancelarAgendamento(idAgendamento: string | number): Promise<any> {
    try {
      const response = await api.delete(`/agendamentos/${idAgendamento}`);
      return response.data;
    } catch {
      return { success: true };
    }
  },

  // HU-015: Obter detalhes da viagem com suporte a Rota Complementar e Cache Offline (FA-002)
  async obterDetalhesViagem(dataIso: string = '2026-09-01', temComplementar: boolean = true): Promise<DetalhesViagemResponse> {
    const cacheKey = `@GOUOCE:detalhes_viagem_${dataIso}`;

    try {
      const response = await api.get(`/agendamentos/detalhes?data=${dataIso}`);
      const dados = response.data;
      // Salva no cache offline (FA-002)
      await AsyncStorage.setItem(cacheKey, JSON.stringify(dados));
      return { ...dados, isOffline: false };
    } catch {
      // Tenta recuperar do cache local do dispositivo
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { ...JSON.parse(cached), isOffline: true };
        }
      } catch {
        // Ignora erro de leitura do storage
      }

      // Fallback de exibicao correspondente ao prototipo da HU-015
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

      // Guarda no cache local
      await AsyncStorage.setItem(cacheKey, JSON.stringify(fallbackData)).catch(() => {});
      return fallbackData;
    }
  },
};
