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
  | 'REALOCADO'
  // A consulta da alocação falhou: a tela não sabe se o aluno está alocado (issue #530).
  | 'INDISPONIVEL';

export interface TurnoViagemApiDTO {
  turno: 'ida' | 'volta';
  status_alocacao: 'ALOCADO' | 'AGUARDANDO_ALOCACAO' | string;
  mensagem_status?: string | null;
  ponto?: {
    ponto_id: number;
    nome: string;
    bairro?: string | null;
  } | null;
  faculdade?: {
    id: number;
    nome: string;
    sigla?: string | null;
    campus?: string | null;
  } | null;
  rota_complementar?: {
    id: number;
    nome: string;
    ponto_conexao: string;
    horario_saida: string;
    horario_retorno: string;
  } | null;
  rota_id?: number | null;
  nome_rota?: string | null;
  horario?: string | null;
  onibus_id?: string | null;
  placa?: string | null;
  apelido_onibus?: string | null;
  motorista_id?: number | null;
  nome_motorista?: string | null;
  tipo_lugar?: string | null;
  foi_realocado?: boolean;
  aviso_realocacao?: string | null;
}

export interface MinhaViagemApiResponse {
  data: string;
  possui_agendamento: boolean;
  agendamento_id: number | null;
  status_geral: 'ALOCADO' | 'AGUARDANDO_ALOCACAO' | 'PARCIALMENTE_ALOCADO' | 'SEM_AGENDAMENTO' | string;
  mensagem?: string | null;
  foi_realocado: boolean;
  aviso_realocacao?: string | null;
  ida: TurnoViagemApiDTO | null;
  volta: TurnoViagemApiDTO | null;
  consultado_em?: string;
}

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

export interface DetalhesRotaComplementar {
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
  // "V2 - Placa DEF4G56" vira "V2 (placa DEF4G56)": a placa fica explicada, não colada ao apelido.
  const veiculoOrganizado = veiculo.replace(/ - Placa (.+)$/, ' (placa $1)');
  return `Atenção: Você foi realocado. Seu ônibus para hoje é o veículo ${veiculoOrganizado}`;
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

export const ROTULO_ALOCACAO_INDISPONIVEL = 'Não foi possível consultar a alocação agora';

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

  if (rota?.status_alocacao === 'INDISPONIVEL') {
    return {
      veiculo: null,
      motorista: null,
      statusAlocacao: 'INDISPONIVEL',
      statusAlocacaoLabel: ROTULO_ALOCACAO_INDISPONIVEL,
      realocado: false,
      mensagemRealocacao: null,
      rotaOriginalNome: null,
    };
  }

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

function enriquecerRotaPrincipalComTurno(
  rotaOriginal: RotaPrincipalResumo | null,
  turnoDto: TurnoViagemApiDTO | null | undefined,
  sentido: 'ida' | 'volta',
): RotaPrincipalResumo | null {
  if (!turnoDto) return rotaOriginal;

  if (turnoDto.status_alocacao === 'ALOCADO') {
    const placa = turnoDto.placa ?? turnoDto.onibus_id ?? null;
    const onibus =
      placa || turnoDto.apelido_onibus
        ? { placa_onibus: placa, apelido_onibus: turnoDto.apelido_onibus ?? null }
        : (rotaOriginal?.onibus ?? null);
    const motorista = turnoDto.nome_motorista
      ? { nome: turnoDto.nome_motorista }
      : (rotaOriginal?.motorista ?? null);
    const realocado = Boolean(turnoDto.foi_realocado);
    const faculdades = rotaOriginal?.faculdades?.length
      ? rotaOriginal.faculdades
      : turnoDto.faculdade
        ? [{
            id: turnoDto.faculdade.id,
            nome: turnoDto.faculdade.nome,
            sigla: turnoDto.faculdade.sigla ?? undefined,
          }]
        : [];

    return {
      id: turnoDto.rota_id ?? rotaOriginal?.id ?? 0,
      nome: turnoDto.nome_rota || rotaOriginal?.nome || 'A definir',
      horario_saida:
        sentido === 'ida'
          ? (turnoDto.horario || rotaOriginal?.horario_saida || 'A definir')
          : (rotaOriginal?.horario_saida || 'A definir'),
      horario_retorno:
        sentido === 'volta'
          ? (turnoDto.horario || rotaOriginal?.horario_retorno || 'A definir')
          : (rotaOriginal?.horario_retorno || 'A definir'),
      faculdades,
      onibus,
      motorista,
      status_alocacao: realocado ? 'REALOCADO' : 'CONFIRMADA',
      realocado,
      rota_original_nome: realocado ? (rotaOriginal?.nome ?? null) : null,
    };
  }

  if (turnoDto.status_alocacao === 'AGUARDANDO_ALOCACAO' && rotaOriginal) {
    return {
      ...rotaOriginal,
      onibus: null,
      motorista: null,
      status_alocacao: 'AGUARDANDO_ALOCACAO',
      realocado: false,
      rota_original_nome: null,
    };
  }

  return rotaOriginal;
}

/**
 * Quando a consulta GET /alocacao-diaria/minha-viagem falha, a tela não pode afirmar
 * "Aguardando alocação do veículo" para quem talvez já esteja alocado (issue #530):
 * cada turno agendado passa a "alocação indisponível", sem dados de frota.
 */
export function marcarAlocacaoIndisponivel(detalhe: AgendamentoDetalhe): AgendamentoDetalhe {
  const indisponivel = (rota: RotaPrincipalResumo | null): RotaPrincipalResumo | null =>
    rota
      ? {
          ...rota,
          onibus: null,
          motorista: null,
          status_alocacao: 'INDISPONIVEL',
          realocado: false,
          rota_original_nome: null,
        }
      : rota;

  return {
    ...detalhe,
    rota_principal_ida: detalhe.usa_ida
      ? indisponivel(detalhe.rota_principal_ida)
      : detalhe.rota_principal_ida,
    rota_principal_volta: detalhe.usa_volta
      ? indisponivel(detalhe.rota_principal_volta)
      : detalhe.rota_principal_volta,
  };
}

/**
 * Mescla os detalhes da reserva (/transporte/agendamentos/detalhes ou /meus) com a
 * alocação diária real retornada por GET /alocacao-diaria/minha-viagem (HU-019).
 */
export function enriquecerDetalheComMinhaViagem(
  detalhe: AgendamentoDetalhe,
  minhaViagem?: MinhaViagemApiResponse | null,
): AgendamentoDetalhe {
  if (!minhaViagem || !minhaViagem.possui_agendamento) {
    return detalhe;
  }

  return {
    ...detalhe,
    rota_principal_ida: detalhe.usa_ida
      ? enriquecerRotaPrincipalComTurno(detalhe.rota_principal_ida, minhaViagem.ida, 'ida')
      : detalhe.rota_principal_ida,
    rota_principal_volta: detalhe.usa_volta
      ? enriquecerRotaPrincipalComTurno(detalhe.rota_principal_volta, minhaViagem.volta, 'volta')
      : detalhe.rota_principal_volta,
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
    const emCache = await lerCache<MeusAgendamentosResponse>(CACHE_MEUS);
    const cacheadosPorId = new Map(
      (Array.isArray(emCache?.agendamentos) ? emCache!.agendamentos : []).map(
        (item: any) => [item?.id, item] as const,
      ),
    );
    // O cache guarda a última alocação consultada com sucesso: uma consulta que falha
    // não pode sobrescrevê-la com "aguardando" nem com "indisponível" (issue #530).
    const paraCache: any[] = [];
    const agendamentosEnriquecidos = Array.isArray(dados?.agendamentos)
      ? await Promise.all(
          dados.agendamentos.map(async (item) => {
            const possuiEstruturaDetalhe =
              item != null &&
              typeof item === 'object' &&
              ('rota_principal_ida' in item || 'rota_principal_volta' in item);
            if (!possuiEstruturaDetalhe || !item.data) {
              paraCache.push(item);
              return item;
            }
            const consulta = await agendamentoService.consultarMinhaViagem(item.data);
            if (consulta.falhou) {
              paraCache.push(cacheadosPorId.get(item.id) ?? item);
              return marcarAlocacaoIndisponivel(item);
            }
            const enriquecido = enriquecerDetalheComMinhaViagem(item, consulta.dados);
            paraCache.push(enriquecido);
            return enriquecido;
          }),
        )
      : dados?.agendamentos;
    const respostaFinal: MeusAgendamentosResponse = {
      ...dados,
      agendamentos: agendamentosEnriquecidos,
    };
    await salvarCache(
      CACHE_MEUS,
      JSON.stringify(
        Array.isArray(dados?.agendamentos)
          ? { ...respostaFinal, agendamentos: paraCache }
          : respostaFinal,
      ),
    );
    return respostaFinal;
  },

  /** Consulta a alocação e informa se a consulta falhou (erro de rede, servidor ou resposta inválida). */
  async consultarMinhaViagem(
    dataIso: string,
  ): Promise<{ dados: MinhaViagemApiResponse | null; falhou: boolean }> {
    try {
      const response = await api.get('/alocacao-diaria/minha-viagem', {
        params: { data: dataIso },
      });
      if (response?.data && typeof response.data.possui_agendamento === 'boolean') {
        return { dados: response.data as MinhaViagemApiResponse, falhou: false };
      }
      return { dados: null, falhou: true };
    } catch {
      return { dados: null, falhou: true };
    }
  },

  async obterMinhaViagem(dataIso: string): Promise<MinhaViagemApiResponse | null> {
    return (await agendamentoService.consultarMinhaViagem(dataIso)).dados;
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

  // HU-015 / HU-019: detalhes da viagem por data, com alocação diária e cache offline (FA-002)
  async obterDetalhesViagem(dataIso: string): Promise<DetalhesViagemResponse> {
    const cacheKey = CACHE_DETALHES(dataIso);

    try {
      const response = await api.get('/transporte/agendamentos/detalhes', {
        params: { data: dataIso },
      });
      const consulta = await agendamentoService.consultarMinhaViagem(dataIso);
      if (consulta.falhou) {
        // Sem a alocação não dá para afirmar "aguardando". O cache offline continua sendo
        // alimentado com a reserva (HU-015), mas nunca sobrescreve uma alocação já
        // sincronizada da mesma reserva.
        const indisponivel = marcarAlocacaoIndisponivel(response.data);
        const jaSincronizado = await lerCache<AgendamentoDetalhe>(cacheKey);
        if (!jaSincronizado || jaSincronizado.atualizado_em !== indisponivel.atualizado_em) {
          await salvarCache(cacheKey, JSON.stringify(indisponivel));
        }
        return mapearDetalhe(indisponivel);
      }
      const minhaViagem = consulta.dados;
      const detalhe = enriquecerDetalheComMinhaViagem(response.data, minhaViagem);
      // Revalidação do cache pelo atualizado_em ou pela nova alocação diária recebida.
      const emCache = await lerCache<AgendamentoDetalhe>(cacheKey);
      if (!emCache || emCache.atualizado_em !== detalhe.atualizado_em || minhaViagem !== null) {
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
