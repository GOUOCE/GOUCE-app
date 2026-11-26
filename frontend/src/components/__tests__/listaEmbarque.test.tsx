import React from 'react';
import { FlatList, Modal, Text, TextInput, TouchableOpacity } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { api } from '@/api/api';
import { userService } from '@/services/userService';
import AdminListaEmbarqueScreen from '../../app/(administrador)/logistica/embarque';
import StudentPerfilScreen from '../../app/(aluno)/(tabs)/perfil';
import RepresentativeHomeScreen from '../../app/(representante)/home';
import RepresentativePerfilScreen from '../../app/(representante)/perfil';
import RepresentativeRotaScreen from '../../app/(representante)/rota';
import {
  INTERVALO_POLLING_LISTA_MS,
  listaEmbarqueService,
  type AlunoListaEmbarqueApiDTO,
  type ListaEmbarqueApiResponse,
} from '../../services/listaEmbarqueService';
import { imprimirListaEmbarque } from '@/utils/impressaoListaEmbarque';

const renderer = jest.requireActual<any>('react-test-renderer');
const mockAsyncStore = new Map<string, string>();

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);
const mockUpdateUser = jest.fn(async () => undefined);
const mockSwitchRole = jest.fn(async () => undefined);
const mockSignOut = jest.fn(async () => undefined);

let mockSearchParams: {
  rotaId?: string;
  rotaNome?: string;
  modoFixo?: string;
  dataIso?: string;
} = {};
let mockUser: {
  id: number | string;
  name: string;
  email?: string;
  role: string;
  roles?: string[];
  faculdade?: number | string;
  telefone?: string;
  curso?: string;
  periodo_ingresso?: string;
  turno?: string;
  status?: string;
  foto_perfil?: string;
} | null = {
  id: 1,
  name: 'Administrador Padrao',
  role: 'ADMINISTRADOR',
};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    replace: mockRouterReplace,
    canGoBack: mockRouterCanGoBack,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockAsyncStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockAsyncStore.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockAsyncStore.delete(key);
  }),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'token-mock',
    updateUser: mockUpdateUser,
    switchRole: mockSwitchRole,
    signOut: mockSignOut,
  }),
}));

jest.mock(
  '@contexts/AuthContext',
  () => ({
    useAuth: () => ({
      user: mockUser,
      token: 'token-mock',
      updateUser: mockUpdateUser,
      switchRole: mockSwitchRole,
      signOut: mockSignOut,
    }),
  }),
  { virtual: true },
);

jest.mock('react-native-paper', () => {
  const RN = jest.requireActual<any>('react-native');
  return {
    Text: RN.Text,
    Surface: RN.View,
    Divider: RN.View,
    useTheme: () => ({ colors: { primary: '#3E5F90' } }),
    Avatar: {
      Image: 'AvatarImage',
      Text: 'AvatarText',
    },
  };
});

jest.mock('@/components/ui/AppPopup', () => ({
  AppPopup: 'AppPopup',
}));

jest.mock('@/services/userService', () => ({
  userService: {
    getProfile: jest.fn(),
  },
}));

jest.mock('lucide-react-native', () => ({
  AlertCircle: 'AlertCircle',
  ArrowLeft: 'ArrowLeft',
  ArrowLeftRight: 'ArrowLeftRight',
  CalendarX2: 'CalendarX2',
  Check: 'Check',
  ChevronDown: 'ChevronDown',
  ChevronRight: 'ChevronRight',
  ChevronUp: 'ChevronUp',
  ClipboardCheck: 'ClipboardCheck',
  CreditCard: 'CreditCard',
  LogOut: 'LogOut',
  Mail: 'Mail',
  Pencil: 'Pencil',
  Printer: 'Printer',
  RefreshCw: 'RefreshCw',
  Route: 'Route',
  Search: 'Search',
  X: 'X',
}));

jest.mock('@/utils/impressaoListaEmbarque', () => ({
  imprimirListaEmbarque: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/api/api', () => ({
  api: {
    defaults: { baseURL: 'http://localhost:8000' },
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;
const mockApiPatch = api.patch as jest.MockedFunction<typeof api.patch>;
const mockImprimir = imprimirListaEmbarque as jest.MockedFunction<typeof imprimirListaEmbarque>;
const mockGetProfile = userService.getProfile as jest.MockedFunction<typeof userService.getProfile>;

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
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAsyncStore.clear();
    await listaEmbarqueService.limparCacheFrequencia();
    mockApiPatch.mockResolvedValue({ data: { ok: true } } as any);
    mockGetProfile.mockResolvedValue(null as any);
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
        const dataConsulta = config?.params?.data ?? '2026-11-20';
        if (rotaId === 2) {
          return {
            data: criarRespostaListaApi({
              data: dataConsulta,
              rota_id: 2,
              nome_rota: 'Linha 02 - Bairro Novo',
              alunos: [],
              total_alunos_alocados: 0,
            }),
          } as any;
        }
        return { data: criarRespostaListaApi({ data: dataConsulta }) } as any;
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

    it('abre rota fixa com dataIso e rotaNome vindos da distribuição logística sem dropdown no topo', async () => {
      mockSearchParams = {
        rotaId: '1',
        rotaNome: 'Linha 01 - Centro',
        modoFixo: 'true',
        dataIso: '2026-11-26',
      };
      mockApiGet.mockResolvedValueOnce({
        data: criarRespostaListaApi({ data: '2026-11-26' }),
      } as any);

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeUndefined();
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'titulo-rota-fixa'))).toBe(
        'Linha 01 - Centro',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'subtitulo-data-embarque'))).toBe(
        '26/11/2026',
      );
      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque', {
        params: { data: '2026-11-26', rota_id: 1 },
      });
      expect(mockApiGet).not.toHaveBeenCalledWith(
        '/alocacao-diaria/rotas-do-dia',
        expect.anything(),
      );
    });

    it('oculta seletor quando rotaId predefinido é informado mesmo sem modoFixo explícito', async () => {
      mockSearchParams = { rotaId: '1' };

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeUndefined();
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'titulo-rota-fixa'))).toBe(
        'Linha 01 - Centro',
      );
      expect(mockApiGet).not.toHaveBeenCalledWith(
        '/alocacao-diaria/rotas-do-dia',
        expect.anything(),
      );
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

  describe('HU-021 - Registro de Embarque e Frequência', () => {
    it('inicia chamada neutra (Pendentes), registra Presente/Falta e atualiza contadores em tempo real', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
        'Presentes: 0',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-faltas'))).toBe('Faltas: 0');
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-pendentes'))).toBe(
        'Pendentes: 38',
      );

      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-presente-1'));
      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-falta-2'));

      expect(mockApiPatch).toHaveBeenCalledTimes(2);
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
        'Presentes: 1',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-faltas'))).toBe('Faltas: 1');
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-pendentes'))).toBe(
        'Pendentes: 36',
      );
    });

    it('filtra alunos pela barra de busca "Buscar aluno"', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };
      const root = await renderizar(<AdminListaEmbarqueScreen />);

      const inputBusca = root.root.findByType(TextInput);
      expect(inputBusca.props.testID).toBe('input-buscar-aluno-embarque');

      await renderer.act(async () => {
        inputBusca.props.onChangeText('Bruno');
      });

      const filtrados = root.root.findByType(FlatList).props.data;
      expect(filtrados).toHaveLength(1);
      expect(filtrados[0].nome).toBe('Bruno Costa');
    });

    it('bloqueia check-in e exibe aviso somente leitura para datas passadas/futuras (RN-014 / FA-001)', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 12, 0, 0));
      mockSearchParams = {
        rotaId: '1',
        rotaNome: 'Linha 01 - Centro',
        modoFixo: 'true',
        dataIso: '2026-08-31',
      };
      mockApiGet.mockResolvedValueOnce({
        data: criarRespostaListaApi({ data: '2026-08-31' }),
      } as any);

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(
        root.root.findAll((node: any) => node.props?.testID === 'banner-somente-leitura-chamada')
          .length,
      ).toBeGreaterThan(0);
      expect(extrairTodosTextos(root)).toContain(
        'Modo somente leitura - a chamada só pode ser realizada no dia exato da viagem.',
      );
      expect(extrairTodosTextos(root)).not.toContain('RN-014');
      expect(encontrarTextoPorTestId(root, 'indicador-sincronizacao')).toBeUndefined();

      const botaoPresente = encontrarBotaoPorTestId(root, 'botao-presenca-presente-1');
      expect(botaoPresente.props.disabled).toBe(true);

      await pressionar(botaoPresente);
      expect(mockApiPatch).not.toHaveBeenCalled();
    });

    it('salva chamada offline e exibe banner de sincronização pendente até envio em segundo plano (FA-003)', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 12, 0, 0));
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      mockApiPatch.mockRejectedValueOnce(new Error('Network Error'));

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-presente-1'));

      expect(
        root.root.findAll((node: any) => node.props?.testID === 'banner-sincronizacao-pendente')
          .length,
      ).toBeGreaterThan(0);
      expect(extrairTodosTextos(root)).toContain('Sem conexão - sincronização pendente');
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
        'Presentes: 1',
      );

      mockApiPatch.mockResolvedValueOnce({ data: { ok: true } } as any);
      await renderer.act(async () => {
        await jest.advanceTimersByTimeAsync(INTERVALO_POLLING_LISTA_MS);
      });
      await flushAsync();

      expect(
        root.root.findAll((node: any) => node.props?.testID === 'banner-sincronizacao-pendente'),
      ).toHaveLength(0);
    });

    it('exibe mensagem padrão quando não há registros de viagens na data selecionada (CA-04 / FA-004)', async () => {
      mockSearchParams = { dataIso: '2026-11-22' };
      mockApiGet.mockResolvedValueOnce({
        data: { data: '2026-11-22', rotas: [] },
      } as any);

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'mensagem-sem-viagens-data'))).toBe(
        'Não há registros de viagens ou agendamentos para a data selecionada.',
      );
    });

    it('renderiza tela Rota do Dia do Representante com atalho para a chamada (Tela 55)', async () => {
      mockUser = {
        id: 10,
        name: 'Ana Beatriz',
        role: 'MOTORISTA',
        faculdade: 1,
      };
      mockApiGet.mockResolvedValueOnce({
        data: criarRespostaListaApi({
          veiculos_escalados: [
            {
              alocacao_id: 1,
              turno: 'ida',
              onibus_placa: 'OCR-5521',
              motorista_nome: 'Carlos',
              total_sentados: 18,
              total_em_pe: 0,
            },
          ],
          total_alunos_alocados: 18,
          alunos: criarAlunosApiFixture(18),
        }),
      } as any);

      const rootComRota = await renderizar(<RepresentativeRotaScreen />);

      expect(lerTextoNode(encontrarTextoPorTestId(rootComRota, 'titulo-onibus-rota-hoje'))).toBe(
        'Ônibus • Placa OCR-5521',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(rootComRota, 'horario-saida-rota-hoje'))).toBe(
        '06:40',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(rootComRota, 'horario-retorno-rota-hoje'))).toBe(
        '17:00',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(rootComRota, 'ies-responsavel-rota-hoje'))).toBe(
        'UFC',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(rootComRota, 'chip-alunos-alocados-rota'))).toBe(
        '18 alunos alocados',
      );

      await pressionar(
        encontrarBotaoPorTestId(rootComRota, 'botao-ver-lista-embarque-frequencia'),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/(representante)/home');
    });

    it('exibe estado Sem Viagens na tela Rota do Dia do Representante quando não há rota no dia (Tela 56)', async () => {
      mockUser = {
        id: 10,
        name: 'Ana Beatriz',
        role: 'MOTORISTA',
        faculdade: 1,
      };
      mockApiGet.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { detail: { code: 'SEM_ROTA_NO_DIA' } },
        },
      } as any);

      const rootSemRota = await renderizar(<RepresentativeRotaScreen />);
      expect(
        lerTextoNode(encontrarTextoPorTestId(rootSemRota, 'mensagem-sem-viagens-representante')),
      ).toBe('Não há registros de viagens ou agendamentos para a data selecionada.');
    });

    it('faz rollback na UI e exibe mensagem do backend em erros 403/422 no PATCH', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      mockApiPatch.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            success: false,
            error: {
              code: 'LISTA_EMBARQUE_ERRO',
              message: 'Aluno inativo não pode receber frequência.',
            },
          },
        },
      });

      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-presente-1'));

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
        'Presentes: 0',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-pendentes'))).toBe(
        'Pendentes: 38',
      );
      expect(extrairTodosTextos(root)).toContain('Aluno inativo não pode receber frequência.');

      mockApiPatch.mockRejectedValueOnce({
        response: {
          status: 403,
          data: { detail: 'Somente o representante responsável pode registrar presença.' },
        },
      });

      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-falta-1'));
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-faltas'))).toBe('Faltas: 0');
      expect(extrairTodosTextos(root)).toContain(
        'Somente o representante responsável pode registrar presença.',
      );
    });

    it('não dispara PATCH redundante ao clicar novamente no status já marcado', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-presente-1'));
      expect(mockApiPatch).toHaveBeenCalledTimes(1);

      await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-presente-1'));
      expect(mockApiPatch).toHaveBeenCalledTimes(1);
    });

    it('respeita somente_leitura: true retornado pelo backend bloqueando os botões de presença', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };
      mockApiGet.mockResolvedValueOnce({
        data: criarRespostaListaApi({ somente_leitura: true }),
      } as any);

      const root = await renderizar(<AdminListaEmbarqueScreen />);

      expect(
        root.root.findAll((node: any) => node.props?.testID === 'banner-somente-leitura-chamada')
          .length,
      ).toBeGreaterThan(0);
      const botaoPresente = encontrarBotaoPorTestId(root, 'botao-presenca-presente-1');
      expect(botaoPresente.props.disabled).toBe(true);

      await pressionar(botaoPresente);
      expect(mockApiPatch).not.toHaveBeenCalled();
    });

    it('sincroniza fila pendente imediatamente ao receber evento online na janela sem aguardar polling', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 12, 0, 0));
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
      const listeners = new Map<string, Set<() => void>>();
      (globalThis as { window?: unknown }).window = {
        addEventListener: jest.fn((event: string, cb: () => void) => {
          if (!listeners.has(event)) {
            listeners.set(event, new Set());
          }
          listeners.get(event)!.add(cb);
        }),
        removeEventListener: jest.fn((event: string, cb: () => void) => {
          listeners.get(event)?.delete(cb);
        }),
      };

      try {
        mockApiPatch.mockRejectedValueOnce(new Error('Network Error'));
        const root = await renderizar(<AdminListaEmbarqueScreen />);

        await pressionar(encontrarBotaoPorTestId(root, 'botao-presenca-presente-1'));
        expect(
          root.root.findAll((node: any) => node.props?.testID === 'banner-sincronizacao-pendente')
            .length,
        ).toBeGreaterThan(0);

        mockApiPatch.mockResolvedValueOnce({ data: { status_presenca: 'PRESENTE' } } as any);
        mockApiGet.mockResolvedValueOnce({
          data: criarRespostaListaApi({
            data: '2026-11-21',
            total_presentes: 1,
            total_faltas: 0,
            total_pendentes: 37,
            alunos: [
              { ...criarAlunosApiFixture(38)[0], status_presenca: 'PRESENTE' },
              ...criarAlunosApiFixture(38).slice(1),
            ],
          }),
        } as any);

        await renderer.act(async () => {
          for (const cb of listeners.get('online') ?? []) {
            cb();
          }
          await Promise.resolve();
        });
        await flushAsync();

        expect(mockApiPatch).toHaveBeenCalledTimes(2);
        expect(
          root.root.findAll((node: any) => node.props?.testID === 'banner-sincronizacao-pendente'),
        ).toHaveLength(0);
      } finally {
        if (windowDescriptor) {
          Object.defineProperty(globalThis, 'window', windowDescriptor);
        } else {
          delete (globalThis as { window?: unknown }).window;
        }
      }
    });

    it('atualiza chamada automaticamente via polling e foco de janela sem recarregar a página', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 26, 12, 0, 0));
      mockUser = {
        id: 11,
        name: 'Juliana Mendes',
        role: 'MOTORISTA',
        faculdade: 1,
      };

      const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
      const listeners = new Map<string, Set<() => void>>();
      (globalThis as { window?: unknown }).window = {
        addEventListener: jest.fn((event: string, cb: () => void) => {
          if (!listeners.has(event)) {
            listeners.set(event, new Set());
          }
          listeners.get(event)!.add(cb);
        }),
        removeEventListener: jest.fn((event: string, cb: () => void) => {
          listeners.get(event)?.delete(cb);
        }),
      };

      try {
        const alunosBase = criarAlunosApiFixture(38);
        mockApiGet
          .mockResolvedValueOnce({
            data: criarRespostaListaApi({ data: '2026-11-26', alunos: alunosBase }),
          } as any)
          .mockResolvedValueOnce({
            data: criarRespostaListaApi({
              data: '2026-11-26',
              total_presentes: 1,
              total_faltas: 0,
              total_pendentes: 37,
              alunos: [
                { ...alunosBase[0], status_presenca: 'PRESENTE' },
                ...alunosBase.slice(1),
              ],
            }),
          } as any)
          .mockResolvedValueOnce({
            data: criarRespostaListaApi({
              data: '2026-11-26',
              total_presentes: 0,
              total_faltas: 1,
              total_pendentes: 37,
              alunos: [
                { ...alunosBase[0], status_presenca: 'FALTA' },
                ...alunosBase.slice(1),
              ],
            }),
          } as any);

        const root = await renderizar(<RepresentativeHomeScreen />);
        expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
          'Presentes: 0',
        );

        await renderer.act(async () => {
          await jest.advanceTimersByTimeAsync(INTERVALO_POLLING_LISTA_MS);
        });
        await flushAsync();

        expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
          'Presentes: 1',
        );
        expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-pendentes'))).toBe(
          'Pendentes: 37',
        );

        await renderer.act(async () => {
          for (const cb of listeners.get('focus') ?? []) {
            cb();
          }
          await Promise.resolve();
        });
        await flushAsync();

        expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-presentes'))).toBe(
          'Presentes: 0',
        );
        expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-faltas'))).toBe('Faltas: 1');
      } finally {
        if (windowDescriptor) {
          Object.defineProperty(globalThis, 'window', windowDescriptor);
        } else {
          delete (globalThis as { window?: unknown }).window;
        }
      }
    });
  });

  describe('[Geral] 59 - Perfil de Representante', () => {
    it('exibe dados de vínculo estudantil do representante e sincroniza com /usuarios/me', async () => {
      mockUser = {
        id: 10,
        name: 'Ana Beatriz',
        email: 'ana@email.com',
        telefone: '88988887777',
        faculdade: 'UFC - Campus Quixadá',
        curso: 'Inteligência Artificial',
        periodo_ingresso: '2026.1',
        turno: 'Noturno',
        status: 'ativado',
        role: 'MOTORISTA',
      };
      mockGetProfile.mockResolvedValueOnce({
        nome: 'Ana Beatriz',
        email: 'ana@email.com',
        telefone: '88988887777',
        sigla_faculdade: 'UFC',
        campus: 'Quixadá',
        curso: 'Inteligência Artificial',
        periodo_ingresso: '2026.1',
        turno_curso: 'Noturno',
        status_cadastro: 'ativado',
      });

      const root = await renderizar(<RepresentativePerfilScreen />);

      expect(mockGetProfile).toHaveBeenCalledTimes(1);
      expect(mockUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Ana Beatriz',
          faculdade: 'UFC - Quixadá',
          curso: 'Inteligência Artificial',
          periodo_ingresso: '2026.1',
          turno: 'Noturno',
        }),
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'nome-perfil-representante'))).toBe(
        'Ana Beatriz',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'badge-status-representante'))).toBe(
        'Aprovado',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'perfil-rep-email'))).toBe(
        'ana@email.com',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'perfil-rep-telefone'))).toBe(
        '(88) 9 8888-7777',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'perfil-rep-instituicao'))).toBe(
        'UFC - Campus Quixadá',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'perfil-rep-curso'))).toBe(
        'Inteligência Artificial',
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'perfil-rep-periodo'))).toBe('2026.1');
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'perfil-rep-turno'))).toBe('Noturno');
    });

    it('abre modal "Trocar visão?" e alterna para a visão de aluno ao confirmar', async () => {
      mockUser = {
        id: 10,
        name: 'Ana Beatriz',
        email: 'ana@email.com',
        role: 'MOTORISTA',
        status: 'ativado',
      };

      const root = await renderizar(<RepresentativePerfilScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'botao-trocar-visao-aluno'));
      expect(extrairTodosTextos(root)).toContain('Trocar visão?');
      expect(extrairTodosTextos(root)).toContain(
        'Tem certeza de que quer trocar a visão do aplicativo para sua conta de aluno?',
      );

      await pressionar(encontrarBotaoPorTestId(root, 'botao-cancelar-troca-visao'));
      expect(mockSwitchRole).not.toHaveBeenCalled();

      await pressionar(encontrarBotaoPorTestId(root, 'botao-trocar-visao-aluno'));
      await pressionar(encontrarBotaoPorTestId(root, 'botao-confirmar-troca-visao'));
      expect(mockSwitchRole).toHaveBeenCalledWith('ALUNO', 'Visão trocada para perfil de aluno');
    });

    it('abre modal "Sair da conta?" e encerra sessão ao confirmar saída', async () => {
      mockUser = {
        id: 10,
        name: 'Ana Beatriz',
        email: 'ana@email.com',
        role: 'MOTORISTA',
        status: 'ativado',
      };

      const root = await renderizar(<RepresentativePerfilScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'botao-sair-conta-representante'));
      expect(extrairTodosTextos(root)).toContain('Sair da conta?');
      expect(extrairTodosTextos(root)).toContain(
        'Você precisará fazer login novamente para registrar as chamadas.',
      );

      await pressionar(encontrarBotaoPorTestId(root, 'botao-cancelar-sair-representante'));
      expect(mockSignOut).not.toHaveBeenCalled();

      await pressionar(encontrarBotaoPorTestId(root, 'botao-sair-conta-representante'));
      await pressionar(encontrarBotaoPorTestId(root, 'botao-confirmar-sair-representante'));
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Troca de visão bidirecional no Perfil do Aluno', () => {
    it('exibe botão "Trocar para a visão de representante" apenas quando aluno também é representante e confirma troca', async () => {
      mockUser = {
        id: 10,
        name: 'Juliana Mendes',
        email: 'representante@gouce.app',
        role: 'ALUNO',
        roles: ['MOTORISTA', 'ALUNO'],
        status: 'ativado',
      };

      const rootRepresentante = await renderizar(<StudentPerfilScreen />);
      const botaoTrocar = encontrarBotaoPorTestId(
        rootRepresentante,
        'botao-trocar-visao-representante',
      );
      expect(botaoTrocar).toBeDefined();

      const textosPerfil = extrairTodosTextos(rootRepresentante);
      const idxTrocar = textosPerfil.indexOf('Trocar para a visão de representante');
      const idxAcoes = textosPerfil.indexOf('Ações da Conta');
      const idxEditar = textosPerfil.indexOf('Editar perfil');
      expect(idxTrocar).toBeGreaterThan(-1);
      expect(idxAcoes).toBeGreaterThan(idxTrocar);
      expect(idxEditar).toBeGreaterThan(idxTrocar);

      await pressionar(botaoTrocar);
      expect(extrairTodosTextos(rootRepresentante)).toContain('Trocar visão?');
      expect(extrairTodosTextos(rootRepresentante)).toContain(
        'Tem certeza de que quer trocar a visão do aplicativo para sua conta de representante?',
      );

      await pressionar(
        encontrarBotaoPorTestId(rootRepresentante, 'botao-confirmar-troca-visao-representante'),
      );
      expect(mockSwitchRole).toHaveBeenCalledWith(
        'MOTORISTA',
        'Visão trocada para perfil de representante',
      );

      mockUser = {
        id: 20,
        name: 'Aluno Comum',
        email: 'aluno@gouce.app',
        role: 'ALUNO',
        roles: ['ALUNO'],
        status: 'ativado',
      };
      const rootAlunoComum = await renderizar(<StudentPerfilScreen />);
      expect(
        encontrarBotaoPorTestId(rootAlunoComum, 'botao-trocar-visao-representante'),
      ).toBeUndefined();
    });
  });
});
