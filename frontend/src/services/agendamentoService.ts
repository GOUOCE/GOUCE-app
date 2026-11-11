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

// ===== HU-015: Consulta de Rota Complementar e Transferência =====
// Contrato do backend: /transporte/agendamentos (AgendamentoDetalheDTO)

export interface RotaComplementarResumo {
  id: number;
  nome: string;
  horario_saida: string;
  horario_retorno: string;
  ponto_conexao: string;
}

export interface RotaPrincipalResumo {
  id: number;
  nome: string;
  horario_saida: string;
  horario_retorno: string;
  faculdades: { id: number; nome: string }[];
  // Alocação de ônibus/motorista só será preenchida no EP-005 (null nesta HU).
  onibus: Record<string, any> | null;
  motorista: Record<string, any> | null;
}

export interface AgendamentoDetalhe {
  id: number;
  aluno_id: number;
  data: string; // YYYY-MM-DD
  usa_ida: boolean;
  usa_volta: boolean;
  ponto_embarque_id: number | null;
  ies_destino_id: number | null;
  rota_complementar_ida_id: number | null;
  ies_origem_id: number | null;
  ponto_desembarque_id: number | null;
  rota_complementar_volta_id: number | null;
  status: string;
  ponto_embarque_nome: string | null;
  ies_destino_nome: string | null;
  rota_complementar_ida_nome: string | null;
  ies_origem_nome: string | null;
  ponto_desembarque_nome: string | null;
  rota_complementar_volta_nome: string | null;
  rota_complementar_ida: RotaComplementarResumo | null;
  rota_complementar_volta: RotaComplementarResumo | null;
  rota_principal_ida: RotaPrincipalResumo | null;
  rota_principal_volta: RotaPrincipalResumo | null;
  atualizado_em: string;
  pode_remover: boolean;
  pode_editar: boolean;
}

export interface MeusAgendamentosResponse {
  agendamentos: AgendamentoDetalhe[];
  ativos: number;
  limite: number;
  isOffline?: boolean;
}

export interface CalendarioDia {
  data: string; // YYYY-MM-DD
  estado: string; // AGENDADO | DISPONIVEL | INDISPONIVEL | tipo de feriado/recesso
  descricao: string | null;
  pode_agendar: boolean;
  agendamento_id: number | null;
  pode_remover: boolean;
  pode_editar: boolean;
}

export interface CalendarioResponse {
  mes: string; // YYYY-MM
  dias: CalendarioDia[];
  ativos: number;
  limite: number;
  isOffline?: boolean;
}

export interface DetalhesRotaComplementar {
  nomeLinha: string;
  pontoEmbarque: string;
  pontoConexao: string;
  horarioSaida: string;
}

export interface DetalhesRotaPrincipal {
  nomeLinha: string;
  pontoEmbarque: string;
  pontoDesembarque: string;
  horarioSaida: string;
  veiculo: string | null;
  motorista: string | null;
  faculdadesAtendidas: string[];
}

export interface TrechoDetalhesViagem {
  sentido: 'ida' | 'volta';
  rotaComplementar?: DetalhesRotaComplementar;
  rotaPrincipal: DetalhesRotaPrincipal;
}

export interface DetalhesViagemResponse {
  agendamentoId: number;
  dataIso: string;
  diaSemana: string;
  dataFormatada: string; // DD/MM/AAAA
  trechos: TrechoDetalhesViagem[];
  temRotaComplementar: boolean;
  atualizadoEm: string;
  isOffline?: boolean;
}

const CACHE_MEUS = '@GOUOCE:meus_agendamentos';
const CACHE_CALENDARIO = (mes: string) => `@GOUOCE:calendario_${mes}`;
const CACHE_DETALHES = (dataIso: string) => `@GOUOCE:detalhes_viagem_${dataIso}`;

const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function formatarData(dataIso: string): { diaSemana: string; dataFormatada: string } {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const date = new Date(ano, mes - 1, dia);
  const dataFormatada = `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
  return { diaSemana: DIAS_SEMANA[date.getDay()], dataFormatada };
}

export function extrairMensagemErro(erro: any): string {
  return (
    erro?.response?.data?.error?.message ||
    erro?.response?.data?.detail ||
    'Não foi possível concluir a operação. Verifique sua conexão e tente novamente.'
  );
}

function labelVeiculo(onibus: Record<string, any> | null | undefined): string | null {
  if (!onibus) return null;
  const apelido = onibus.apelido_onibus ?? onibus.apelido;
  const placa = onibus.placa_onibus ?? onibus.placa;
  if (apelido && placa) return `${apelido} - Placa ${placa}`;
  return apelido || (placa ? `Placa ${placa}` : null) || null;
}

function labelMotorista(motorista: Record<string, any> | null | undefined): string | null {
  if (!motorista) return null;
  return motorista.nome ?? motorista.nome_completo ?? null;
}

function mapearTrecho(
  detalhe: AgendamentoDetalhe,
  sentido: 'ida' | 'volta',
): TrechoDetalhesViagem {
  const complementar =
    sentido === 'ida' ? detalhe.rota_complementar_ida : detalhe.rota_complementar_volta;
  const principal =
    sentido === 'ida' ? detalhe.rota_principal_ida : detalhe.rota_principal_volta;
  const pontoOrigem =
    sentido === 'ida' ? detalhe.ponto_embarque_nome : detalhe.ponto_desembarque_nome;
  const iesDoTrecho =
    sentido === 'ida' ? detalhe.ies_destino_nome : detalhe.ies_origem_nome;

  return {
    sentido,
    // Ausente em trajeto direto: a seção de rota complementar não é exibida (FA-001).
    rotaComplementar: complementar
      ? {
          nomeLinha: complementar.nome,
          pontoEmbarque: pontoOrigem ?? 'A definir',
          pontoConexao: complementar.ponto_conexao,
          // Ida: a van sai do bairro; volta: a van sai do ponto de conexão.
          horarioSaida:
            sentido === 'ida' ? complementar.horario_saida : complementar.horario_retorno,
        }
      : undefined,
    rotaPrincipal: {
      nomeLinha: principal?.nome ?? 'A definir',
      // Ida: com transferência, o embarque na principal ocorre no ponto de conexão.
      // Volta: a principal parte da IES; o desembarque para transferência é o ponto de conexão.
      pontoEmbarque:
        sentido === 'ida'
          ? complementar
            ? complementar.ponto_conexao
            : detalhe.ponto_embarque_nome ?? 'A definir'
          : iesDoTrecho ?? 'A definir',
      pontoDesembarque:
        sentido === 'ida'
          ? iesDoTrecho ?? 'A definir'
          : complementar
            ? complementar.ponto_conexao
            : detalhe.ponto_desembarque_nome ?? 'A definir',
      horarioSaida:
        sentido === 'ida'
          ? principal?.horario_saida ?? 'A definir'
          : principal?.horario_retorno ?? 'A definir',
      veiculo: labelVeiculo(principal?.onibus),
      motorista: labelMotorista(principal?.motorista),
      faculdadesAtendidas: (principal?.faculdades ?? []).map((f) => f.nome),
    },
  };
}

export function mapearDetalhe(detalhe: AgendamentoDetalhe): DetalhesViagemResponse {
  const trechos: TrechoDetalhesViagem[] = [];
  if (detalhe.usa_ida) trechos.push(mapearTrecho(detalhe, 'ida'));
  if (detalhe.usa_volta) trechos.push(mapearTrecho(detalhe, 'volta'));
  const { diaSemana, dataFormatada } = formatarData(detalhe.data);
  return {
    agendamentoId: detalhe.id,
    dataIso: detalhe.data,
    diaSemana,
    dataFormatada,
    trechos,
    temRotaComplementar: trechos.some((t) => t.rotaComplementar !== undefined),
    atualizadoEm: detalhe.atualizado_em,
    isOffline: false,
  };
}

async function lerCache<T>(chave: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(chave);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch {
    return null;
  }
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

  async listarAgendamentosAtivos(): Promise<MeusAgendamentosResponse> {
    const response = await api.get('/transporte/agendamentos/meus');
    const dados: MeusAgendamentosResponse = response.data;
    // Guarda para consulta offline das rotas complementares (FA-002 / RNF-015).
    await AsyncStorage.setItem(CACHE_MEUS, JSON.stringify(dados)).catch(() => {});
    return dados;
  },

  async listarAgendamentosCache(): Promise<MeusAgendamentosResponse | null> {
    return lerCache<MeusAgendamentosResponse>(CACHE_MEUS);
  },

  async obterCalendario(mes: string): Promise<CalendarioResponse> {
    const response = await api.get(`/transporte/agendamentos/calendario`, {
      params: { mes },
    });
    const dados: CalendarioResponse = response.data;
    await AsyncStorage.setItem(CACHE_CALENDARIO(mes), JSON.stringify(dados)).catch(
      () => {}
    );
    return dados;
  },

  async obterCalendarioCache(mes: string): Promise<CalendarioResponse | null> {
    return lerCache<CalendarioResponse>(CACHE_CALENDARIO(mes));
  },

  async salvarAgendamentos(agendamentos: AgendamentoDia[]): Promise<any> {
    try {
      const response = await api.post('/agendamentos', { agendamentos });
      return response.data;
    } catch {
      return { success: true, count: agendamentos.length };
    }
  },

  async cancelarAgendamento(
    idAgendamento: string | number,
    dataIso?: string
  ): Promise<any> {
    // FA-004: falhas devem propagar para a tela avisar o aluno, sem sucesso falso.
    const response = await api.delete(`/transporte/agendamentos/${idAgendamento}`);
    await AsyncStorage.removeItem(CACHE_MEUS).catch(() => {});
    if (dataIso) {
      await AsyncStorage.removeItem(CACHE_DETALHES(dataIso)).catch(() => {});
      await AsyncStorage.removeItem(CACHE_CALENDARIO(dataIso.slice(0, 7))).catch(
        () => {}
      );
    }
    return response.data;
  },

  // HU-015: detalhes da viagem por data, com rota complementar e cache offline (FA-002)
  async obterDetalhesViagem(dataIso: string): Promise<DetalhesViagemResponse> {
    const cacheKey = CACHE_DETALHES(dataIso);

    try {
      const response = await api.get('/transporte/agendamentos/detalhes', {
        params: { data: dataIso },
      });
      const detalhe: AgendamentoDetalhe = response.data;
      // Revalidação do cache pelo atualizado_em: só regrava quando muda.
      const emCache = await lerCache<AgendamentoDetalhe>(cacheKey);
      if (!emCache || emCache.atualizado_em !== detalhe.atualizado_em) {
        await AsyncStorage.setItem(cacheKey, JSON.stringify(detalhe)).catch(() => {});
      }
      return mapearDetalhe(detalhe);
    } catch (erro: any) {
      const status = erro?.response?.status;

      // Recusas do servidor não são falha de rede: nunca exibir cache como se
      // fosse uma viagem ativa (FA-004 / Critério 4).
      if (status === 401 || status === 403) {
        throw erro;
      }

      // Reserva inexistente ou cancelada: invalida lista, calendário e detalhe
      // para a viagem não reaparecer ativa ao ficar offline.
      if (status === 404) {
        await AsyncStorage.removeItem(cacheKey).catch(() => {});
        await AsyncStorage.removeItem(CACHE_CALENDARIO(dataIso.slice(0, 7))).catch(
          () => {}
        );
        const meus = await lerCache<MeusAgendamentosResponse>(CACHE_MEUS);
        const agendamentosCache = Array.isArray(meus?.agendamentos)
          ? meus!.agendamentos
          : null;
        if (meus && agendamentosCache) {
          const restantes = agendamentosCache.filter((item) => item.data !== dataIso);
          if (restantes.length !== agendamentosCache.length) {
            const removidos = agendamentosCache.length - restantes.length;
            await AsyncStorage.setItem(
              CACHE_MEUS,
              JSON.stringify({
                ...meus,
                agendamentos: restantes,
                ativos: Math.max(0, (meus.ativos ?? restantes.length) - removidos),
              })
            ).catch(() => {});
          }
        }
        throw erro;
      }

      // Demais respostas HTTP (validação, servidor) também não viram offline.
      if (erro?.response) {
        throw erro;
      }

      // Sem internet: exibe a última sincronização guardada no dispositivo.
      const emCache = await lerCache<AgendamentoDetalhe>(cacheKey);
      if (emCache) {
        return { ...mapearDetalhe(emCache), isOffline: true };
      }

      // Detalhe nunca aberto online, mas a Agenda já sincronizou a reserva por
      // /meus: usa os dados completos da lista guardada (FA-002 / Critério 4).
      const meus = await lerCache<MeusAgendamentosResponse>(CACHE_MEUS);
      const agendamentosCache = Array.isArray(meus?.agendamentos)
        ? meus!.agendamentos
        : [];
      const detalheDaLista = agendamentosCache.find((item) => item.data === dataIso);
      if (detalheDaLista) {
        return { ...mapearDetalhe(detalheDaLista), isOffline: true };
      }

      // Sem cache sincronizado não há dados para exibir: propaga o erro real.
      throw erro;
    }
  },
};
