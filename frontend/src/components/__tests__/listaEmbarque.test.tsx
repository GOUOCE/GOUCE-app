import React from 'react';
import { FlatList, Modal, Text, TouchableOpacity } from 'react-native';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import AdminListaEmbarqueScreen from '../../app/(administrador)/logistica/embarque';
import RepresentativeHomeScreen from '../../app/(representante)/home';
import { listaEmbarqueService } from '../../services/listaEmbarqueService';
import { imprimirListaEmbarque } from '@/utils/impressaoListaEmbarque';

const renderer = jest.requireActual<any>('react-test-renderer');

const mockRouterBack = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterCanGoBack = jest.fn(() => true);

let mockSearchParams: { rotaId?: string; modoFixo?: string } = {};
let mockUser: { id: number; name: string; role: string; faculdade?: string } | null = {
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
  { virtual: true }
);

jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  ChevronDown: 'ChevronDown',
  ChevronUp: 'ChevronUp',
  Printer: 'Printer',
  RefreshCw: 'RefreshCw',
  Route: 'Route',
}));

jest.mock('@/utils/impressaoListaEmbarque', () => ({
  imprimirListaEmbarque: jest.fn(() => Promise.resolve()),
}));

const mockImprimir = imprimirListaEmbarque as jest.MockedFunction<typeof imprimirListaEmbarque>;

let rootAtual: any = null;

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

describe('Telas da Lista de Embarque (HU-018)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listaEmbarqueService.resetarMocks();
    mockSearchParams = {};
    mockRouterCanGoBack.mockReturnValue(true);
    mockUser = {
      id: 1,
      name: 'Administrador Padrao',
      role: 'ADMINISTRADOR',
    };
  });

  afterEach(async () => {
    if (rootAtual) {
      const alvo = rootAtual;
      rootAtual = null;
      await renderer.act(async () => {
        alvo.unmount();
      });
    }
  });

  describe('Fluxo Principal (52.1 - Acesso via menu pelo Administrador)', () => {
    it('exibe estado inicial com seletor "Rota *" e botão Imprimir desabilitado até selecionar uma rota', async () => {
      const root = await renderizar(<AdminListaEmbarqueScreen />);

      const subtitulo = lerTextoNode(encontrarTextoPorTestId(root, 'subtitulo-data-embarque'));
      expect(subtitulo).toMatch(/^Hoje - \d{2}\/\d{2}\/\d{4}$/);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeDefined();
      expect(root.root.findAllByType('ChevronDown')).toHaveLength(1);
      expect(root.root.findAllByType('ChevronUp')).toHaveLength(0);

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'mensagem-selecione-rota'))).toBe(
        'Selecione uma rota para visualizar os alunos alocados.'
      );

      const botaoImprimir = encontrarBotaoPorTestId(root, 'botao-imprimir-lista');
      expect(botaoImprimir.props.disabled).toBe(true);
    });

    it('alterna o ícone do dropdown ao abrir, carrega Linha 01 - Centro e aciona a impressão', async () => {
      const root = await renderizar(<AdminListaEmbarqueScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'seletor-rota'));

      expect(root.root.findByType(Modal).props.visible).toBe(true);
      expect(root.root.findAllByType('ChevronUp')).toHaveLength(1);
      expect(root.root.findAllByType('ChevronDown')).toHaveLength(0);
      expect(encontrarBotaoPorTestId(root, 'opcao-rota-1')).toBeDefined();

      await pressionar(encontrarBotaoPorTestId(root, 'opcao-rota-1'));

      expect(root.root.findByType(Modal).props.visible).toBe(false);
      expect(root.root.findAllByType('ChevronDown')).toHaveLength(1);
      expect(root.root.findAllByType('ChevronUp')).toHaveLength(0);

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados'
      );

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

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'indicador-sincronizacao'))).toBe(
        'Atualizado há 1 min'
      );

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
        }
      );
    });
  });

  describe('FA-002 - Rota sem alunos alocados (52.2)', () => {
    it('exibe mensagem de rota vazia e mantém botão "Imprimir lista" desabilitado', async () => {
      const root = await renderizar(<AdminListaEmbarqueScreen />);

      await pressionar(encontrarBotaoPorTestId(root, 'seletor-rota'));
      await pressionar(encontrarBotaoPorTestId(root, 'opcao-rota-2'));

      expect(lerTextoNode(encontrarTextoPorTestId(root, 'mensagem-lista-vazia'))).toBe(
        'Essa rota não possui nenhum aluno alocado para este dia.'
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
        'Linha 01 - Centro'
      );

      const subtitulo = lerTextoNode(encontrarTextoPorTestId(root, 'subtitulo-data-embarque'));
      expect(subtitulo).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados'
      );

      const botaoVoltar = encontrarBotaoPorTestId(root, 'botao-voltar-embarque');
      await pressionar(botaoVoltar);
      expect(mockRouterBack).toHaveBeenCalledTimes(1);

      mockRouterCanGoBack.mockReturnValue(false);
      await pressionar(botaoVoltar);
      expect(mockRouterReplace).toHaveBeenCalledWith('/(administrador)/(tabs)/logistica');
    });

    it('restringe a listagem do Representante à rota fixa e apenas aos alunos da sua IES', async () => {
      mockUser = {
        id: 10,
        name: 'Carlos Representante',
        role: 'MOTORISTA',
        faculdade: 'UFC - Universidade Federal do Ceará',
      };

      const root = await renderizar(<RepresentativeHomeScreen />);

      expect(encontrarBotaoPorTestId(root, 'seletor-rota')).toBeUndefined();
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'titulo-rota-fixa'))).toBe(
        'Linha 01 - Centro'
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '17 alunos alocados'
      );

      const alunosUfc = root.root.findByType(FlatList).props.data;
      const nomes = alunosUfc.map((item: any) => item.nome);
      expect(nomes).toContain('Ana Paula Lima');
      expect(nomes).toContain('Wesley Pontes');
      expect(nomes).not.toContain('Bruno Costa');
      expect(nomes).not.toContain('Carla Dias');

      await pressionar(encontrarBotaoPorTestId(root, 'botao-imprimir-lista'));
      expect(mockImprimir).toHaveBeenCalledWith(
        expect.objectContaining({
          rotaId: 1,
          totalAlunos: 17,
        }),
        {
          perfil: 'MOTORISTA',
          nomeEmissor: 'Carlos Representante',
        }
      );
    });
  });

  describe('FA-003 - Atualização em tempo real', () => {
    it('recalcula o total de alunos e atualiza o indicador ao simular cancelamento e realocação', async () => {
      mockSearchParams = { rotaId: '1', modoFixo: 'true' };

      const root = await renderizar(<AdminListaEmbarqueScreen />);
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados'
      );

      await pressionar(encontrarBotaoPorTestId(root, 'btn-simular-cancelamento'));
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '37 alunos alocados'
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'indicador-sincronizacao'))).toBe(
        'Atualizado agora'
      );

      await pressionar(encontrarBotaoPorTestId(root, 'btn-simular-realocacao'));
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'contador-alunos-alocados'))).toBe(
        '38 alunos alocados'
      );
      expect(lerTextoNode(encontrarTextoPorTestId(root, 'indicador-sincronizacao'))).toBe(
        'Atualizado agora'
      );
    });
  });
});
