import React from 'react';
import { TouchableOpacity } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import DistribicaoLogisticaScreen from '../../app/(administrador)/logistica/distribuicao';
import {
  logisticaService,
  type LinhaDistribuicao,
  type PreviaDistribuicao,
} from '@/services/logisticaService';

const renderer = jest.requireActual<any>('react-test-renderer');

const mockRouterPush = jest.fn();
const mockRouterBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
  }),
  useFocusEffect: (effect: () => void) =>
    jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));

jest.mock('react-native-paper', () => ({
  Text: (props: any) => jest.requireActual<typeof React>('react').createElement('Text', props),
  Surface: (props: any) =>
    jest.requireActual<typeof React>('react').createElement('View', props),
  Button: (props: any) =>
    jest.requireActual<typeof React>('react').createElement('Button', props),
}));

jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  Pencil: 'Pencil',
  ClipboardList: 'ClipboardList',
  Users: 'Users',
  User: 'User',
  Bus: 'Bus',
  CheckCircle2: 'CheckCircle2',
}));

jest.mock('@/components/ui/AppPopup', () => ({
  AppPopup: (props: any) =>
    jest.requireActual<typeof React>('react').createElement('AppPopup', props),
}));

jest.mock('@/services/logisticaService', () => ({
  logisticaService: {
    obterPainelDistribuicao: jest.fn(),
    confirmarDistribuicao: jest.fn(),
  },
}));

const mockObterPainel =
  logisticaService.obterPainelDistribuicao as jest.MockedFunction<
    typeof logisticaService.obterPainelDistribuicao
  >;

const LINHAS_MOCK: LinhaDistribuicao[] = [
  {
    id: 1,
    nomeLinha: 'Linha 01 - Centro',
    horarioSaida: '06:40',
    horarioVolta: '17:00',
    faculdades: ['UFC'],
    status: 'alocada',
    alunosAgendados: 38,
    alunosSentados: 38,
    alunosEmPe: 0,
    capacidadeSentados: 40,
    capacidadeEmPe: 10,
    excedentes: 0,
    motoristaId: 10,
    motoristaNome: 'Carlos Silva',
    onibusId: 'ABC1234',
    onibusApelido: 'Ônibus 01',
  },
  {
    id: 2,
    nomeLinha: 'Linha 02 - Bairro Novo',
    horarioSaida: '07:00',
    horarioVolta: '17:30',
    faculdades: ['IFCE'],
    status: 'superlotada',
    alunosAgendados: 15,
    alunosSentados: 10,
    alunosEmPe: 2,
    capacidadeSentados: 10,
    capacidadeEmPe: 2,
    excedentes: 3,
    motoristaId: 11,
    motoristaNome: 'Pedro Souza',
    onibusId: 'DEF5678',
    onibusApelido: 'Ônibus 02',
  },
];

let rootAtual: any = null;

function criarPainelMock(dataIso: string): {
  preview: PreviaDistribuicao;
  linhas: LinhaDistribuicao[];
} {
  return {
    preview: {
      data: dataIso,
      demanda_por_rota: [],
      alocacoes: [],
      excedentes_globais: [],
      alertas: [],
      status_logistico: 'PENDENTE',
      distribuicao_persistida: false,
    },
    linhas: LINHAS_MOCK,
  };
}

function encontrarBotaoPorTestId(root: any, testID: string) {
  return root.root
    .findAllByType(TouchableOpacity)
    .find((node: any) => node.props.testID === testID);
}

function encontrarAbaPorTexto(root: any, texto: string) {
  return root.root.findAllByType(TouchableOpacity).find((node: any) => {
    const textos = node.findAllByType('Text');
    return textos.some((t: any) => t.children?.join('') === texto);
  });
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

describe('Distribuição Logística — Botão de Lista de Embarque nos cards (HU-018)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 26, 12, 0, 0));

    mockObterPainel.mockImplementation(async (dataIso: string) => criarPainelMock(dataIso));
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

  it('exibe o botão Lista de embarque em todos os cards e navega com modoFixo e dataIso da rota selecionada', async () => {
    const root = await renderizar(<DistribicaoLogisticaScreen />);

    const botaoLinha1 = encontrarBotaoPorTestId(root, 'botao-lista-embarque-1');
    const botaoLinha2 = encontrarBotaoPorTestId(root, 'botao-lista-embarque-2');
    expect(botaoLinha1).toBeDefined();
    expect(botaoLinha2).toBeDefined();

    await renderer.act(async () => {
      botaoLinha1.props.onPress();
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/(administrador)/logistica/embarque',
      params: {
        rotaId: '1',
        rotaNome: 'Linha 01 - Centro',
        modoFixo: 'true',
        dataIso: '2026-11-26',
      },
    });
  });

  it('mantém o botão Lista de embarque visível na aba Histórico (somente leitura) com os parâmetros da data histórica', async () => {
    const root = await renderizar(<DistribicaoLogisticaScreen />);

    const abaHistorico = encontrarAbaPorTexto(root, 'Histórico');
    expect(abaHistorico).toBeDefined();

    await renderer.act(async () => {
      abaHistorico.props.onPress();
    });
    await flushAsync();

    expect(encontrarBotaoPorTestId(root, 'botao-alocar-1')).toBeUndefined();
    expect(root.root.findAllByType('Button')).toHaveLength(0);

    const botaoEmbarqueHistorico = encontrarBotaoPorTestId(root, 'botao-lista-embarque-1');
    expect(botaoEmbarqueHistorico).toBeDefined();

    await renderer.act(async () => {
      botaoEmbarqueHistorico.props.onPress();
    });

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/(administrador)/logistica/embarque',
      params: {
        rotaId: '1',
        rotaNome: 'Linha 01 - Centro',
        modoFixo: 'true',
        dataIso: '2026-11-19',
      },
    });
  });
});
