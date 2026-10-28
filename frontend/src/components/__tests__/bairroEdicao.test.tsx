import React from 'react';
import { Modal } from 'react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import CadastrarBairroScreen from '../../app/(administrador)/bairros/cadastrar';
import EditarBairroScreen from '../../app/(administrador)/bairros/editar';
import { bairroService, BairroItem } from '../../services/bairroService';

const renderer = jest.requireActual<any>('react-test-renderer');
let mockId = '1';
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useLocalSearchParams: () => ({ id: mockId }),
  useFocusEffect: (effect: () => void) => jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));
jest.mock('react-native-paper', () => ({
  Text: 'Text', TextInput: 'TextInput', Button: 'Button', Portal: 'Portal',
  Snackbar: 'Snackbar', ActivityIndicator: 'ActivityIndicator',
}));
jest.mock('lucide-react-native', () => ({
  ChevronLeft: 'ChevronLeft', Trash2: 'Trash2', RotateCcw: 'RotateCcw', X: 'X',
}));
jest.mock('../../services/bairroService', () => ({
  bairroService: { obterBairroPorId: jest.fn(), criarBairro: jest.fn(), atualizarBairro: jest.fn() },
}));
jest.mock('../ui/AppPopup', () => ({ AppPopup: 'Popup' }));
const obter = bairroService.obterBairroPorId as jest.MockedFunction<typeof bairroService.obterBairroPorId>;
let responder: (bairro: BairroItem) => void;
beforeEach(() => {
  mockId = '1';
  obter.mockReset();
  obter.mockImplementation(() => new Promise(resolve => { responder = resolve; }));
});
it('oculta o formulário anterior até carregar o bairro selecionado e descarta alterações locais', async () => {
  let root: any;
  await renderer.act(async () => { root = renderer.create(<EditarBairroScreen />); });
  expect(root.root.findAllByType('TextInput')).toHaveLength(0);
  await renderer.act(async () => { responder({ id: 1, nome: 'Centro', ativo: true, pontos: [] }); });
  const nome = () => root.root.findAllByType('TextInput').find((input: any) => input.props.label === 'Nome do Bairro *');
  expect(nome().props.value).toBe('Centro');
  await renderer.act(async () => { nome().props.onChangeText('Alteração não salva'); });
  mockId = '2';
  await renderer.act(async () => { root.update(<EditarBairroScreen />); });
  expect(root.root.findAllByType('TextInput')).toHaveLength(0);
  await renderer.act(async () => { responder({ id: 2, nome: 'Matriz', ativo: true, pontos: [] }); });
  expect(nome().props.value).toBe('Matriz');
  await renderer.act(async () => {
    root.root.findAllByType('Button').find((button: any) => button.props.children === 'Adicionar ponto de parada').props.onPress();
  });
  const ponto = root.root.findAllByType('TextInput').find((input: any) => input.props.label === 'Nome do Ponto *');
  expect(ponto.props.placeholder).toBeUndefined();
  await renderer.act(async () => { root.unmount(); });
});

const nomeLongo = 'MaximilianodeAlbuquerqueeVasconcelosdosAnjosdeAssisdeJesusdeNazarédeMariadeJosêdeRibamardeSantAnnadeQuitéria';
const telas = [CadastrarBairroScreen, EditarBairroScreen];
async function abrirTela(Screen: typeof CadastrarBairroScreen, pontos: BairroItem['pontos'] = []) {
  let root: any;
  await renderer.act(async () => { root = renderer.create(<Screen />); });
  if (Screen === EditarBairroScreen) {
    await renderer.act(async () => { responder({ id: 1, nome: 'Centro', ativo: true, pontos }); });
  }
  return root;
}
function botao(root: any, texto: string) {
  return root.root.findAllByType('Button').find((item: any) => item.props.children === texto);
}
for (const Screen of telas) {
  it.each(['cancelar', 'voltar'])(`${Screen.name}: descarta texto e erro ao %s e reabrir o modal`, async (acao) => {
    const root = await abrirTela(Screen);
    await renderer.act(async () => { botao(root, 'Adicionar ponto de parada').props.onPress(); });
    const campo = () => root.root.findAllByType('TextInput').find((input: any) => input.props.label === 'Nome do Ponto *');
    await renderer.act(async () => { campo().props.onChangeText('Rascunho 😀'); });
    await renderer.act(async () => { botao(root, 'Adicionar').props.onPress(); });
    expect(campo().props.error).toBe(true);
    await renderer.act(async () => {
      if (acao === 'cancelar') botao(root, 'Cancelar').props.onPress();
      else root.root.findByType(Modal).props.onRequestClose();
    });
    await renderer.act(async () => { botao(root, 'Adicionar ponto de parada').props.onPress(); });
    expect(campo().props.value).toBe('');
    expect(campo().props.error).toBe(false);
    expect(root.root.findAllByType('Text').filter((item: any) => item.props.accessibilityRole === 'alert')).toHaveLength(0);
    await renderer.act(async () => root.unmount());
  });

  it.each([
    ['Ponto 😀', 'Use apenas letras'],
    [nomeLongo, 'no máximo 100 caracteres'],
  ])(`${Screen.name}: mostra erro no modal e não adiciona %s`, async (nome, mensagem) => {
    const root = await abrirTela(Screen);
    await renderer.act(async () => { botao(root, 'Adicionar ponto de parada').props.onPress(); });
    const campo = () => root.root.findAllByType('TextInput').find((input: any) => input.props.label === 'Nome do Ponto *');
    await renderer.act(async () => { campo().props.onChangeText(nome); });
    await renderer.act(async () => { botao(root, 'Adicionar').props.onPress(); });
    expect(campo().props.error).toBe(true);
    expect(root.root.findAllByType('Text').some((item: any) => item.children.join('').includes('/100 caracteres'))).toBe(false);

    const alertas = root.root.findAllByType('Text').filter((item: any) => item.props.accessibilityRole === 'alert');
    expect(alertas.some((item: any) => item.children.join('').includes(mensagem))).toBe(true);
    await renderer.act(async () => { campo().props.onChangeText('Ainda inválido 😀'); });
    expect(campo().props.error).toBe(true);
    await renderer.act(async () => { campo().props.onChangeText('Praça 7 de Setembro'); });
    expect(campo().props.error).toBe(false);
    expect(root.root.findAllByType('Text').filter((item: any) => item.props.accessibilityRole === 'alert')).toHaveLength(0);

    await renderer.act(async () => root.unmount());
  });
  it.each(['Praça 7 de Setembro', 'A'.repeat(100)])(`${Screen.name}: aceita nome válido %s`, async (nome) => {
    const root = await abrirTela(Screen);
    await renderer.act(async () => { botao(root, 'Adicionar ponto de parada').props.onPress(); });
    const campo = root.root.findAllByType('TextInput').find((input: any) => input.props.label === 'Nome do Ponto *');
    await renderer.act(async () => { campo.props.onChangeText(nome); });
    await renderer.act(async () => { botao(root, 'Adicionar').props.onPress(); });
    expect(root.root.findAllByType('Text').some((item: any) => item.children.join('') === nome)).toBe(true);
    await renderer.act(async () => root.unmount());
  });
  it(`${Screen.name}: finalizar com bairro longo mostra aviso em vez de permanecer sem resposta`, async () => {
    const root = await abrirTela(Screen, [{ id: 1, nome: 'Praça', ativo: true }]);
    const campo = root.root.findAllByType('TextInput').find((input: any) => input.props.label === 'Nome do Bairro *');
    await renderer.act(async () => { campo.props.onChangeText(nomeLongo); });
    const texto = Screen === EditarBairroScreen ? 'Salvar alterações' : 'Finalizar cadastro';
    await renderer.act(async () => { await botao(root, texto).props.onPress(); });
    expect(root.root.findByType('Popup').props.title).toBe('Confira os dados do bairro');
    expect(root.root.findByType('Popup').props.visible).toBe(true);
    await renderer.act(async () => root.unmount());
  });
}
it('exibe o erro de um ponto já carregado acima do limite e bloqueia salvar', async () => {
  const root = await abrirTela(EditarBairroScreen, [{ id: 1, nome: nomeLongo, ativo: true }]);
  await renderer.act(async () => { await botao(root, 'Salvar alterações').props.onPress(); });
  const alertas = root.root.findAllByType('Text').filter((item: any) => item.props.accessibilityRole === 'alert');
  expect(alertas.some((item: any) => item.children.join('').includes('no máximo 100 caracteres'))).toBe(true);
  expect(root.root.findByType('Popup').props.visible).toBe(true);
  expect(bairroService.atualizarBairro).not.toHaveBeenCalled();
  await renderer.act(async () => root.unmount());
});
