import React from 'react';
import { TouchableOpacity } from 'react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import BairrosListScreen from '../../app/(administrador)/bairros';
import { bairroService, BairroItem } from '../../services/bairroService';

const renderer = jest.requireActual<any>('react-test-renderer');
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useFocusEffect: (effect: () => void) => jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));
jest.mock('react-native-paper', () => ({
  Text: 'Text', TextInput: Object.assign(
    (props: any) => jest.requireActual<typeof React>('react').createElement('TextInput', props), { Icon: 'Icon' }
  ), Switch: 'Switch', Snackbar: 'Snackbar',
}));
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft', Plus: 'Plus', Search: 'Search', Pencil: 'Pencil',
  Trash2: 'Trash2', RotateCcw: 'RotateCcw', X: 'X',
}));
jest.mock('../../services/bairroService', () => ({
  bairroService: { listarBairros: jest.fn(), inativarBairro: jest.fn() },
}));
jest.mock('../ui/AppPopup', () => ({
  AppPopup: (props: any) => jest.requireActual<typeof React>('react').createElement('Popup', props),
}));

const mockListar = bairroService.listarBairros as jest.MockedFunction<typeof bairroService.listarBairros>;
const bairro: BairroItem = { id: 7, nome: 'Centro', ativo: true, pontos: [
  { id: 1, nome: 'Praça', ativo: true }, { id: 2, nome: 'Mercado', ativo: false },
] };
let root: any;
let responder: (items: BairroItem[]) => void;

beforeEach(() => {
  mockListar.mockReset();
  mockListar.mockImplementation(() => new Promise((resolve) => { responder = resolve; }));
});

async function abrir() {
  await renderer.act(async () => { root = renderer.create(<BairrosListScreen />); });
  await renderer.act(async () => { responder([bairro]); });
}

describe('Listagem de bairros — regressões do PR #253', () => {
  it('não consulta novamente a cada resposta ou mudança da chave', async () => {
    await abrir();
    expect(mockListar).toHaveBeenCalledTimes(1);
    await renderer.act(async () => { root.root.findByType('Switch').props.onValueChange(true); });
    expect(mockListar).toHaveBeenCalledTimes(1);
    await renderer.act(async () => { root.unmount(); });
  });

  it('mostra pontos inativos de bairros ativos apenas quando solicitado', async () => {
    await abrir();
    const textos = () => root.root.findAllByType('Text')
      .flatMap((item: any) => item.children.filter((child: any) => typeof child === 'string')).join(' ');
    expect(textos()).not.toContain('Mercado');
    await renderer.act(async () => { root.root.findByType('Switch').props.onValueChange(true); });
    expect(textos()).toContain('Pontos inativos: ');
    expect(textos()).toContain('Mercado');
    await renderer.act(async () => { root.unmount(); });
  });

  it('mostra erro de conexão em português ao falhar a inativação', async () => {
    (bairroService.inativarBairro as jest.MockedFunction<typeof bairroService.inativarBairro>)
      .mockRejectedValue(new Error('Network Error'));
    await abrir();
    const botao = root.root.findAllByType(TouchableOpacity)
      .find((item: any) => item.findAllByType('Trash2').length === 1);
    await renderer.act(async () => { botao.props.onPress(); });
    await renderer.act(async () => { await root.root.findByType('Popup').props.onConfirm(); });
    expect(root.root.findByType('Popup').props.message).toContain('Erro de conexão com o servidor');
    await renderer.act(async () => { root.unmount(); });
  });
});
