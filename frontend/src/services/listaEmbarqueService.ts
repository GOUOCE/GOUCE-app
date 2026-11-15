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
}

export interface RotaEmbarqueOpcao {
  id: number;
  nome: string;
  quantidadeAlunos: number;
}

export interface ListaEmbarqueRota {
  rotaId: number;
  rotaNome: string;
  dataOperacao: string;
  totalAlunos: number;
  alunos: AlunoEmbarqueItem[];
  ultimaSincronizacaoISO: string;
}

interface RotaEmbarqueState {
  rotaId: number;
  rotaNome: string;
  alunos: AlunoEmbarqueInput[];
  ultimaSincronizacaoISO: string;
}

export interface OpcoesFiltroListaEmbarque {
  perfil?: PerfilListaEmbarque;
  iesResponsavel?: string;
}

interface InscricaoListener {
  listener: (lista: ListaEmbarqueRota) => void;
  opcoes?: OpcoesFiltroListaEmbarque;
}

const MOCK_REPRESENTANTE_PADRAO = {
  rotaId: 1,
  rotaNome: 'Linha 01 - Centro',
  iesResponsavel: 'UFC',
};

const ALUNOS_LINHA_01_INICIAIS: AlunoEmbarqueInput[] = [
  { id: 1, nome: 'Ana Paula Lima', pontoEmbarque: 'Pça. Matriz', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 2, nome: 'Bruno Costa', pontoEmbarque: 'Pça. Matriz', iesIda: 'Católica' },
  { id: 3, nome: 'Carla Dias', pontoEmbarque: 'Trevo Bairro Novo', iesVolta: 'UECE' },
  { id: 4, nome: 'Daniel Oliveira', pontoEmbarque: 'Pça. Matriz', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 5, nome: 'Davi Mendes', pontoEmbarque: 'Av. Central', iesIda: 'IFCE' },
  { id: 6, nome: 'Eduarda Fernandes', pontoEmbarque: 'Trevo Bairro Novo', iesIda: 'UFC', iesVolta: 'Católica' },
  { id: 7, nome: 'Emanuel Barbosa', pontoEmbarque: 'Terminal Rodoviário', iesVolta: 'UFC' },
  { id: 8, nome: 'Fabiana Carvalho', pontoEmbarque: 'Pça. Matriz', iesIda: 'UECE', iesVolta: 'UECE' },
  { id: 9, nome: 'Felipe Rocha', pontoEmbarque: 'Av. Central', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 10, nome: 'Fernanda Alves', pontoEmbarque: 'Trevo Bairro Novo', iesIda: 'Católica', iesVolta: 'Católica' },
  { id: 11, nome: 'Gabriel Martins', pontoEmbarque: 'Pça. Matriz', iesIda: 'IFCE', iesVolta: 'IFCE' },
  { id: 12, nome: 'Giovanna Lima', pontoEmbarque: 'Av. Central', iesIda: 'UFC' },
  { id: 13, nome: 'Guilherme Araújo', pontoEmbarque: 'Terminal Rodoviário', iesIda: 'UECE', iesVolta: 'UFC' },
  { id: 14, nome: 'Helena Cardoso', pontoEmbarque: 'Pça. Matriz', iesVolta: 'Católica' },
  { id: 15, nome: 'Henrique Gomes', pontoEmbarque: 'Trevo Bairro Novo', iesIda: 'UVA', iesVolta: 'UVA' },
  { id: 16, nome: 'Igor Teixeira', pontoEmbarque: 'Av. Central', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 17, nome: 'Isabela Ferreira', pontoEmbarque: 'Pça. Matriz', iesIda: 'Católica' },
  { id: 18, nome: 'João Pedro Castro', pontoEmbarque: 'Terminal Rodoviário', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 19, nome: 'Júlia Nascimento', pontoEmbarque: 'Trevo Bairro Novo', iesVolta: 'IFCE' },
  { id: 20, nome: 'Kaio Pereira', pontoEmbarque: 'Av. Central', iesIda: 'UECE', iesVolta: 'UECE' },
  { id: 21, nome: 'Larissa Cunha', pontoEmbarque: 'Pça. Matriz', iesIda: 'UFC', iesVolta: 'IFCE' },
  { id: 22, nome: 'Leonardo Ribeiro', pontoEmbarque: 'Terminal Rodoviário', iesIda: 'Católica', iesVolta: 'Católica' },
  { id: 23, nome: 'Letícia Monteiro', pontoEmbarque: 'Av. Central', iesVolta: 'UECE' },
  { id: 24, nome: 'Lucas Correia', pontoEmbarque: 'Pça. Matriz', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 25, nome: 'Mariana Azevedo', pontoEmbarque: 'Trevo Bairro Novo', iesIda: 'IFCE', iesVolta: 'IFCE' },
  { id: 26, nome: 'Mateus Vieira', pontoEmbarque: 'Av. Central', iesIda: 'UVA' },
  { id: 27, nome: 'Natália Borges', pontoEmbarque: 'Terminal Rodoviário', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 28, nome: 'Nicolas Freitas', pontoEmbarque: 'Pça. Matriz', iesVolta: 'Católica' },
  { id: 29, nome: 'Patrícia Ramos', pontoEmbarque: 'Trevo Bairro Novo', iesIda: 'UECE', iesVolta: 'UECE' },
  { id: 30, nome: 'Pedro Henrique Lopes', pontoEmbarque: 'Av. Central', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 31, nome: 'Rafael Nogueira', pontoEmbarque: 'Pça. Matriz', iesIda: 'Católica', iesVolta: 'UFC' },
  { id: 32, nome: 'Raquel Soares', pontoEmbarque: 'Terminal Rodoviário', iesIda: 'IFCE' },
  { id: 33, nome: 'Rodrigo Santana', pontoEmbarque: 'Av. Central', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 34, nome: 'Sabrina Melo', pontoEmbarque: 'Trevo Bairro Novo', iesVolta: 'UVA' },
  { id: 35, nome: 'Thiago Moreira', pontoEmbarque: 'Pça. Matriz', iesIda: 'UECE', iesVolta: 'UECE' },
  { id: 36, nome: 'Vanessa Duarte', pontoEmbarque: 'Terminal Rodoviário', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 37, nome: 'Vinícius Barros', pontoEmbarque: 'Av. Central', iesIda: 'Católica' },
  { id: 38, nome: 'Wesley Pontes', pontoEmbarque: 'Pça. Matriz', iesIda: 'UFC', iesVolta: 'Católica' },
];

const ALUNOS_LINHA_03_INICIAIS: AlunoEmbarqueInput[] = [
  { id: 101, nome: 'Beatriz Sampaio', pontoEmbarque: 'Rotatória da Serrinha', iesIda: 'UFC', iesVolta: 'UFC' },
  { id: 102, nome: 'Caio Albuquerque', pontoEmbarque: 'Posto São José', iesIda: 'UECE' },
  { id: 103, nome: 'Débora Vasconcelos', pontoEmbarque: 'Igreja Matriz', iesVolta: 'IFCE' },
  { id: 104, nome: 'Eduardo Bezerra', pontoEmbarque: 'Rotatória da Serrinha', iesIda: 'UFC', iesVolta: 'Católica' },
  { id: 105, nome: 'Flávia Queiroz', pontoEmbarque: 'Posto São José', iesIda: 'Católica', iesVolta: 'Católica' },
  { id: 106, nome: 'Gustavo Farias', pontoEmbarque: 'Igreja Matriz', iesIda: 'UFC', iesVolta: 'UFC' },
];

function criarTimestampUmMinutoAtras(): string {
  return new Date(Date.now() - 60_000).toISOString();
}

function criarEstadoInicialMocks(): RotaEmbarqueState[] {
  const sincronizadoPadrao = criarTimestampUmMinutoAtras();

  return [
    {
      rotaId: 1,
      rotaNome: 'Linha 01 - Centro',
      alunos: ALUNOS_LINHA_01_INICIAIS.map((aluno) => ({ ...aluno })),
      ultimaSincronizacaoISO: sincronizadoPadrao,
    },
    {
      rotaId: 2,
      rotaNome: 'Linha 02 - Bairro Novo',
      alunos: [],
      ultimaSincronizacaoISO: sincronizadoPadrao,
    },
    {
      rotaId: 3,
      rotaNome: 'Linha 03 - Serrinha',
      alunos: ALUNOS_LINHA_03_INICIAIS.map((aluno) => ({ ...aluno })),
      ultimaSincronizacaoISO: sincronizadoPadrao,
    },
  ];
}

const NOMES_REALOCACAO_MOCK = [
  'Amanda Bezerra',
  'Caio Viana',
  'Lívia Tavares',
  'Yasmim Farias',
];

let rotasMock: RotaEmbarqueState[] = criarEstadoInicialMocks();
let indiceRealocacao = 0;
let proximoIdRealocacao = 1000;
const listenersPorRota = new Map<number, Set<InscricaoListener>>();

function normalizarTextoComparacao(valor?: string): string {
  return (valor ?? '').trim().toLocaleLowerCase('pt-BR');
}

function formatarDataOperacaoDDMMYYYY(data: Date = new Date()): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
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

function ordenarAlunosPorNome(alunos: AlunoEmbarqueInput[]): AlunoEmbarqueInput[] {
  return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

function alunoVinculadoAIes(aluno: AlunoEmbarqueInput, iesAlvo: string): boolean {
  const alvoNormalizado = normalizarTextoComparacao(iesAlvo);
  return (
    normalizarTextoComparacao(aluno.iesIda) === alvoNormalizado ||
    normalizarTextoComparacao(aluno.iesVolta) === alvoNormalizado
  );
}

function mapearItemEmbarque(aluno: AlunoEmbarqueInput): AlunoEmbarqueItem {
  const sentidoViagem = determinarSentidoViagem(aluno.iesIda, aluno.iesVolta);
  const trajetoFormatado = formatarTrajetoEmbarque(aluno);

  return {
    ...aluno,
    sentidoViagem,
    trajetoFormatado,
  };
}

function filtrarEMontarLista(
  rota: RotaEmbarqueState,
  opcoes?: OpcoesFiltroListaEmbarque
): ListaEmbarqueRota {
  const perfil = opcoes?.perfil ?? 'ADMINISTRADOR';
  const iesAlvo =
    perfil === 'MOTORISTA'
      ? opcoes?.iesResponsavel?.trim() || MOCK_REPRESENTANTE_PADRAO.iesResponsavel
      : undefined;

  const alunosElegiveis = iesAlvo
    ? rota.alunos.filter((aluno) => alunoVinculadoAIes(aluno, iesAlvo))
    : rota.alunos;

  const alunosOrdenados = ordenarAlunosPorNome(alunosElegiveis).map(mapearItemEmbarque);

  return {
    rotaId: rota.rotaId,
    rotaNome: rota.rotaNome,
    dataOperacao: formatarDataOperacaoDDMMYYYY(),
    totalAlunos: alunosOrdenados.length,
    alunos: alunosOrdenados,
    ultimaSincronizacaoISO: rota.ultimaSincronizacaoISO,
  };
}

function buscarRotaStateOuFalhar(rotaId: number): RotaEmbarqueState {
  const rota = rotasMock.find((item) => item.rotaId === rotaId);
  if (!rota) {
    throw new Error(`Rota ${rotaId} não encontrada.`);
  }
  return rota;
}

function notificarListenersRota(rota: RotaEmbarqueState): void {
  const inscritos = listenersPorRota.get(rota.rotaId);
  if (!inscritos) return;

  for (const inscricao of Array.from(inscritos)) {
    inscricao.listener(filtrarEMontarLista(rota, inscricao.opcoes));
  }
}

/**
 * Camada de serviço mockada para a Lista de Embarque (HU-018).
 * Mantém o contrato desacoplado da UI para futura substituição pela API do backend.
 */
export const listaEmbarqueService = {
  async listarRotasDisponiveis(): Promise<RotaEmbarqueOpcao[]> {
    return rotasMock.map((rota) => ({
      id: rota.rotaId,
      nome: rota.rotaNome,
      quantidadeAlunos: rota.alunos.length,
    }));
  },

  async obterListaEmbarque(params: {
    rotaId: number;
    perfil?: PerfilListaEmbarque;
    iesResponsavel?: string;
  }): Promise<ListaEmbarqueRota> {
    const rota = buscarRotaStateOuFalhar(params.rotaId);
    return filtrarEMontarLista(rota, {
      perfil: params.perfil,
      iesResponsavel: params.iesResponsavel,
    });
  },

  async obterRotaPadraoRepresentante(): Promise<{
    rotaId: number;
    rotaNome: string;
    iesResponsavel: string;
  }> {
    return { ...MOCK_REPRESENTANTE_PADRAO };
  },

  inscreverAtualizacaoRota(
    rotaId: number,
    listener: (lista: ListaEmbarqueRota) => void,
    opcoes?: OpcoesFiltroListaEmbarque
  ): () => void {
    const conjunto = listenersPorRota.get(rotaId) ?? new Set<InscricaoListener>();
    const registro: InscricaoListener = { listener, opcoes };
    conjunto.add(registro);
    listenersPorRota.set(rotaId, conjunto);

    return () => {
      const atual = listenersPorRota.get(rotaId);
      if (!atual) return;
      atual.delete(registro);
      if (atual.size === 0) {
        listenersPorRota.delete(rotaId);
      }
    };
  },

  async simularAlteracaoTempoReal(
    rotaId: number,
    acao?: 'cancelamento' | 'realocacao'
  ): Promise<ListaEmbarqueRota> {
    const rota = buscarRotaStateOuFalhar(rotaId);
    const acaoEfetiva = acao ?? (rota.alunos.length > 0 ? 'cancelamento' : 'realocacao');

    if (acaoEfetiva === 'cancelamento') {
      if (rota.alunos.length > 0) {
        const alunosOrdenados = ordenarAlunosPorNome(rota.alunos);
        // Preserva os exemplos principais quando há mais de 4 alunos na lista
        const indiceRemover =
          alunosOrdenados.length > 4 ? alunosOrdenados.length - 2 : alunosOrdenados.length - 1;
        const alunoRemovido = alunosOrdenados[indiceRemover];
        rota.alunos = rota.alunos.filter((aluno) => aluno.id !== alunoRemovido.id);
      }
    } else {
      const novoId = proximoIdRealocacao++;
      const nomeBase = NOMES_REALOCACAO_MOCK[indiceRealocacao % NOMES_REALOCACAO_MOCK.length];
      const repeticao = Math.floor(indiceRealocacao / NOMES_REALOCACAO_MOCK.length);
      indiceRealocacao += 1;

      rota.alunos.push({
        id: novoId,
        nome: repeticao === 0 ? nomeBase : `${nomeBase} (${repeticao + 1})`,
        pontoEmbarque: 'Pça. Matriz',
        iesIda: 'UFC',
        iesVolta: 'UFC',
      });
    }

    rota.ultimaSincronizacaoISO = new Date().toISOString();
    notificarListenersRota(rota);

    return filtrarEMontarLista(rota);
  },

  resetarMocks(): void {
    rotasMock = criarEstadoInicialMocks();
    indiceRealocacao = 0;
    proximoIdRealocacao = 1000;
    listenersPorRota.clear();
  },
};
