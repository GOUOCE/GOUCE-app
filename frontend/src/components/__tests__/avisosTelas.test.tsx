import React from 'react';
import { TouchableOpacity } from 'react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import GerenciarAvisosScreen from '../../app/(administrador)/notificacoes';
import CadastrarAvisoScreen from '../../app/(administrador)/notificacoes/cadastrar';
import MuralAvisosAlunoScreen from '../../app/(aluno)/avisos';
import { avisoService, AvisoItem } from '../../services/avisoService';

const renderer = jest.requireActual<any>('react-test-renderer');
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: { origem?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (effect: () => void) =>
    jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));

jest.mock('react-native-paper', () => ({
  Text: 'Text',
  Button: 'Button',
  TextInput: Object.assign(
    (props: any) =>
      jest.requireActual<typeof React>('react').createElement('TextInput', props),
    { Icon: 'Icon' }
  ),
}));

jest.mock('lucide-react-native', () => ({
  ArrowLeft: 'ArrowLeft',
  Plus: 'Plus',
  Search: 'Search',
  X: 'X',
  ChevronDown: 'ChevronDown',
  ChevronLeft: 'ChevronLeft',
}));

jest.mock('../../services/avisoService', () => ({
  avisoService: {
    listarAvisos: jest.fn(),
    criarAviso: jest.fn(),
    inscreverAtualizacaoMural: jest.fn(() => () => {}),
  },
}));

jest.mock('../ui/AppPopup', () => ({
  AppPopup: (props: any) =>
    jest.requireActual<typeof React>('react').createElement('Popup', props),
}));

const mockListar = avisoService.listarAvisos as jest.MockedFunction<
  typeof avisoService.listarAvisos
>;
const mockCriar = avisoService.criarAviso as jest.MockedFunction<
  typeof avisoService.criarAviso
>;
const mockInscrever =
  avisoService.inscreverAtualizacaoMural as jest.MockedFunction<
    typeof avisoService.inscreverAtualizacaoMural
  >;

const avisosMock: AvisoItem[] = [
  {
    id: 1,
    titulo: 'Alteração de horário - Linha 02 - Bairro Novo',
    descricao:
      'A saída da rota Linha 02 - Bairro Novo passa a ser às 06h30 a partir de segunda-feira.',
    data_criacao: new Date().toISOString(),
  },
  {
    id: 2,
    titulo: 'Manutenção preventiva no Ônibus 02',
    descricao:
      'O Ônibus 2 passará por manutenção preventiva hoje à noite.',
    data_criacao: new Date().toISOString(),
  },
];

describe('Telas de Gerenciar Avisos e Mural de Avisos (HU-023 / HU-024)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  it('lista avisos publicados e permite expandir/recolher o card', async () => {
    mockListar.mockResolvedValueOnce(avisosMock);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<GerenciarAvisosScreen />);
    });

    expect(mockListar).toHaveBeenCalledWith('');

    // O primeiro card inicia expandido (ChevronDown) e o segundo recolhido (ChevronLeft)
    expect(root.root.findAllByType('ChevronDown')).toHaveLength(1);
    expect(root.root.findAllByType('ChevronLeft')).toHaveLength(1);

    // Tocar no segundo card expande-o
    const cards = root.root
      .findAllByType(TouchableOpacity)
      .filter((btn: any) => btn.findAllByType('ChevronLeft').length === 1);
    await renderer.act(async () => {
      cards[0].props.onPress();
    });

    expect(root.root.findAllByType('ChevronDown')).toHaveLength(2);
    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('retorna para a aba de origem correta (Painel ou Mais) ao tocar em voltar', async () => {
    mockListar.mockResolvedValue(avisosMock);
    mockSearchParams = { origem: 'home' };

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<GerenciarAvisosScreen />);
    });

    const botaoVoltar = root.root
      .findAllByType(TouchableOpacity)
      .find((btn: any) => btn.findAllByType('ArrowLeft').length === 1);

    await renderer.act(async () => {
      botaoVoltar.props.onPress();
    });

    expect(mockReplace).toHaveBeenCalledWith('/(administrador)/home');
    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('renderiza o Mural de Avisos na visão do aluno e recarrega automaticamente ao receber nova notificação (HU-024)', async () => {
    let callbackAtualizacao: (() => void) | undefined;
    mockInscrever.mockImplementation((cb: () => void) => {
      callbackAtualizacao = cb;
      return () => {};
    });

    mockListar
      .mockResolvedValueOnce([avisosMock[0]])
      .mockResolvedValueOnce(avisosMock);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<MuralAvisosAlunoScreen />);
    });

    expect(mockListar).toHaveBeenCalledTimes(1);
    expect(root.root.findAllByType('Plus')).toHaveLength(0);

    // Simula chegada de nova notificação de aviso disparando recarregamento automático
    await renderer.act(async () => {
      callbackAtualizacao?.();
    });

    expect(mockListar).toHaveBeenCalledTimes(2);

    await renderer.act(async () => {
      root.unmount();
    });
  });

  it('publica um novo aviso válido e exibe pop-up de sucesso', async () => {
    mockCriar.mockResolvedValueOnce(avisosMock[0]);

    let root: any;
    await renderer.act(async () => {
      root = renderer.create(<CadastrarAvisoScreen />);
    });

    const inputs = root.root.findAllByType('TextInput');
    await renderer.act(async () => {
      inputs[0].props.onChangeText('Alteração de horário - Linha 02');
      inputs[1].props.onChangeText(
        'A saída da rota Linha 02 passa a ser às 06h30 a partir de segunda.'
      );
    });

    const botaoSalvar = root.root.findByType('Button');
    await renderer.act(async () => {
      await botaoSalvar.props.onPress();
    });

    expect(mockCriar).toHaveBeenCalledWith(
      'Alteração de horário - Linha 02',
      'A saída da rota Linha 02 passa a ser às 06h30 a partir de segunda.'
    );

    const popup = root.root.findByType('Popup');
    expect(popup.props.visible).toBe(true);
    expect(popup.props.type).toBe('success');
    expect(popup.props.message).toBe('Aviso publicado com sucesso.');

    await renderer.act(async () => {
      root.unmount();
    });
  });
});
