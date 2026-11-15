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

// ===== HU-015 / HU-019: Consulta de Rotas e Alocação Diária =====
// Contrato do backend: /transporte/agendamentos (AgendamentoDetalheDTO)

export type StatusAlocacaoVeiculo =
  | 'AGUARDANDO_ALOCACAO'
  | 'CONFIRMADA'
  | 'REALOCADO';

export type CenarioAlocacaoMock =
  | 'CONFIRMADA'
  | 'AGUARDANDO_ALOCACAO'
  | 'REALOCADO';

export interface RotaComplementarResumo {
  id: number;
  nome: string;
  horario_saida: string;
  horario_retorno: string;
  ponto_conexao: string;
  onibus?: Record<string, any> | null;
  motorista?: Record<string, any> | null;
  status_alocacao?: StatusAlocacaoVeiculo | string | null;
  realocado?: boolean;
  rota_original_nome?: string | null;
}

export interface RotaPrincipalResumo {
  id: number;
  nome: string;
  horario_saida: string;
  horario_retorno: string;
  faculdades: { id: number; nome: string; sigla?: string }[];
  onibus: Record<string, any> | null;
  motorista: Record<string, any> | null;
  status_alocacao?: StatusAlocacaoVeiculo | string | null;
  realocado?: boolean;
  rota_original_nome?: string | null;
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

export interface MeusAgendamentosResponse {
  agendamentos: AgendamentoDetalhe[];
  ativos: number;
  limite: number;
  isOffline?: boolean;
}

export interface OperacaoAgendamentoResponse {
  mensagem: string;
  agendamento_criado: boolean;
  agendamento?: AgendamentoApi | null;
  estado_dia: string;
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

export interface AlocacaoRotaResolvida {
  veiculo: string | null;
  motorista: string | null;
  statusAlocacao: StatusAlocacaoVeiculo;
  statusAlocacaoLabel: string;
  realocado: boolean;
  mensagemRealocacao: string | null;
  rotaOriginalNome?: string | null;
}

export interface DetalhesRotaComplementar extends AlocacaoRotaResolvida {
  nomeLinha: string;
  pontoEmbarque: string;
  pontoConexao: string;
  horarioSaida: string;
}

export interface DetalhesRotaPrincipal extends AlocacaoRotaResolvida {
  nomeLinha: string;
  subtituloRota: string;
  pontoEmbarque: string;
  pontoDesembarque: string;
  horarioSaida: string;
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

/**
 * Formata a mensagem de alerta visual exibida ao aluno quando há realocação de veículo (FA-002 / HU-019).
 */
export function formatarAvisoRealocacao(veiculo: string | null): string | null {
  if (!veiculo) return null;
  return `Atenção: Você foi realocado. Seu ônibus para hoje é o veículo ${veiculo}`;
}

function abreviarNomeFaculdade(nomeOuSigla: string): string {
  const texto = nomeOuSigla.trim();
  if (!texto) return '';

  if (/universidade federal do cear[aá]|\bufc\b/i.test(texto)) return 'UFC';
  if (/estadual do cear[aá]|feclesc|\buece\b/i.test(texto)) return 'UECE';
  if (/instituto federal|\bifce\b/i.test(texto)) return 'IFCE';
  if (/cat[oó]lica|unicat[oó]lica/i.test(texto)) return 'Católica';

  if (texto.includes(' - ')) {
    const prefixo = texto.split(' - ')[0].trim();
    if (prefixo.length <= 12) return prefixo;
  }

  return texto;
}

/**
 * Formata o subtítulo da rota principal com as siglas das IES atendidas entre parênteses.
 */
export function formatarSubtituloRotaPrincipal(
  nomeLinha: string,
  faculdades: { nome: string; sigla?: string }[] = [],
): string {
  const siglas = Array.from(
    new Set(
      faculdades
        .map((f) => f.sigla?.trim() || abreviarNomeFaculdade(f.nome))
        .filter(Boolean),
    ),
  );
  return siglas.length > 0 ? `${nomeLinha} (${siglas.join(', ')})` : nomeLinha;
}

function resolverAlocacaoRota(
  rota:
    | {
        onibus?: Record<string, any> | null;
        motorista?: Record<string, any> | null;
        status_alocacao?: StatusAlocacaoVeiculo | string | null;
        realocado?: boolean;
        rota_original_nome?: string | null;
      }
    | null
    | undefined,
): AlocacaoRotaResolvida {
  const veiculo = labelVeiculo(rota?.onibus);
  const motorista = labelMotorista(rota?.motorista);

  if (!veiculo || rota?.status_alocacao === 'AGUARDANDO_ALOCACAO') {
    return {
      veiculo: null,
      motorista: null,
      statusAlocacao: 'AGUARDANDO_ALOCACAO',
      statusAlocacaoLabel: 'Aguardando alocação do veículo',
      realocado: false,
      mensagemRealocacao: null,
      rotaOriginalNome: null,
    };
  }

  if (rota?.realocado === true || rota?.status_alocacao === 'REALOCADO') {
    return {
      veiculo,
      motorista,
      statusAlocacao: 'REALOCADO',
      statusAlocacaoLabel: 'Alocação confirmada',
      realocado: true,
      mensagemRealocacao: formatarAvisoRealocacao(veiculo),
      rotaOriginalNome: rota?.rota_original_nome ?? null,
    };
  }

  return {
    veiculo,
    motorista,
    statusAlocacao: 'CONFIRMADA',
    statusAlocacaoLabel: 'Alocação confirmada',
    realocado: false,
    mensagemRealocacao: null,
    rotaOriginalNome: null,
  };
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

  const alocacaoComplementar = resolverAlocacaoRota(complementar);
  const alocacaoPrincipal = resolverAlocacaoRota(principal);
  const nomePrincipal = principal?.nome ?? 'A definir';
  const faculdadesPrincipal = principal?.faculdades ?? [];

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
          ...alocacaoComplementar,
        }
      : undefined,
    rotaPrincipal: {
      nomeLinha: nomePrincipal,
      subtituloRota: formatarSubtituloRotaPrincipal(nomePrincipal, faculdadesPrincipal),
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
      faculdadesAtendidas: faculdadesPrincipal.map((f) => f.nome),
      ...alocacaoPrincipal,
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

const MOCK_ALOCACAO_PRINCIPAL: Record<CenarioAlocacaoMock, AlocacaoRotaResolvida> = {
  CONFIRMADA: {
    veiculo: 'Ônibus 04 - Placa OCR-1234',
    motorista: 'Ana Souza',
    statusAlocacao: 'CONFIRMADA',
    statusAlocacaoLabel: 'Alocação confirmada',
    realocado: false,
    mensagemRealocacao: null,
    rotaOriginalNome: null,
  },
  AGUARDANDO_ALOCACAO: {
    veiculo: null,
    motorista: null,
    statusAlocacao: 'AGUARDANDO_ALOCACAO',
    statusAlocacaoLabel: 'Aguardando alocação do veículo',
    realocado: false,
    mensagemRealocacao: null,
    rotaOriginalNome: null,
  },
  REALOCADO: {
    veiculo: 'Ônibus 04 - Placa OCR-1234',
    motorista: 'Ana Souza',
    statusAlocacao: 'REALOCADO',
    statusAlocacaoLabel: 'Alocação confirmada',
    realocado: true,
    mensagemRealocacao: formatarAvisoRealocacao('Ônibus 04 - Placa OCR-1234'),
    rotaOriginalNome: 'Linha 02 - Bairro Novo',
  },
};

const MOCK_ALOCACAO_COMPLEMENTAR: Record<CenarioAlocacaoMock, AlocacaoRotaResolvida> = {
  CONFIRMADA: {
    veiculo: 'Van 01 - Placa VNC-4510',
    motorista: 'Carlos Mendes',
    statusAlocacao: 'CONFIRMADA',
    statusAlocacaoLabel: 'Alocação confirmada',
    realocado: false,
    mensagemRealocacao: null,
    rotaOriginalNome: null,
  },
  AGUARDANDO_ALOCACAO: {
    veiculo: null,
    motorista: null,
    statusAlocacao: 'AGUARDANDO_ALOCACAO',
    statusAlocacaoLabel: 'Aguardando alocação do veículo',
    realocado: false,
    mensagemRealocacao: null,
    rotaOriginalNome: null,
  },
  REALOCADO: {
    veiculo: 'Van 02 - Placa VNC-8890',
    motorista: 'Carlos Mendes',
    statusAlocacao: 'REALOCADO',
    statusAlocacaoLabel: 'Alocação confirmada',
    realocado: true,
    mensagemRealocacao: formatarAvisoRealocacao('Van 02 - Placa VNC-8890'),
    rotaOriginalNome: 'Van 01 - Campo Novo',
  },
};

/**
 * Aplica um cenário de simulação da HU-019 sobre os detalhes já carregados da viagem,
 * permitindo testar os fluxos Principal, FA-001 e FA-002 antes da integração com o backend.
 */
export function aplicarCenarioAlocacaoMock(
  detalhes: DetalhesViagemResponse,
  cenario: CenarioAlocacaoMock,
  opcoes?: { exibirRotaComplementar?: boolean },
): DetalhesViagemResponse {
  const alocacaoPrincipal = MOCK_ALOCACAO_PRINCIPAL[cenario];
  const alocacaoComplementar = MOCK_ALOCACAO_COMPLEMENTAR[cenario];

  const trechosAtualizados: TrechoDetalhesViagem[] = detalhes.trechos.map((trecho) => {
    let rotaComplementar: DetalhesRotaComplementar | undefined;

    if (opcoes?.exibirRotaComplementar === false) {
      rotaComplementar = undefined;
    } else if (trecho.rotaComplementar) {
      rotaComplementar = {
        ...trecho.rotaComplementar,
        ...alocacaoComplementar,
      };
    } else if (opcoes?.exibirRotaComplementar === true) {
      rotaComplementar = {
        nomeLinha: 'Van 01 - Campo Novo',
        pontoEmbarque: 'Posto de Saúde do Campo Novo',
        pontoConexao: 'Terminal Rodoviário de Quixadá',
        horarioSaida: trecho.sentido === 'ida' ? '05:10' : '17:30',
        ...alocacaoComplementar,
      };
    }

    return {
      ...trecho,
      rotaComplementar,
      rotaPrincipal: {
        ...trecho.rotaPrincipal,
        ...alocacaoPrincipal,
      },
    };
  });

  return {
    ...detalhes,
    trechos: trechosAtualizados,
    temRotaComplementar: trechosAtualizados.some((t) => t.rotaComplementar !== undefined),
  };
}

/**
 * Gera uma viagem mockada completa da HU-019 (com suporte a trajeto direto ou com rota complementar)
 * para testes visuais ou de componente quando o backend ainda não retorna alocações.
 */
export function criarDetalhesViagemMock(
  dataIso: string = '2026-08-31',
  cenario: CenarioAlocacaoMock = 'CONFIRMADA',
  opcoes?: { exibirRotaComplementar?: boolean },
): DetalhesViagemResponse {
  const faculdadesMock = [
    { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC' },
    { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: 'Católica' },
    { id: 3, nome: 'Universidade Estadual do Ceará', sigla: 'UECE' },
  ];

  const detalheBase: AgendamentoDetalhe = {
    id: 901,
    aluno_id: 1,
    data: dataIso,
    usa_ida: true,
    usa_volta: true,
    ponto_embarque_id: 1,
    ies_destino_id: 1,
    rota_complementar_ida_id: opcoes?.exibirRotaComplementar ? 1 : null,
    ies_origem_id: 1,
    ponto_desembarque_id: 1,
    rota_complementar_volta_id: opcoes?.exibirRotaComplementar ? 1 : null,
    status: 'ATIVO',
    ponto_embarque_nome: opcoes?.exibirRotaComplementar
      ? 'Posto de Saúde do Campo Novo'
      : 'Pça. Matriz',
    ies_destino_nome: 'UFC',
    rota_complementar_ida_nome: opcoes?.exibirRotaComplementar ? 'Van 01 - Campo Novo' : null,
    ies_origem_nome: 'UFC',
    ponto_desembarque_nome: opcoes?.exibirRotaComplementar
      ? 'Posto de Saúde do Campo Novo'
      : 'Pça. Matriz',
    rota_complementar_volta_nome: opcoes?.exibirRotaComplementar ? 'Van 01 - Campo Novo' : null,
    rota_complementar_ida: opcoes?.exibirRotaComplementar
      ? {
          id: 1,
          nome: 'Van 01 - Campo Novo',
          horario_saida: '05:10',
          horario_retorno: '17:30',
          ponto_conexao: 'Terminal Rodoviário de Quixadá',
        }
      : null,
    rota_complementar_volta: opcoes?.exibirRotaComplementar
      ? {
          id: 1,
          nome: 'Van 01 - Campo Novo',
          horario_saida: '05:10',
          horario_retorno: '17:30',
          ponto_conexao: 'Terminal Rodoviário de Quixadá',
        }
      : null,
    rota_principal_ida: {
      id: 1,
      nome: 'Linha 01 - Centro',
      horario_saida: '06:40',
      horario_retorno: '06:40',
      faculdades: faculdadesMock,
      onibus: null,
      motorista: null,
    },
    rota_principal_volta: {
      id: 1,
      nome: 'Linha 01 - Centro',
      horario_saida: '06:40',
      horario_retorno: '06:40',
      faculdades: faculdadesMock,
      onibus: null,
      motorista: null,
    },
    atualizado_em: new Date().toISOString(),
    pode_remover: true,
    pode_editar: true,
  };

  return aplicarCenarioAlocacaoMock(mapearDetalhe(detalheBase), cenario, opcoes);
}

async function lerCache<T>(chave: string): Promise<T | null> {
  try {
    const cached = await AsyncStorage.getItem(chave);
    return cached ? (JSON.parse(cached) as T) : null;
  } catch {
    return null;
  }
}

async function salvarCache(chave: string, valor: string): Promise<void> {
  await Promise.resolve(AsyncStorage.setItem(chave, valor)).catch(() => {});
}

async function removerCache(chave: string): Promise<void> {
  await Promise.resolve(AsyncStorage.removeItem(chave)).catch(() => {});
}

// O cache de agenda não é separado por usuário: é apagado no logout e no login para que
// a conta seguinte nunca veja, offline, as reservas da anterior (CT-HU014-UI-010).
export async function limparCacheAgendamentos(): Promise<void> {
  try {
    const chaves = await AsyncStorage.getAllKeys();
    const dela = chaves.filter(
      (chave) =>
        chave === CACHE_MEUS ||
        chave.startsWith('@GOUOCE:calendario_') ||
        chave.startsWith('@GOUOCE:detalhes_viagem_'),
    );
    if (dela.length > 0) await AsyncStorage.multiRemove(dela);
  } catch {
    // Sem acesso ao armazenamento local: nada a limpar.
  }
}

export const agendamentoService = {
  async obterOpcoesAgendamento(): Promise<OpcoesAgendamentoResponse> {
    const response = await api.get('/transporte/agendamentos/opcoes');
    return response.data;
  },

  async listarAgendamentosAtivos(): Promise<MeusAgendamentosResponse> {
    const response = await api.get('/transporte/agendamentos/meus');
    const dados: MeusAgendamentosResponse = response.data;
    await salvarCache(CACHE_MEUS, JSON.stringify(dados));
    return dados;
  },

  async listarAgendamentosCache(): Promise<MeusAgendamentosResponse | null> {
    return lerCache<MeusAgendamentosResponse>(CACHE_MEUS);
  },

  async obterAgendamento(agendamentoId: number): Promise<AgendamentoApi> {
    const response = await api.get(`/transporte/agendamentos/${agendamentoId}`);
    return response.data;
  },

  async criarAgendamento(
    payload: AgendamentoPayload
  ): Promise<OperacaoAgendamentoResponse> {
    const response = await api.post('/transporte/agendamentos', payload);
    return response.data;
  },

  async atualizarAgendamento(
    agendamentoId: number,
    payload: AgendamentoPayload
  ): Promise<OperacaoAgendamentoResponse> {
    const response = await api.put(`/transporte/agendamentos/${agendamentoId}`, payload);
    return response.data;
  },

  async obterCalendario(mes: string): Promise<CalendarioResponse> {
    const response = await api.get(`/transporte/agendamentos/calendario`, {
      params: { mes },
    });
    const dados: CalendarioResponse = response.data;
    await salvarCache(CACHE_CALENDARIO(mes), JSON.stringify(dados));
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
  ): Promise<OperacaoAgendamentoResponse> {
    // FA-004: falhas devem propagar para a tela avisar o aluno, sem sucesso falso.
    const response = await api.delete(`/transporte/agendamentos/${idAgendamento}`);
    await removerCache(CACHE_MEUS);
    if (dataIso) {
      await removerCache(CACHE_DETALHES(dataIso));
      await removerCache(CACHE_CALENDARIO(dataIso.slice(0, 7)));
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
        await salvarCache(cacheKey, JSON.stringify(detalhe));
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
        await removerCache(cacheKey);
        await removerCache(CACHE_CALENDARIO(dataIso.slice(0, 7)));
        const meus = await lerCache<MeusAgendamentosResponse>(CACHE_MEUS);
        const agendamentosCache = Array.isArray(meus?.agendamentos)
          ? meus!.agendamentos
          : null;
        if (meus && agendamentosCache) {
          const restantes = agendamentosCache.filter((item) => item.data !== dataIso);
          if (restantes.length !== agendamentosCache.length) {
            const removidos = agendamentosCache.length - restantes.length;
            await salvarCache(
              CACHE_MEUS,
              JSON.stringify({
                ...meus,
                agendamentos: restantes,
                ativos: Math.max(0, (meus.ativos ?? restantes.length) - removidos),
              })
            );
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
