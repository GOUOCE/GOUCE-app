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
  idAgendamento?: string | number;
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
  pode_remover?: boolean;
  pode_editar?: boolean;
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

export interface CalendarioDiaResponse {
  data: string; // YYYY-MM-DD
  estado: string; // "AGENDADO", "DISPONIVEL", "INDISPONIVEL", "FERIADO", "RECESSO"
  descricao?: string | null;
  pode_agendar: boolean;
  agendamento_id?: number | null;
  pode_remover?: boolean;
  pode_editar?: boolean;
}

export interface CalendarioResponse {
  mes: string;
  dias: CalendarioDiaResponse[];
  ativos: number;
  limite: number;
}

async function getCachePrefix(): Promise<string> {
  try {
    const userJson = await AsyncStorage.getItem('@GOUOCE:user');
    if (userJson) {
      const u = JSON.parse(userJson);
      return `_u_${u.id || u.email || 'guest'}`;
    }
  } catch {}
  return '_u_guest';
}

export const agendamentoService = {
  async obterOpcoesAgendamento(): Promise<OpcoesAgendamentoResponse> {
    try {
      const response = await api.get('/transporte/agendamentos/opcoes');
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

  async listarCalendarioMes(mesIso: string = '2026-09'): Promise<CalendarioResponse> {
    const prefix = await getCachePrefix();
    const cacheKey = `@GOUOCE:calendario_${prefix}_${mesIso}`;

    try {
      const response = await api.get(`/transporte/agendamentos/calendario?mes=${mesIso}`);
      const dados = response.data;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(dados));
      return { ...dados, isOffline: false };
    } catch {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return { ...JSON.parse(cached), isOffline: true };
        }
      } catch {}
      throw new Error('Erro de conexão ao carregar calendário');
    }
  },

  async listarAgendamentosAtivos(): Promise<AgendamentoDia[]> {
    const prefix = await getCachePrefix();
    const cacheKey = `@GOUOCE:meus_agendamentos_${prefix}`;

    try {
      const response = await api.get('/transporte/agendamentos/meus');
      const dados = response.data;
      const lista = dados.agendamentos || dados;
      const mapeados = (lista || []).map((item: any) => ({
        idAgendamento: item.id,
        dataIso: item.data,
        usaIda: item.usa_ida,
        usaVolta: item.usa_volta,
        pontoEmbarqueIda: item.ponto_embarque_id ? String(item.ponto_embarque_id) : undefined,
        faculdadeDestinoIda: item.ies_destino_id ? String(item.ies_destino_id) : undefined,
        pontoDesembarqueVolta: item.ponto_desembarque_id ? String(item.ponto_desembarque_id) : undefined,
        faculdadeOrigemVolta: item.ies_origem_id ? String(item.ies_origem_id) : undefined,
        pode_remover: item.pode_remover,
        pode_editar: item.pode_editar,
      }));
      await AsyncStorage.setItem(cacheKey, JSON.stringify(mapeados));
      return mapeados;
    } catch {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
      throw new Error('Erro de conexão ao carregar agendamentos');
    }
  },

  async criarAgendamento(payload: AgendamentoPayload): Promise<any> {
    const response = await api.post('/transporte/agendamentos', payload);
    return response.data;
  },

  async atualizarAgendamento(agendamentoId: number | string, payload: AgendamentoPayload): Promise<any> {
    const response = await api.put(`/transporte/agendamentos/${agendamentoId}`, payload);
    return response.data;
  },

  async cancelarAgendamento(idAgendamento: string | number): Promise<any> {
    const response = await api.delete(`/transporte/agendamentos/${idAgendamento}`);
    return response.data;
  },

  async detalharAgendamento(idAgendamento: string | number): Promise<any> {
    const prefix = await getCachePrefix();
    const cacheKey = `@GOUOCE:detalhes_viagem_${prefix}_${idAgendamento}`;

    try {
      const response = await api.get(`/transporte/agendamentos/${idAgendamento}`);
      const dados = response.data;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(dados));
      return dados;
    } catch {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch {}
      throw new Error('Erro de conexão ao carregar detalhes');
    }
  },

  async obterDetalhesViagem(dataIso: string = '2026-09-01', temComplementar: boolean = true): Promise<any> {
    const prefix = await getCachePrefix();
    const cacheKey = `@GOUOCE:detalhes_viagem_${prefix}_${dataIso}`;

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
      } catch {}
      throw new Error('Erro de conexão ao carregar detalhes da viagem');
    }
  },
};
