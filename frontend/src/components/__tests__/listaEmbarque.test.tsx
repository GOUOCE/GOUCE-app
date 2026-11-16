import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { api } from '@/api/api';
import AdminListaEmbarqueScreen from '../../app/(administrador)/logistica/embarque';
import RepresentativeHomeScreen from '../../app/(representante)/home';
import {
  INTERVALO_POLLING_LISTA_MS,
  type AlunoListaEmbarqueApiDTO,
  type ListaEmbarqueApiResponse,
} from '../../services/listaEmbarqueService';
import { imprimirListaEmbarque } from '@/utils/impressaoListaEmbarque';

const renderer = jest.requireActual<any>('react-test-renderer');

const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);

let mockSearchParams: { rotaId?: string; modoFixo?: string } = {};
let mockUser: { id: number; name: string; role: string; faculdade?: number } | null = {
  id: 1,
  name: 'Administrador Padrao',
  role: 'ADMINISTRADOR',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
    replace: mockRouterReplace,
    canGoBack: mockRouterCanGoBack,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}));

jest.mock(
  '@contexts/AuthContext',
  () => ({
    useAuth: () => ({ user: mockUser }),
  }),
  { virtual: true },
);

jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  Printer: 'Printer',
  Route: 'Route',
}));

jest.mock('@/utils/impressaoListaEmbarque', () => ({
  imprimirListaEmbarque: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;
const mockImprimir = imprimirListaEmbarque as jest.MockedFunction<typeof imprimirListaEmbarque>;

let rootAtual: any = null;

function criarAlunosApiFixture(total: number = 38): AlunoListaEmbarqueApiDTO[] {
  const principais: AlunoListaEmbarqueApiDTO[] = [
    {
      aluno_id: 1,
      agendamento_id: 1,
      nome_aluno: 'Ana Paula Lima',
      ponto_embarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
      ponto_desembarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
      ies_ida: { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
      ies_volta: { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
      indicacao_turno: 'IDA_E_VOLTA_MESMA_IES',
    },
    {
      aluno_id: 2,
      agendamento_id: 2,
      nome_aluno: 'Bruno Costa',
      ponto_embarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
      ponto_desembarque: null,
      ies_ida: { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: 'Católica', campus: 'Quixadá' },
      ies_volta: null,
      indicacao_turno: 'APENAS_IDA',
    },
    {
      aluno_id: 3,
      agendamento_id: 3,
      nome_aluno: 'Carla Dias',
      ponto_embarque: null,
      ponto_desembarque: { ponto_id: 2, nome: 'Trevo Bairro Novo', bairro: 'Bairro Novo' },
      ies_ida: null,
      ies_volta: { id: 3, nome: 'Universidade Estadual do Ceará', sigla: 'UECE', campus: 'Quixadá' },
      indicacao_turno: 'APENAS_VOLTA',
    },
  ];

  const lista: AlunoListaEmbarqueApiDTO[] = [];
  for (let i = 0; i < total; i += 1) {
    if (i < principais.length) {
      lista.push(principais[i]);
    } else if (i === total - 1) {
      lista.push({
        aluno_id: 38,
        agendamento_id: 38,
        nome_aluno: 'Wesley Pontes',
        ponto_embarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ponto_desembarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ies_ida: { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
        ies_volta: { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: 'Católica', campus: 'Quixadá' },
        indicacao_turno: 'IDA_E_VOLTA_IES_DISTINTAS',
      });
    } else {
      lista.push({
        aluno_id: i + 1,
        agendamento_id: i + 1,
        nome_aluno: `Estudante ${String(i + 1).padStart(2, '0')}`,
        ponto_embarque: { ponto_id: 1, nome: 'Av. Central', bairro: 'Centro' },
        ponto_desembarque: { ponto_id: 1, nome: 'Av. Central', bairro: 'Centro' },
        ies_ida: { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: 'Católica', campus: 'Quixadá' },
        ies_volta: { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: 'Católica', campus: 'Quixadá' },
        indicacao_turno: 'IDA_E_VOLTA_MESMA_IES',
      });
    }
  }
  return lista;
}

function criarRespostaListaApi(
  override: Partial<ListaEmbarqueApiResponse> = {},
): ListaEmbarqueApiResponse {
  const alunos = override.alunos ?? criarAlunosApiFixture(38);
  const total = override.total_alunos_alocados ?? alunos.length;
  return {
    data: '2026-11-20',
    rota_id: 1,
    nome_rota: 'Linha 01 - Centro',
    horario_saida: '06:40',
    horario_retorno: '17:00',
    veiculos_escalados: [],
    total_alunos_alocados: total,
    texto_contador: `${total} aluno${total === 1 ? '' : 's'} alocado${total === 1 ? '' : 's'}`,
    permite_imprimir: total > 0,
    mensagem: total > 0 ? null : 'Essa rota não possui nenhum aluno alocado para este dia.',
    ultima_sincronizacao: new Date(Date.now() - 60_000).toISOString(),
    indicador_sincronizacao: 'Atualizado agora',
    alunos,
    ...override,
  };
}

function encontrarBotaoPorTestId(root: any, testID: string) {
  return root.root
    .findAllByType(TouchableOpacity)
    .find((node: any) => node.props.testID === testID);
}

function encontrarTextoPorTestId(root: any, testID: string) {
  return root.root
    .findAllByType(Text)
    .find((node: any) => node.props.testID === testID);
}

function lerTextoNode(node: any): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return '';
  }
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node.children)) {
    return node.children.map((child: any) => lerTextoNode(child)).join('');
  }
  return '';
}

function extrairTodosTextos(root: any): string {
  return root.root
    .findAllByType(Text)
    .map((node: any) => lerTextoNode(node))
    .join(' | ');
}

async function flushAsync() {
  await renderer.act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function renderizar(elemento: React.ReactElement) {
  await renderer.act(async () => {
    rootAtual = renderer.create(elemento);
  });
  await flushAsync();
  return rootAtual;
}

async function pressionar(botao: any) {
  await renderer.act(async () => {
    botao.props.onPress();
  });
  await flushAsync();
}

describe('Telas da Lista de Embarque integradas à API (HU-018)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    mockRouterCanGoBack.mockReturnValue(true);
    mockUser = {
      id: 1,
      name: 'Administrador Padrao',
      role: 'ADMINISTRADOR',
    };

    mockApiGet.mockImplementation(async (url: string, config?: any) => {
      if (url === '/alocacao-diaria/rotas-do-dia') {
        return {
          data: {
            data: config?.params?.data ?? '2026-11-20',
            rotas: [
              { rota_id: 1, nome_rota: 'Linha 01 - Centro', horario_saida: '06:40' },
              { rota_id: 2, nome_rota: 'Linha 02 - Bairro Novo', horario_saida: '07:00' },
            ],
          },
        } as any;
      }

      if (url === '/alocacao-diaria/lista-embarque') {
        const rotaId = config?.params?.rota_id;
        if (rotaId === 2) {
          return {
            data: criarRespostaListaApi({
              rota_id: 2,
              nome_rota: 'Linha 02 - Bairro Novo',
              alunos: [],
              total_alunos_alocados: 0,
            }),
          } as any;
        }
        return { data: criarRespostaListaApi() } as any;
      }

      throw new Error(`Endpoint inesperado: ${url}`);
    });
  });

  afterEach(async () => {
    if (rootAtual) {
      const alvo = rootAtual;
      rootAtual = null;
      await renderer.act(async () => {
        alvo.unmount();
      });
    }
    jest.useRealTimers();
  });

  describe('Fluxo Principal (52.1 - Acesso via menu pelo Administrador)', () => {
    it('exibe seletor "Rota *", omite botões temporários de simulação e aciona impressão', async () => {
      const root = await renderizar(<AdminListaEmbarqueScreen />);

      const subtitulo = lerTextoNode(encontrarTextoPorTestId(root, 'subtitulo-data-embarque'));
      expect(subtitulo).toMatch(/^Hoje - \d{2}\/\d{2}\/\d{4}$/);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeDefined();
      expect(encontrarBotaoPorTestId(root, 'alternar-modo-rota-fixa')).toBeUndefined();
      expect(
        root.root.findAll((node: any) => node.props?.testID === 'painel-simulacao-tempo-real'),
      ).toHaveLength(0);

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'mensagem-selecione-rota'))).toBe(
        'Selecione uma rota para visualizar os alunos alocados.',
      );

      const botaoImprimirInicial = encontrarBotaoPorTestId(root, 'botao-imprimir-lista');
      expect(botaoImprimirInicial.props.disabled).toBe(true);

      await pressionar(encontrarBotaoPorTestId(root, 'seletor-rota'));
      expect(root.root.findByType(Modal).props.visible).toBe(true);
      expect(extrairTodosTextos(root)).toContain('Horário de saída: 06:40');

      await pressionar(encontrarBotaoPorTestId(root, 'opcao-rota-1'));
      expect(root.root.findByType(Modal).props.visible).toBe(false);

      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque', {
        params: expect.objectContaining({ rota_id: 1 }),
      });

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados',
      );
      expect(
        root.root.findAll((node: any) => node.props?.testID === 'painel-simulacao-tempo-real'),
      ).toHaveLength(0);

      const textos = extrairTodosTextos(root);
      expect(textos).toContain('Ana Paula Lima');
      expect(textos).toContain('Pça. Matriz ↔ UFC');
      expect(textos).toContain('Bruno Costa');
      expect(textos).toContain('Pça. Matriz → Católica');
      expect(textos).toContain('Carla Dias');
      expect(textos).toContain('Trevo Bairro Novo ← UECE');

      const alunosLista = root.root.findByType(FlatList).props.data;
      const wesley = alunosLista.find((item: any) => item.nome === 'Wesley Pontes');
      expect(wesley?.trajetoFormatado).toBe('Ida: Pça. Matriz → UFC | Volta: ← Católica');

      const botaoImprimir = encontrarBotaoPorTestId(root, 'botao-imprimir-lista');
      expect(botaoImprimir.props.disabled).toBe(false);

      await pressionar(botaoImprimir);
      expect(mockImprimir).toHaveBeenCalledTimes(1);
      expect(mockImprimir).toHaveBeenCalledWith(
        expect.objectContaining({
          rotaId: 1,
          rotaNome: 'Linha 01 - Centro',
          totalAlunos: 38,
        }),
        {
          perfil: 'ADMINISTRADOR',
          nomeEmissor: 'Administrador Padrao',
        },
      );
    });
  });

  describe('FA-002 - Rota sem alunos alocados (52.2)', () => {
    it('exibe mensagem da API e mantém botão "Imprimir lista" desabilitado', async () => {
      const root = await renderizar(<AdminListaEmbarqueScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'seletor-rota'));
      await pressionar(encontrarBotaoPorTestId(root, 'opcao-rota-2'));

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'mensagem-lista-vazia'))).toBe(
        'Essa rota não possui nenhum aluno alocado para este dia.',
      );

      const botaoImprimir = encontrarBotaoPorTestId(root, 'botao-imprimir-lista');
      expect(botaoImprimir.props.disabled).toBe(true);
    });
  });

  describe('FA-001 - Acesso direto por rota fixa e visão do Representante (52.3)', () => {
    it('abre rota fixa sem seletor quando acessada com rotaId e modoFixo=true e respeita ação de voltar', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeUndefined();
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'titulo-rota-fixa'))).toBe(
        'Linha 01 - Centro',
      );

      const subtitulo = lerTextoNode(encontrarTextoPorTestId(root, 'subtitulo-data-embarque'));
      expect(subtitulo).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados',
      );

      const botaoVoltar = encontrarBotaoPorTestId(root, 'botao-voltar-embarque');
      await pressionar(botaoVoltar);
      expect(mockRouterBack).toHaveBeenCalledTimes(1);

      mockRouterCanGoBack.mockReturnValue(false);
      await pressionar(botaoVoltar);
      expect(mockRouterReplace).toHaveBeenCalledWith('/(administrador)/(tabs)/logistica');
    });

    it('usa autodescoberta do backend na visão do Representante sem chamar /rotas-do-dia inicialmente', async () => {
      mockUser = {
        id: 10,
        name: 'Carlos Representante',
        role: 'MOTORISTA',
        faculdade: 1,
      };

      const alunosUfc = criarAlunosApiFixture(38).filter(
        (aluno) => aluno.ies_ida?.sigla === 'UFC' || aluno.ies_volta?.sigla === 'UFC',
      );
      mockApiGet.mockResolvedValueOnce({
        data: criarRespostaListaApi({ alunos: alunosUfc }),
      } as any);

      const root = await renderizar(<RepresentativeHomeScreen />);

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque', {
        params: { data: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) },
      });

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeUndefined();
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'titulo-rota-fixa'))).toBe(
        'Linha 01 - Centro',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        `${alunosUfc.length} alunos alocados`,
      );

      await pressionar(encontrarBotaoPorTestId(root, 'botao-imprimir-lista'));
      expect(mockImprimir).toHaveBeenCalledWith(
        expect.objectContaining({
          rotaId: 1,
          totalAlunos: alunosUfc.length,
        }),
        {
          perfil: 'MOTORISTA',
          nomeEmissor: 'Carlos Representante',
        },
      );
    });

    it('exibe seletor de rotas ao Representante quando a API retornar 422 MULTIPLAS_ROTAS', async () => {
      mockUser = {
        id: 10,
        name: 'Carlos Representante',
        role: 'MOTORISTA',
        faculdade: 1,
      };

      mockApiGet
        .mockRejectedValueOnce({
          response: {
            status: 422,
            data: {
              detail: {
                code: 'MULTIPLAS_ROTAS',
                message: 'Múltiplas rotas disponíveis. Especifique rota_id.',
                rotas_disponiveis: [
                  { rota_id: 1, nome_rota: 'Linha 01 - Centro', horario_saida: '06:40' },
                  { rota_id: 3, nome_rota: 'Linha 03 - Serrinha', horario_saida: '07:10' },
                ],
              },
            },
          },
        } as any)
        .mockResolvedValueOnce({
          data: {
            data: '2026-11-20',
            rotas: [
              { rota_id: 1, nome_rota: 'Linha 01 - Centro', horario_saida: '06:40' },
              { rota_id: 3, nome_rota: 'Linha 03 - Serrinha', horario_saida: '07:10' },
            ],
          },
        } as any)
        .mockResolvedValueOnce({
          data: criarRespostaListaApi({
            rota_id: 3,
            nome_rota: 'Linha 03 - Serrinha',
            alunos: [criarAlunosApiFixture(38)[0]],
            total_alunos_alocados: 1,
          }),
        } as any);

      const root = await renderizar(<RepresentativeHomeScreen />);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeDefined();
      await pressionar(encontrarBotaoPorTestId(root, 'seletor-rota'));
      await pressionar(encontrarBotaoPorTestId(root, 'opcao-rota-3'));

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '1 aluno alocado',
      );
    });
  });

  describe('FA-003 - Atualização periódica via polling', () => {
    it('recalcula o total de alunos e atualiza o indicador após novo polling da API', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-11-20T09:30:00.000Z'));

      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const alunosIniciais = criarAlunosApiFixture(38);
      const alunosAtualizados = alunosIniciais.slice(0, 37);

      mockApiGet
        .mockResolvedValueOnce({
          data: criarRespostaListaApi({
            alunos: alunosIniciais,
            ultima_sincronizacao: '2026-11-20T09:29:00.000Z',
          }),
        } as any)
        .mockResolvedValueOnce({
          data: criarRespostaListaApi({
            alunos: alunosAtualizados,
            total_alunos_alocados: 37,
            ultima_sincronizacao: '2026-11-20T09:30:30.000Z',
          }),
        } as any);

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'indicador-sincronizacao'))).toBe(
        'Atualizado há 1 min',
      );

      await renderer.act(async () => {
        await jest.advanceTimersByTimeAsync(INTERVALO_POLLING_LISTA_MS);
      });
      await flushAsync();

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '37 alunos alocados',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'indicador-sincronizacao'))).toBe(
        'Atualizado agora',
      );
    });
  });
});
