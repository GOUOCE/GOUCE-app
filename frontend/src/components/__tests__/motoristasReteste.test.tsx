import React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import Cadastrar from '../../app/(administrador)/motoristas/cadastrar';
import Editar from '../../app/(administrador)/motoristas/editar';
import { motoristaService, MotoristaItem } from '../../services/motoristaService';
const renderer = jest.requireActual<any>('react-test-renderer');
let mockId = '1';
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace }), useLocalSearchParams: () => ({ id: mockId }),
  useFocusEffect: (effect: () => void) => jest.requireActual<typeof React>('react').useEffect(effect, [effect]),
}));
jest.mock('react-native-paper', () => ({ Text: 'Text', Button: 'Button', ActivityIndicator: 'ActivityIndicator', TextInput: Object.assign((props: any) => jest.requireActual<typeof React>('react').createElement('TextInput', props), { Icon: 'Icon' }) }));
jest.mock('lucide-react-native', () => ({ ChevronLeft: 'ChevronLeft', User: 'User', Phone: 'Phone' }));
jest.mock('../ui/AppPopup', () => ({ AppPopup: 'Popup' }));
jest.mock('../../services/motoristaService', () => ({ motoristaService: { obterMotoristaPorId: jest.fn(), criarMotorista: jest.fn(), atualizarMotorista: jest.fn() } }));
const item: MotoristaItem = { id: 1, nome: 'Maria da Silva', telefone: '88998112233', ativo: true };
const obter = motoristaService.obterMotoristaPorId as jest.MockedFunction<typeof motoristaService.obterMotoristaPorId>;
let responder: (m: MotoristaItem) => void;
beforeEach(() => {
  jest.resetAllMocks(); mockId = '1';
  obter.mockImplementation(() => new Promise(resolve => { responder = resolve; }));
});
async function abrir(Screen: typeof Cadastrar) {
  let root: any; await renderer.act(async () => { root = renderer.create(<Screen />); }); return root;
}
function campo(root: any, label: string) { return root.root.findAllByType('TextInput').find((n: any) => n.props.label === label); }
it('não mostra dados antigos ao trocar de motorista', async () => {
  const root = await abrir(Editar);
  expect(root.root.findAllByType('TextInput')).toHaveLength(0);
  await renderer.act(async () => responder(item));
  mockId = '2'; await renderer.act(async () => root.update(<Editar />));
  expect(root.root.findAllByType('TextInput')).toHaveLength(0);
  await renderer.act(async () => responder({ ...item, id: 2, nome: 'Ana Souza' }));
  expect(campo(root, 'Nome Completo *').props.value).toBe('Ana Souza');
  await renderer.act(async () => root.unmount());
});
it('permite repetir carga após falha sem liberar formulário antigo', async () => {
  obter.mockRejectedValueOnce(new Error('Network Error'));
  const root = await abrir(Editar);
  expect(root.root.findAllByType('TextInput')).toHaveLength(0);
  expect(root.root.findByType('Popup').props.message).toContain('Erro de conexão');
  await renderer.act(async () => root.root.findByType('Popup').props.onConfirm());
  await renderer.act(async () => responder(item));
  expect(campo(root, 'Nome Completo *').props.value).toBe(item.nome);
  await renderer.act(async () => root.unmount());
});
for (const Screen of [Cadastrar, Editar]) {
  it(`${Screen.name}: máscara completa e fechamento do sucesso pelo X`, async () => {
    (motoristaService.criarMotorista as jest.MockedFunction<typeof motoristaService.criarMotorista>).mockResolvedValue(item);
    (motoristaService.atualizarMotorista as jest.MockedFunction<typeof motoristaService.atualizarMotorista>).mockResolvedValue(item);
    const root = await abrir(Screen);
    if (Screen === Editar) await renderer.act(async () => responder(item));
    await renderer.act(async () => campo(root, 'Nome Completo *').props.onChangeText(item.nome));
    await renderer.act(async () => campo(root, 'Telefone *').props.onChangeText(item.telefone));
    expect(campo(root, 'Telefone *').props.value).toBe('(88) 9 9811-2233');
    expect(campo(root, 'Telefone *').props.maxLength).toBe(16);
    const label = Screen === Cadastrar ? 'Finalizar cadastro' : 'Salvar alterações';
    await renderer.act(async () => root.root.findAllByType('Button').find((n: any) => n.props.children === label).props.onPress());
    if (Screen === Cadastrar) await renderer.act(async () => root.root.findByType('Popup').props.onConfirm());
    expect(root.root.findByType('Popup').props.type).toBe('success');
    await renderer.act(async () => root.root.findByType('Popup').props.onDismiss());
    expect(mockReplace).toHaveBeenCalledWith('/(administrador)/motoristas');
    await renderer.act(async () => root.unmount());
  });
}

for (const Screen of [Cadastrar, Editar]) {
  it.each([
    ['Nome Completo *', '333333', 'Maria da Silva'],
    ['Telefone *', '88', '88998112233'],
  ])(`${Screen.name}: erro de %s some ao apagar/corrigir e volta ao enviar vazio`, async (label, invalido, valido) => {
    const root = await abrir(Screen);
    if (Screen === Editar) await renderer.act(async () => responder(item));
    await renderer.act(async () => campo(root, 'Nome Completo *').props.onChangeText(item.nome));
    await renderer.act(async () => campo(root, 'Telefone *').props.onChangeText(item.telefone));
    await renderer.act(async () => campo(root, label).props.onChangeText(invalido));
    const enviar = async () => {
      const texto = Screen === Cadastrar ? 'Finalizar cadastro' : 'Salvar alterações';
      await renderer.act(async () => root.root.findAllByType('Button').find((n: any) => n.props.children === texto).props.onPress());
    };
    await enviar();
    expect(campo(root, label).props.error).toBe(true);
    await renderer.act(async () => campo(root, label).props.onChangeText(''));
    expect(campo(root, label).props.value).toBe('');
    expect(campo(root, label).props.error).toBe(false);
    await enviar();
    expect(campo(root, label).props.error).toBe(true);
    await renderer.act(async () => campo(root, label).props.onChangeText(valido));
    expect(campo(root, label).props.error).toBe(false);
    expect(motoristaService.criarMotorista).not.toHaveBeenCalled();
    expect(motoristaService.atualizarMotorista).not.toHaveBeenCalled();
    await renderer.act(async () => root.unmount());
  });
}
