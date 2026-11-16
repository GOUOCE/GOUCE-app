import React from 'react';
import { TouchableOpacity } from 'react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import AgendamentoDetalhesScreen from '../../app/(aluno)/agendamento-detalhes';
import StudentHomeScreen from '../../app/(aluno)/(tabs)/home';
import MeusAgendamentosScreen from '../../app/(aluno)/(tabs)/agenda';
import {
  agendamentoService,
  AgendamentoDetalhe,
  mapearDetalhe,
} from '../../services/agendamentoService';

const renderer = jest.requireActual<any>('react-test-renderer');

let mockSearchParams: { dataIso?: string } = { dataIso: '2026-08-31' };
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockCanGoBack = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (effect: () => void) =>
    jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));

jest.mock('react-native-paper', () => ({
  Text: 'Text',
  Surface: 'Surface',
  ActivityIndicator: 'ActivityIndicator',
  Button: 'Button',
}));

jest.mock('lucide-react-native', () => ({
  AlertTriangle: 'AlertTriangle',
  ChevronLeft: 'ChevronLeft',
  ChevronRight: 'ChevronRight',
  Pencil: 'Pencil',
  Trash2: 'Trash2',
  WifiOff: 'WifiOff',
  CalendarPlus: 'CalendarPlus',
  ClipboardList: 'ClipboardList',
  Megaphone: 'Megaphone',
  Contact: 'Contact',
}));

jest.mock(
  '@contexts/AuthContext',
  () => ({
    useAuth: () => ({ user: { name: 'Lucas Andrade' } }),
  }),
  { virtual: true },
);

jest.mock('@/components/dashboard/QuickAction', () => ({
  QuickAction: 'QuickAction',
}));

jest.mock('@/components/ui/AppPopup', () => ({
  AppPopup: 'Popup',
}));

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

function dataLocalHojeIso(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
    hoje.getDate(),
  ).padStart(2, '0')}`;
}

function criarDetalheFixture(
  override: Partial<AgendamentoDetalhe> = {},
): AgendamentoDetalhe {
  const faculdades = [
    { id: 1, nome: 'Universidade Federal do Ceará' },
    { id: 2, nome: 'Centro Universitário Católica de Quixadá' },
    { id: 3, nome: 'FECLESC / Universidade Estadual do Ceará' },
  ];

  return {
    id: 10,
    aluno_id: 5,
    data: '2026-08-31',
    usa_ida: true,
    usa_volta: true,
    ponto_embarque_id: 1,
    ies_destino_id: 1,
    rota_complementar_ida_id: 1,
    ies_origem_id: 1,
    ponto_desembarque_id: 1,
    rota_complementar_volta_id: 1,
    status: 'ATIVO',
    ponto_embarque_nome: 'Bairro Novo',
    ies_destino_nome: 'UFC',
    rota_complementar_ida_nome: 'Van 2 - Bairro Novo',
    ies_origem_nome: 'UFC',
    ponto_desembarque_nome: 'Bairro Novo',
    rota_complementar_volta_nome: 'Van 2 - Bairro Novo',
    rota_complementar_ida: {
      id: 1,
      nome: 'Van 2 - Bairro Novo',
      horario_saida: '06:10',
      horario_retorno: '17:30',
      ponto_conexao: 'Trevo do Bairro Novo',
    },
    rota_complementar_volta: {
      id: 1,
      nome: 'Van 2 - Bairro Novo',
      horario_saida: '06:10',
      horario_retorno: '17:30',
      ponto_conexao: 'Trevo do Bairro Novo',
    },
    rota_principal_ida: {
      id: 1,
      nome: 'Linha 01 - Centro',
      horario_saida: '06:40',
      horario_retorno: '17:00',
      faculdades,
      onibus: { apelido_onibus: 'Ônibus 04', placa_onibus: 'OCR-1234' },
      motorista: { nome: 'Ana Souza' },
      status_alocacao: 'CONFIRMADA',
    },
    rota_principal_volta: {
      id: 1,
      nome: 'Linha 01 - Centro',
      horario_saida: '06:40',
      horario_retorno: '17:00',
      faculdades,
      onibus: { apelido_onibus: 'Ônibus 04', placa_onibus: 'OCR-1234' },
      motorista: { nome: 'Ana Souza' },
      status_alocacao: 'CONFIRMADA',
    },
    atualizado_em: '2026-08-31T06:00:00Z',
    pode_remover: true,
    pode_editar: true,
    ...override,
  };
}

function extrairTextos(node: any): string {
  if (node == null) return '';
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  const filhos = Array.isArray(node.children) ? node.children : [];
  return filhos.map((child: any) => extrairTextos(child)).join(' ').replace(/\s+/g, ' ').trim();
}

function textoPorTestId(root: any, testID: string): string {
  const encontrado = root.root
    .findAll((node: any) => typeof node.type === 'string' && node.props?.testID === testID);
  expect(encontrado.length).toBeGreaterThan(0);
  return extrairTextos(encontrado[0]);
}

function existeTestId(root: any, testID: string): boolean {
  return (
    root.root.findAll(
      (node: any) => typeof node.type === 'string' && node.props?.testID === testID,
    ).length > 0
  );
}

function todosTextosTela(root: any): string {
  return root.root
    .findAllByType('Text')
    .map((node: any) => extrairTextos(node))
    .join(' ');
}

describe('Telas da HU-019 — Consulta de Alocação Diária pelo Aluno', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    mockSearchParams = { dataIso: '2026-08-31' };
    mockCanGoBack = true;
  });

  it('Fluxo Principal: exibe veículo, motorista, status confirmado e card enxuto de rota complementar em Minha Viagem', async () => {
    const detalhes = mapearDetalhe(criarDetalheFixture());
    jest.spyOn(agendamentoService, 'obterDetalhesViagem').mockResolvedValueOnce(detalhes);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<AgendamentoDetalhesScreen />);
    });

    expect(textoPorTestId(root, 'veiculo-principal-ida')).toBe('Ônibus 04 - Placa OCR-1234');
    expect(textoPorTestId(root, 'veiculo-principal-volta')).toBe('Ônibus 04 - Placa OCR-1234');
    expect(textoPorTestId(root, 'subtitulo-rota-principal-ida')).toBe(
      'Linha 01 - Centro (UFC, Católica, UECE)',
    );
    expect(textoPorTestId(root, 'motorista-principal-ida')).toBe('Ana Souza');
    expect(textoPorTestId(root, 'status-alocacao-principal-ida')).toBe('Alocação confirmada');
    expect(textoPorTestId(root, 'rota-complementar-nome-ida')).toBe('Van 2 - Bairro Novo');
    expect(textoPorTestId(root, 'rota-complementar-nome-volta')).toBe('Van 2 - Bairro Novo');
    expect(existeTestId(root, 'painel-simulacao-hu019')).toBe(false);

    const textos = todosTextosTela(root);
    expect(textos).toContain('Ponto de Embarque (IES)');
    expect(textos).toContain('06:40');
    expect(textos).toContain('17:00');
    expect(textos).toContain('Trevo do Bairro Novo');

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('FA-001: oculta dados de frota e motorista e exibe "Aguardando alocação do veículo"', async () => {
    const base = criarDetalheFixture();
    const detalheAguardando = mapearDetalhe(
      criarDetalheFixture({
        rota_principal_ida: {
          ...base.rota_principal_ida!,
          onibus: null,
          motorista: null,
          status_alocacao: null,
        },
        rota_principal_volta: {
          ...base.rota_principal_volta!,
          onibus: null,
          motorista: null,
          status_alocacao: 'AGUARDANDO_ALOCACAO',
        },
      }),
    );
    jest.spyOn(agendamentoService, 'obterDetalhesViagem').mockResolvedValueOnce(detalheAguardando);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<AgendamentoDetalhesScreen />);
    });

    expect(textoPorTestId(root, 'status-alocacao-principal-ida')).toBe(
      'Aguardando alocação do veículo',
    );
    expect(textoPorTestId(root, 'status-alocacao-principal-volta')).toBe(
      'Aguardando alocação do veículo',
    );
    expect(existeTestId(root, 'veiculo-principal-ida')).toBe(false);
    expect(existeTestId(root, 'motorista-principal-ida')).toBe(false);
    expect(existeTestId(root, 'alerta-realocacao-principal-ida')).toBe(false);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('FA-002: exibe banner visual destacado quando o aluno é realocado para outro veículo', async () => {
    const base = criarDetalheFixture();
    const detalheRealocado = mapearDetalhe(
      criarDetalheFixture({
        rota_principal_ida: {
          ...base.rota_principal_ida!,
          realocado: true,
          status_alocacao: 'REALOCADO',
          rota_original_nome: 'Linha 02 - Bairro Novo',
        },
      }),
    );
    jest.spyOn(agendamentoService, 'obterDetalhesViagem').mockResolvedValueOnce(detalheRealocado);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<AgendamentoDetalhesScreen />);
    });

    expect(existeTestId(root, 'alerta-realocacao-principal-ida')).toBe(true);
    expect(textoPorTestId(root, 'alerta-realocacao-principal-ida')).toBe(
      'Atenção: Você foi realocado. Seu ônibus para hoje é o veículo Ônibus 04 - Placa OCR-1234',
    );
    expect(existeTestId(root, 'alerta-realocacao-principal-volta')).toBe(false);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('exibe mensagem de erro sem painel de simulação quando a busca falha e permite tentar novamente', async () => {
    const detalhes = mapearDetalhe(criarDetalheFixture());
    jest
      .spyOn(agendamentoService, 'obterDetalhesViagem')
      .mockRejectedValueOnce({
        response: { status: 404, data: { detail: 'Nenhum agendamento encontrado.' } },
      })
      .mockResolvedValueOnce(detalhes);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<AgendamentoDetalhesScreen />);
    });

    expect(existeTestId(root, 'btn-carregar-mock-hu019')).toBe(false);
    expect(existeTestId(root, 'painel-simulacao-hu019')).toBe(false);
    expect(todosTextosTela(root)).toContain('Não foi possível carregar a viagem');
    expect(todosTextosTela(root)).toContain('Nenhum agendamento encontrado.');

    const botaoTentarNovamente = root.root
      .findAllByType(TouchableOpacity)
      .find((node: any) => extrairTextos(node) === 'Tentar novamente');
    expect(botaoTentarNovamente).toBeDefined();

    await renderer.act(async () => {
      botaoTentarNovamente.props.onPress();
    });

    expect(textoPorTestId(root, 'veiculo-principal-ida')).toBe('Ônibus 04 - Placa OCR-1234');
    expect(existeTestId(root, 'painel-simulacao-hu019')).toBe(false);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('exibe resumo de alocação por turno na Home do Aluno e em Meus Agendamentos', async () => {
    const hoje = dataLocalHojeIso();
    const base = criarDetalheFixture({ data: hoje });
    const agendamentoComRealocacao = criarDetalheFixture({
      id: 10,
      data: hoje,
      rota_principal_ida: {
        ...base.rota_principal_ida!,
        realocado: true,
        status_alocacao: 'REALOCADO',
      },
    });

    jest.spyOn(agendamentoService, 'listarAgendamentosAtivos').mockResolvedValue({
      agendamentos: [agendamentoComRealocacao],
      ativos: 1,
      limite: 22,
    });
    jest.spyOn(agendamentoService, 'obterCalendario').mockResolvedValue({
      mes: hoje.slice(0, 7),
      dias: [],
      ativos: 1,
      limite: 22,
    });

    let homeRoot: any;
    await renderer.act(async () => {
      homeRoot = renderer.create(<StudentHomeScreen />);
    });

    expect(textoPorTestId(homeRoot, 'home-status-alocacao-ida')).toBe('Alocação confirmada');
    expect(textoPorTestId(homeRoot, 'home-alerta-realocacao-ida')).toBe(
      'Atenção: Você foi realocado. Seu ônibus para hoje é o veículo Ônibus 04 - Placa OCR-1234',
    );
    const textosHome = todosTextosTela(homeRoot);
    expect(textosHome).toContain('Ônibus 04 - Placa OCR-1234 • Motorista: Ana Souza');
    expect(textosHome).toContain('Complementar: Van 2 - Bairro Novo • Conexão: Trevo do Bairro Novo');

    await renderer.act(async () => {
      homeRoot.unmount();
    });

    let agendaRoot: any;
    await renderer.act(async () => {
      agendaRoot = renderer.create(<MeusAgendamentosScreen />);
    });

    expect(textoPorTestId(agendaRoot, 'agenda-status-alocacao-10-ida')).toBe('Alocação confirmada');
    expect(textoPorTestId(agendaRoot, 'agenda-alerta-realocacao-10-ida')).toBe(
      'Atenção: Você foi realocado. Seu ônibus para hoje é o veículo Ônibus 04 - Placa OCR-1234',
    );
    const textosAgenda = todosTextosTela(agendaRoot);
    expect(textosAgenda).toContain('Ônibus 04 - Placa OCR-1234 • Motorista: Ana Souza');
    expect(textosAgenda).toContain('Ida: Van 2 - Bairro Novo');

    await renderer.act(async () => {
      agendaRoot.unmount();
    });
  });
});
