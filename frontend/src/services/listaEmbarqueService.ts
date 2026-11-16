import { api } from '@/api/api';
import { getErrorMessage } from '@/utils/errorUtils';

export type SentidoViagem =
  | 'IDA_E_VOLTA_MESMA_IES'
  | 'SOMENTE_IDA'
  | 'SOMENTE_VOLTA'
  | 'IES_DISTINTAS';

export type PerfilListaEmbarque = 'ADMINISTRADOR' | 'MOTORISTA';

export interface AlunoEmbarqueInput {
  id: number;
  nome: string;
  pontoEmbarque: string;
  iesIda?: string;
  iesVolta?: string;
}

export interface AlunoEmbarqueItem extends AlunoEmbarqueInput {
  sentidoViagem: SentidoViagem;
  trajetoFormatado: string;
  agendamentoId?: number;
  alunoId?: number;
  tipoLugarIda?: 'sentado' | 'em_pe' | null;
  tipoLugarVolta?: 'sentado' | 'em_pe' | null;
  onibusIda?: string | null;
  onibusVolta?: string | null;
  motoristaIda?: string | null;
  motoristaVolta?: string | null;
}

export interface RotaEmbarqueOpcao {
  id: number;
  nome: string;
  horarioSaida?: string;
  quantidadeAlunos?: number;
}

export interface VeiculoEscaladoItem {
  alocacaoId: number;
  turno: 'ida' | 'volta';
  onibusPlaca: string;
  motoristaNome: string;
  totalSentados: number;
  totalEmPe: number;
}

export interface ListaEmbarqueRota {
  rotaId: number;
  rotaNome: string;
  dataOperacao: string;
  totalAlunos: number;
  alunos: AlunoEmbarqueItem[];
  ultimaSincronizacaoISO: string;
  mensagem?: string | null;
  permiteImprimir?: boolean;
  textoContador?: string;
  veiculosEscalados?: VeiculoEscaladoItem[];
}

export interface OpcoesFiltroListaEmbarque {
  perfil?: PerfilListaEmbarque;
  iesResponsavel?: string;
  data?: string;
  turno?: 'ida' | 'volta';
  intervaloMs?: number;
}

// ===== Contratos do backend (/alocacao-diaria/rotas-do-dia e /lista-embarque) =====

export interface RotaDoDiaApiDTO {
  rota_id: number;
  nome_rota: string;
  horario_saida: string;
}

export interface RotasDoDiaApiResponse {
  data: string;
  rotas: RotaDoDiaApiDTO[];
}

export interface PontoResumoApiDTO {
  ponto_id: number;
  nome: string;
  bairro?: string | null;
}

export interface FaculdadeResumoApiDTO {
  id: number;
  nome: string;
  sigla?: string | null;
  campus: string;
}

export interface VeiculoEscaladoApiDTO {
  alocacao_id: number;
  turno: 'ida' | 'volta';
  onibus_placa: string;
  motorista_nome: string;
  total_sentados: number;
  total_em_pe: number;
}

export type IndicacaoTurnoApi =
  | 'APENAS_IDA'
  | 'APENAS_VOLTA'
  | 'IDA_E_VOLTA_MESMA_IES'
  | 'IDA_E_VOLTA_IES_DISTINTAS';

export interface AlunoListaEmbarqueApiDTO {
  aluno_id: number;
  agendamento_id: number;
  nome_aluno: string;
  ponto_embarque: PontoResumoApiDTO | null;
  ponto_desembarque: PontoResumoApiDTO | null;
  ies_ida: FaculdadeResumoApiDTO | null;
  ies_volta: FaculdadeResumoApiDTO | null;
  indicacao_turno: IndicacaoTurnoApi;
  tipo_lugar_ida?: 'sentado' | 'em_pe' | null;
  tipo_lugar_volta?: 'sentado' | 'em_pe' | null;
  onibus_ida?: string | null;
  onibus_volta?: string | null;
  motorista_ida?: string | null;
  motorista_volta?: string | null;
}

export interface ListaEmbarqueApiResponse {
  data: string;
  rota_id: number;
  nome_rota: string;
  horario_saida?: string | null;
  horario_retorno?: string | null;
  veiculos_escalados?: VeiculoEscaladoApiDTO[];
  total_alunos_alocados: number;
  texto_contador: string;
  permite_imprimir: boolean;
  mensagem?: string | null;
  ultima_sincronizacao: string;
  indicador_sincronizacao?: string;
  alunos: AlunoListaEmbarqueApiDTO[];
}

export const INTERVALO_POLLING_LISTA_MS = 30_000;

function normalizarTextoComparacao(valor?: string): string {
  return (valor ?? '').trim().toLocaleLowerCase('pt-BR');
}

function dataLocalIso(data: Date = new Date()): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function formatarDataIsoParaBR(dataIso: string): string {
  const limpa = (dataIso ?? '').trim();
  const match = limpa.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return limpa;
  }
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

function rotuloFaculdade(faculdade?: FaculdadeResumoApiDTO | null): string | undefined {
  if (!faculdade) return undefined;
  const sigla = faculdade.sigla?.trim();
  if (sigla) return sigla;
  const nome = faculdade.nome?.trim();
  return nome || undefined;
}

function mapearIndicacaoTurnoApi(indicacao: IndicacaoTurnoApi): SentidoViagem {
  switch (indicacao) {
    case 'APENAS_IDA':
      return 'SOMENTE_IDA';
    case 'APENAS_VOLTA':
      return 'SOMENTE_VOLTA';
    case 'IDA_E_VOLTA_IES_DISTINTAS':
      return 'IES_DISTINTAS';
    case 'IDA_E_VOLTA_MESMA_IES':
    default:
      return 'IDA_E_VOLTA_MESMA_IES';
  }
}

/**
 * Classifica o sentido da viagem do aluno a partir das IES de ida e de volta.
 */
export function determinarSentidoViagem(iesIda?: string, iesVolta?: string): SentidoViagem {
  const ida = iesIda?.trim() ?? '';
  const volta = iesVolta?.trim() ?? '';

  if (ida && volta) {
    return normalizarTextoComparacao(ida) === normalizarTextoComparacao(volta)
      ? 'IDA_E_VOLTA_MESMA_IES'
      : 'IES_DISTINTAS';
  }

  if (ida) {
    return 'SOMENTE_IDA';
  }

  if (volta) {
    return 'SOMENTE_VOLTA';
  }

  throw new Error('Informe ao menos uma IES de ida ou de volta para o aluno.');
}

/**
 * Formata a linha descritiva de trajeto conforme o protótipo da Lista de Embarque (HU-018).
 */
export function formatarTrajetoEmbarque(dados: {
  pontoEmbarque: string;
  iesIda?: string;
  iesVolta?: string;
}): string {
  const ponto = dados.pontoEmbarque.trim();
  const ida = dados.iesIda?.trim() ?? '';
  const volta = dados.iesVolta?.trim() ?? '';

  if (!ida && !volta) {
    return ponto;
  }

  const sentido = determinarSentidoViagem(ida, volta);

  switch (sentido) {
    case 'IDA_E_VOLTA_MESMA_IES':
      return `${ponto} ↔ ${ida}`;
    case 'SOMENTE_IDA':
      return `${ponto} → ${ida}`;
    case 'SOMENTE_VOLTA':
      return `${ponto} ← ${volta}`;
    case 'IES_DISTINTAS':
      return `Ida: ${ponto} → ${ida} | Volta: ← ${volta}`;
  }
}

/**
 * Formata o indicador inferior de tempo desde a última sincronização ("Atualizado há X min").
 */
export function formatarTempoSincronizacao(ultimaSincronizacaoISO: string, agora?: Date): string {
  const timestampSync = new Date(ultimaSincronizacaoISO).getTime();
  if (Number.isNaN(timestampSync)) {
    return 'Atualizado agora';
  }

  const referenciaMs = (agora ?? new Date()).getTime();
  const diferencaMs = Math.max(0, referenciaMs - timestampSync);
  const minutos = Math.floor(diferencaMs / 60_000);

  if (minutos < 1) {
    return 'Atualizado agora';
  }

  return `Atualizado há ${minutos} min`;
}

/**
 * Extrai mensagem de erro amigável para os formatos retornados pelos endpoints de alocação diária.
 */
export function extrairMensagemErroListaEmbarque(
  erro: unknown,
  fallback: string = 'Erro ao carregar a lista de embarque.',
): string {
  const err = erro as any;
  const detail = err?.response?.data?.detail;
  if (detail && typeof detail === 'object' && typeof detail.message === 'string') {
    return detail.message;
  }
  return getErrorMessage(err, fallback);
}

/**
 * Converte a resposta da API `GET /alocacao-diaria/lista-embarque` para o modelo da UI.
 */
export function mapearRespostaListaEmbarque(dto: ListaEmbarqueApiResponse): ListaEmbarqueRota {
  const alunos = (dto.alunos ?? []).map((aluno): AlunoEmbarqueItem => {
    const pontoNome =
      aluno.indicacao_turno === 'APENAS_VOLTA'
        ? aluno.ponto_desembarque?.nome ?? aluno.ponto_embarque?.nome ?? 'Ponto não informado'
        : aluno.ponto_embarque?.nome ?? aluno.ponto_desembarque?.nome ?? 'Ponto não informado';

    const iesIda =
      aluno.indicacao_turno === 'APENAS_VOLTA' ? undefined : rotuloFaculdade(aluno.ies_ida);
    const iesVolta =
      aluno.indicacao_turno === 'APENAS_IDA' ? undefined : rotuloFaculdade(aluno.ies_volta);

    const sentidoViagem =
      iesIda || iesVolta
        ? determinarSentidoViagem(iesIda, iesVolta)
        : mapearIndicacaoTurnoApi(aluno.indicacao_turno);

    const trajetoFormatado = formatarTrajetoEmbarque({
      pontoEmbarque: pontoNome,
      iesIda,
      iesVolta,
    });

    return {
      id: aluno.agendamento_id || aluno.aluno_id,
      alunoId: aluno.aluno_id,
      agendamentoId: aluno.agendamento_id,
      nome: aluno.nome_aluno,
      pontoEmbarque: pontoNome,
      iesIda,
      iesVolta,
      sentidoViagem,
      trajetoFormatado,
      tipoLugarIda: aluno.tipo_lugar_ida ?? null,
      tipoLugarVolta: aluno.tipo_lugar_volta ?? null,
      onibusIda: aluno.onibus_ida ?? null,
      onibusVolta: aluno.onibus_volta ?? null,
      motoristaIda: aluno.motorista_ida ?? null,
      motoristaVolta: aluno.motorista_volta ?? null,
    };
  });

  return {
    rotaId: dto.rota_id,
    rotaNome: dto.nome_rota,
    dataOperacao: formatarDataIsoParaBR(dto.data),
    totalAlunos: dto.total_alunos_alocados ?? alunos.length,
    alunos,
    ultimaSincronizacaoISO: dto.ultima_sincronizacao || new Date().toISOString(),
    mensagem: dto.mensagem ?? null,
    permiteImprimir: dto.permite_imprimir,
    textoContador: dto.texto_contador,
    veiculosEscalados: (dto.veiculos_escalados ?? []).map((v) => ({
      alocacaoId: v.alocacao_id,
      turno: v.turno,
      onibusPlaca: v.onibus_placa,
      motoristaNome: v.motorista_nome,
      totalSentados: v.total_sentados,
      totalEmPe: v.total_em_pe,
    })),
  };
}

/**
 * Camada de serviço integrada à API real da Lista de Embarque (HU-018).
 */
export const listaEmbarqueService = {
  async listarRotasDisponiveis(dataIso?: string): Promise<RotaEmbarqueOpcao[]> {
    const data = dataIso || dataLocalIso();
    const response = await api.get<RotasDoDiaApiResponse>('/alocacao-diaria/rotas-do-dia', {
      params: { data },
    });
    const rotas = Array.isArray(response.data?.rotas) ? response.data.rotas : [];
    return rotas.map((rota) => ({
      id: rota.rota_id,
      nome: rota.nome_rota,
      horarioSaida: rota.horario_saida,
    }));
  },

  async obterListaEmbarque(params: {
    rotaId?: number;
    data?: string;
    turno?: 'ida' | 'volta';
    perfil?: PerfilListaEmbarque;
    iesResponsavel?: string;
  }): Promise<ListaEmbarqueRota> {
    const query: Record<string, string | number> = {
      data: params.data || dataLocalIso(),
    };
    if (params.rotaId !== undefined && params.rotaId !== null) {
      query.rota_id = params.rotaId;
    }
    if (params.turno) {
      query.turno = params.turno;
    }

    const response = await api.get<ListaEmbarqueApiResponse>('/alocacao-diaria/lista-embarque', {
      params: query,
    });
    return mapearRespostaListaEmbarque(response.data);
  },

  async obterRotaPadraoRepresentante(dataIso?: string): Promise<{
    rotaId: number;
    rotaNome: string;
    horarioSaida?: string;
  } | null> {
    const rotas = await listaEmbarqueService.listarRotasDisponiveis(dataIso);
    if (rotas.length === 0) {
      return null;
    }
    return {
      rotaId: rotas[0].id,
      rotaNome: rotas[0].nome,
      horarioSaida: rotas[0].horarioSaida,
    };
  },

  inscreverAtualizacaoRota(
    rotaId: number,
    listener: (lista: ListaEmbarqueRota) => void,
    opcoes?: OpcoesFiltroListaEmbarque,
  ): () => void {
    let cancelado = false;
    const intervalo = setInterval(() => {
      listaEmbarqueService
        .obterListaEmbarque({
          rotaId,
          data: opcoes?.data,
          turno: opcoes?.turno,
          perfil: opcoes?.perfil,
          iesResponsavel: opcoes?.iesResponsavel,
        })
        .then((listaAtualizada) => {
          if (!cancelado) {
            listener(listaAtualizada);
          }
        })
        .catch(() => {
          // Mantém a lista atualmente visível caso uma atualização em segundo plano falhe.
        });
    }, opcoes?.intervaloMs ?? INTERVALO_POLLING_LISTA_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  },
};
