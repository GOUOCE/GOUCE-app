import { api } from '@/api/api';
import { rotaPrincipalService, type RotaPrincipalItem } from '@/services/rotaPrincipalService';
import { formatarTituloOnibus } from '@/utils/formatarOnibus';

export type Turno = 'ida' | 'volta';
export type TipoLugar = 'sentado' | 'em_pe';
export type ModoDistribuicao = 'automatico' | 'manual';

export interface AlunoAlocacao {
  agendamento_id: number;
  tipo_lugar: TipoLugar;
}

export interface AlocacaoDistribuicao {
  rota_id: number;
  onibus_id: string;
  motorista_id: number;
  turno: Turno;
  capacidade: {
    assentos: number;
    em_pe: number;
  };
  sentados: number;
  em_pe: number;
  alunos: AlunoAlocacao[];
  excedentes: { agendamento_id: number; turno: Turno }[];
  onibus_apelido?: string | null;
  motorista_nome?: string | null;
}

export interface DemandaRota {
  rota_id: number;
  total_alunos: number;
}

export interface ExcedenteGlobal {
  agendamento_id: number;
  turno: Turno;
  aluno_id?: number | null;
  nome_aluno?: string | null;
  rota_id?: number | null;
}

export interface AlertaDistribuicao {
  tipo: string;
  mensagem: string;
}

export interface PreviaDistribuicao {
  data: string;
  demanda_por_rota: DemandaRota[];
  alocacoes: AlocacaoDistribuicao[];
  excedentes_globais: ExcedenteGlobal[];
  alertas: AlertaDistribuicao[];
  status_logistico?: 'PENDENTE' | 'DISTRIBUIDO' | string;
  distribuicao_persistida?: boolean;
}

export interface AlocacaoRequest {
  rota_id: number;
  onibus_id: string;
  motorista_id: number;
  turno: Turno;
  alunos: AlunoAlocacao[];
}

export interface DistribuicaoRequest {
  data: string;
  modo: ModoDistribuicao;
  alocacoes: AlocacaoRequest[];
}

export interface DistribuicaoResponse {
  mensagem: string;
  data: string;
  status_logistico: string;
  alocacoes: AlocacaoRequest[];
}

export interface LinhaDistribuicao {
  id: number;
  nomeLinha: string;
  horarioSaida: string;
  horarioVolta: string;
  faculdades: string[];
  status: 'pendente' | 'alocada' | 'superlotada';
  alunosAgendados: number;
  alunosSentados: number;
  alunosEmPe: number;
  capacidadeSentados: number;
  capacidadeEmPe: number;
  excedentes: number;
  motoristaId?: number | null;
  motoristaNome?: string | null;
  onibusId?: string | null;
  onibusApelido?: string | null;
}

export interface AlunoExcedente {
  id: number;
  agendamentoId: number;
  alunoId?: number | null;
  rotaId?: number | null;
  turno: Turno;
  nome: string;
  iniciais: string;
  trajetoText: string;
  selecionado: boolean;
}

export interface OpcaoRealocacao {
  chave: string;
  indice: number;
  rotaId: number;
  rotaNome: string;
  onibusId: string;
  onibusLabel: string;
  motoristaId: number;
  motoristaNome: string;
  turno: Turno;
  vagas: number;
}

export interface OpcaoSelect {
  label: string;
  value: string;
}

export interface OnibusOpcao extends OpcaoSelect {
  placa: string;
  identificacao: string;
  assentos: number;
  capacidadeEmPe: number;
}

export interface MotoristaOpcao extends OpcaoSelect {
  id: number;
  nome: string;
}

export interface OpcoesAlocacao {
  rota: RotaPrincipalItem;
  preview: PreviaDistribuicao;
  onibus: OnibusOpcao[];
  motoristas: MotoristaOpcao[];
  onibusOptions: OnibusOpcao[];
  motoristaOptions: MotoristaOpcao[];
}

const cacheAlocacoesConfirmadas = new Map<string, AlocacaoDistribuicao[]>();

function normalizarPlaca(placa: string) {
  return placa.trim().toUpperCase();
}

function unicos<T>(itens: T[]): T[] {
  return Array.from(new Set(itens));
}

function iniciaisDeNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export const MENSAGEM_DIA_PASSADO =
  'Este dia já passou: a distribuição é somente consulta e não pode ser alterada.';

/** Dia anterior a hoje (data local do aparelho): somente consulta, sem alterar a distribuição (issue #542). */
export function ehDiaPassado(dataIso: string, hoje: Date = new Date()): boolean {
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return dataIso < `${ano}-${mes}-${dia}`;
}

/**
 * Devolve o valor escolhido só se ele ainda está entre as opções disponíveis (ativas);
 * caso contrário devolve '' para a tela tratá-lo como não selecionado.
 * Evita enviar, sem o administrador ver, um ônibus ou motorista que ficou inativo
 * depois de gravado na escala (issue #522).
 */
export function manterSelecaoDisponivel(valor: string, opcoes: { value: string }[]): string {
  return opcoes.some((opcao) => opcao.value === valor) ? valor : '';
}

function mapearOnibus(item: any): OnibusOpcao | null {
  const placa = String(item?.placa_onibus ?? item?.placa ?? '').trim();
  if (!placa) return null;

  const apelido = String(item?.apelido_onibus ?? item?.apelido ?? '').trim();
  const assentos = Number(item?.qtd_assentos ?? item?.assentos ?? 0);
  const capacidadeEmPe = Number(item?.capacidade_maxima ?? item?.capacidade_em_pe ?? 0);
  const identificacao = apelido || `Ônibus ${placa}`;

  return {
    label: `${formatarTituloOnibus(apelido, placa)} (capacidade: ${assentos} sentados + ${capacidadeEmPe} em pé)`,
    value: placa,
    placa,
    identificacao,
    assentos,
    capacidadeEmPe,
  };
}

async function listarOnibusAtivos(): Promise<OnibusOpcao[]> {
  const response = await api.get<any[]>('/onibus', { params: { ativo: true } });
  const lista = Array.isArray(response.data) ? response.data : [];
  return lista
    .map(mapearOnibus)
    .filter((item): item is OnibusOpcao => item !== null);
}

async function listarMotoristasAtivos(): Promise<MotoristaOpcao[]> {
  const response = await api.get<any[]>('/motoristas', { params: { incluir_inativos: false } });
  const lista = Array.isArray(response.data) ? response.data : [];
  return lista
    .filter((item) => item?.ativo !== false)
    .map((item) => ({
      label: String(item.nome ?? ''),
      value: String(item.id),
      id: Number(item.id),
      nome: String(item.nome ?? ''),
    }));
}

function nomesFaculdades(rota: any): string[] {
  const faculdades = [...(rota?.faculdades_ida ?? []), ...(rota?.faculdades_volta ?? [])];
  const vistos = new Set<string>();
  const nomes: string[] = [];

  for (const faculdade of faculdades) {
    const nome = String(faculdade?.sigla || faculdade?.nome || '').trim();
    if (nome && !vistos.has(nome)) {
      vistos.add(nome);
      nomes.push(nome);
    }
  }

  return nomes;
}

async function obterPreviewComCache(dataIso: string): Promise<PreviaDistribuicao> {
  const response = await api.get<PreviaDistribuicao>('/alocacao-diaria/distribuicao-automatica', {
    params: { data: dataIso },
  });
  const preview = response.data;
  const confirmadas = cacheAlocacoesConfirmadas.get(dataIso);

  return confirmadas
    ? {
        ...preview,
        alocacoes: confirmadas,
        status_logistico: 'DISTRIBUIDO',
        distribuicao_persistida: true,
      }
    : preview;
}

async function obterReferencias() {
  const [rotasResponse, onibus, motoristas] = await Promise.all([
    api.get<any[]>('/rotas-principais', { params: { incluir_inativos: false } }),
    listarOnibusAtivos(),
    listarMotoristasAtivos(),
  ]);
  const rotas = Array.isArray(rotasResponse.data) ? rotasResponse.data : [];

  return {
    rotas,
    onibus,
    motoristas,
    onibusPorPlaca: new Map(onibus.map((item) => [normalizarPlaca(item.placa), item])),
    motoristaPorId: new Map(motoristas.map((item) => [item.id, item])),
  };
}

function montarLinha(
  demanda: DemandaRota,
  rota: any | undefined,
  alocacoes: AlocacaoDistribuicao[],
  excedentesGlobais: ExcedenteGlobal[],
  referencias: Awaited<ReturnType<typeof obterReferencias>>,
): LinhaDistribuicao {
  const rotaId = Number(demanda.rota_id);
  const alocacoesRota = alocacoes.filter((item) => Number(item.rota_id) === rotaId);
  const excedentesDaRota = excedentesGlobais.filter((item) => Number(item.rota_id) === rotaId);
  const excedentes = excedentesDaRota.length;
  const agendamentosUnicos = new Set<number>();
  for (const item of alocacoesRota) {
    for (const aluno of item.alunos ?? []) {
      agendamentosUnicos.add(Number(aluno.agendamento_id));
    }
  }
  for (const item of excedentesDaRota) {
    agendamentosUnicos.add(Number(item.agendamento_id));
  }
  const temDetalhesAgendamentos = alocacoes.length > 0 || excedentesGlobais.length > 0;
  const alunosAgendados = temDetalhesAgendamentos
    ? agendamentosUnicos.size
    : Number(demanda.total_alunos ?? 0);

  const onibusIds = unicos(alocacoesRota.map((item) => item.onibus_id).filter(Boolean));
  const motoristaIds = unicos(
    alocacoesRota.map((item) => Number(item.motorista_id)).filter((id) => id > 0),
  );
  const nomesOnibus = onibusIds.map(
    (placa) => referencias.onibusPorPlaca.get(normalizarPlaca(placa))?.identificacao ?? placa,
  );
  const nomesMotoristas = motoristaIds.map(
    (id) => referencias.motoristaPorId.get(id)?.nome ?? `Motorista #${id}`,
  );

  return {
    id: rotaId,
    nomeLinha: rota?.nome ?? `Rota ${rotaId}`,
    horarioSaida: rota?.horario_saida ?? '',
    horarioVolta: rota?.horario_retorno ?? '',
    faculdades: nomesFaculdades(rota),
    status:
      alocacoesRota.length === 0
        ? 'pendente'
        : excedentes > 0
          ? 'superlotada'
          : 'alocada',
    alunosAgendados,
    alunosSentados: alocacoesRota.reduce((total, item) => total + Number(item.sentados ?? 0), 0),
    alunosEmPe: alocacoesRota.reduce((total, item) => total + Number(item.em_pe ?? 0), 0),
    capacidadeSentados: alocacoesRota.reduce(
      (total, item) => total + Number(item.capacidade?.assentos ?? 0),
      0,
    ),
    capacidadeEmPe: alocacoesRota.reduce(
      (total, item) => total + Number(item.capacidade?.em_pe ?? 0),
      0,
    ),
    excedentes,
    motoristaId: motoristaIds[0] ?? null,
    motoristaNome: nomesMotoristas.length > 0 ? nomesMotoristas.join(', ') : null,
    onibusId: onibusIds[0] ?? null,
    onibusApelido: nomesOnibus.length > 0 ? nomesOnibus.join(', ') : null,
  };
}

async function obterDadosDistribuicao(
  dataIso: string,
): Promise<{ preview: PreviaDistribuicao; linhas: LinhaDistribuicao[] }> {
  const [preview, referencias] = await Promise.all([
    obterPreviewComCache(dataIso),
    obterReferencias(),
  ]);
  const rotasPorId = new Map(referencias.rotas.map((rota) => [Number(rota.id), rota]));
  const demandasPorRotaId = new Map<number, DemandaRota>();
  for (const demanda of preview.demanda_por_rota) {
    demandasPorRotaId.set(Number(demanda.rota_id), demanda);
  }
  for (const item of preview.alocacoes) {
    const rotaId = Number(item.rota_id);
    if ((item.alunos?.length ?? 0) > 0 && !demandasPorRotaId.has(rotaId)) {
      demandasPorRotaId.set(rotaId, { rota_id: rotaId, total_alunos: 0 });
    }
  }
  for (const item of preview.excedentes_globais) {
    const rotaId = Number(item.rota_id ?? 0);
    if (rotaId > 0 && !demandasPorRotaId.has(rotaId)) {
      demandasPorRotaId.set(rotaId, { rota_id: rotaId, total_alunos: 0 });
    }
  }
  const temDetalhesAgendamentos =
    preview.alocacoes.length > 0 || preview.excedentes_globais.length > 0;
  const linhas = Array.from(demandasPorRotaId.values())
    .map((demanda) =>
      montarLinha(
        demanda,
        rotasPorId.get(Number(demanda.rota_id)),
        preview.alocacoes,
        preview.excedentes_globais,
        referencias,
      ),
    )
    .filter((linha) => !temDetalhesAgendamentos || linha.alunosAgendados > 0);

  return { preview, linhas };
}

export const logisticaService = {
  async obterPreviaDistribuicao(dataIso: string): Promise<PreviaDistribuicao> {
    return obterPreviewComCache(dataIso);
  },

  async listarDistribuicaoLogistica(dataIso: string): Promise<LinhaDistribuicao[]> {
    const { linhas } = await obterDadosDistribuicao(dataIso);
    return linhas;
  },

  async obterPainelDistribuicao(
    dataIso: string,
  ): Promise<{ preview: PreviaDistribuicao; linhas: LinhaDistribuicao[] }> {
    return obterDadosDistribuicao(dataIso);
  },

  async obterOpcoesAlocacao(
    linhaId: number | string,
    dataIso: string,
  ): Promise<OpcoesAlocacao> {
    const [preview, rota, onibus, motoristas] = await Promise.all([
      obterPreviewComCache(dataIso),
      rotaPrincipalService.obterRotaPrincipalPorId(Number(linhaId)),
      listarOnibusAtivos(),
      listarMotoristasAtivos(),
    ]);

    return {
      rota,
      preview,
      onibus,
      motoristas,
      onibusOptions: onibus,
      motoristaOptions: motoristas,
    };
  },

  async confirmarDistribuicao(
    payload: DistribuicaoRequest,
    alocacoesConfirmadas?: AlocacaoDistribuicao[],
  ): Promise<DistribuicaoResponse> {
    const response = await api.post<DistribuicaoResponse>(
      '/alocacao-diaria/distribuicao',
      payload,
    );

    if (alocacoesConfirmadas) {
      cacheAlocacoesConfirmadas.set(payload.data, alocacoesConfirmadas);
    } else if (payload.modo === 'automatico') {
      cacheAlocacoesConfirmadas.delete(payload.data);
    }

    return response.data;
  },

  async obterExcedentes(
    dataIso: string,
    linhaId?: number | string,
  ): Promise<{
    rota: LinhaDistribuicao | null;
    alunos: AlunoExcedente[];
    preview: PreviaDistribuicao;
    linhas: LinhaDistribuicao[];
  }> {
    const { preview, linhas } = await obterDadosDistribuicao(dataIso);
    const rota =
      linhaId === undefined
        ? null
        : linhas.find((item) => String(item.id) === String(linhaId)) ?? null;
    const alunos: AlunoExcedente[] = preview.excedentes_globais.map((item) => {
      const nome = item.nome_aluno?.trim() || `Agendamento #${item.agendamento_id}`;
      return {
        id: item.agendamento_id,
        agendamentoId: item.agendamento_id,
        alunoId: item.aluno_id ?? null,
        rotaId: item.rota_id ?? null,
        turno: item.turno,
        nome,
        iniciais: iniciaisDeNome(nome),
        trajetoText: item.turno === 'ida' ? 'Turno de ida' : 'Turno de volta',
        selecionado: false,
      };
    });

    return { rota, alunos, preview, linhas };
  },
};
