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

export interface CalendarioDia {
  data: string; // YYYY-MM-DD
  estado: string;
  descricao?: string | null;
  pode_agendar: boolean;
  agendamento_id?: number | null;
  pode_remover?: boolean;
  pode_editar?: boolean;
}

export interface CalendarioResponse {
  mes: string;
  dias: CalendarioDia[];
  ativos: number;
  limite: number;
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

export interface AgendamentoApi {
  id: number;
  aluno_id: number;
  data: string;
  usa_ida: boolean;
  usa_volta: boolean;
  ponto_embarque_id: number | null;
  ies_destino_id: number | null;
  rota_complementar_ida_id: number | null;
  ies_origem_id: number | null;
  ponto_desembarque_id: number | null;
  rota_complementar_volta_id: number | null;
  status: string;
}

export interface OperacaoAgendamentoResponse {
  mensagem: string;
  agendamento_criado: boolean;
  agendamento?: AgendamentoApi | null;
  estado_dia: string;
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

const mapearAgendamento = (item: any): AgendamentoDia => ({
  idAgendamento: item.id ?? item.idAgendamento,
  dataIso: item.data ?? item.dataIso,
  usaIda: Boolean(item.usa_ida ?? item.usaIda),
  usaVolta: Boolean(item.usa_volta ?? item.usaVolta),
  pontoEmbarqueIda: item.ponto_embarque_id ?? item.pontoEmbarqueIda,
  faculdadeDestinoIda: item.ies_destino_id ?? item.faculdadeDestinoIda,
  rotaComplementarIda: item.rota_complementar_ida_id ?? item.rotaComplementarIda,
  pontoDesembarqueVolta: item.ponto_desembarque_id ?? item.pontoDesembarqueVolta,
  faculdadeOrigemVolta: item.ies_origem_id ?? item.faculdadeOrigemVolta,
  rotaComplementarVolta: item.rota_complementar_volta_id ?? item.rotaComplementarVolta,
  jaAgendado: true,
});

export const agendamentoService = {
  async obterOpcoesAgendamento(): Promise<OpcoesAgendamentoResponse> {
    const response = await api.get('/transporte/agendamentos/opcoes');
    return response.data;
  },

  async obterCalendario(mes: string): Promise<CalendarioResponse> {
    const response = await api.get('/transporte/agendamentos/calendario', {
      params: { mes },
    });
    return response.data;
  },

  async listarCalendarioMes(mesIso: string): Promise<CalendarioResponse> {
    return this.obterCalendario(mesIso);
  },

  async listarAgendamentosAtivos(): Promise<AgendamentoDia[]> {
    const response = await api.get('/transporte/agendamentos/meus');
    const dados = response.data;
    const lista: any[] = Array.isArray(dados) ? dados : dados?.agendamentos ?? [];
    return lista.map(mapearAgendamento);
  },

  async obterAgendamento(agendamentoId: number): Promise<AgendamentoApi> {
    const response = await api.get(`/transporte/agendamentos/${agendamentoId}`);
    return response.data;
  },

  async criarAgendamento(payload: AgendamentoPayload): Promise<OperacaoAgendamentoResponse> {
    const response = await api.post('/transporte/agendamentos', payload);
    return response.data;
  },

  async atualizarAgendamento(
    agendamentoId: number | string,
    payload: AgendamentoPayload
  ): Promise<OperacaoAgendamentoResponse> {
    const response = await api.put(`/transporte/agendamentos/${agendamentoId}`, payload);
    return response.data;
  },

  async cancelarAgendamento(agendamentoId: number | string): Promise<OperacaoAgendamentoResponse> {
    const response = await api.delete(`/transporte/agendamentos/${agendamentoId}`);
    return response.data;
  },

  async detalharAgendamento(agendamentoId: number | string): Promise<AgendamentoApi> {
    const response = await api.get(`/transporte/agendamentos/${agendamentoId}`);
    return response.data;
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
