import React from 'react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { FormProvider, useForm } from 'react-hook-form';
import { TouchableOpacity } from 'react-native';

import { carregarVinculosAtivos } from '../../services/vinculoAlunoService';
import { Passo3ContatoVinculo } from '../cadastro/Passo3ContatoVinculo';

const renderer = jest.requireActual<any>('react-test-renderer');
jest.mock('react-native-paper', () => ({
  Text: 'Text', Button: 'Button', Portal: (props: any) => props.children,
  TextInput: Object.assign((props: any) => jest.requireActual<typeof React>('react').createElement('TextInput', props), { Icon: 'Icon' }),
  useTheme: () => ({ colors: { primary: '#000' } }),
}));
jest.mock('lucide-react-native', () => ({
  ChevronDown: 'ChevronDown', Phone: 'Phone', School: 'School', GraduationCap: 'GraduationCap', Search: 'Search', X: 'X',
}));
jest.mock('../../services/vinculoAlunoService', () => ({ carregarVinculosAtivos: jest.fn() }));

const mockCarregar = carregarVinculosAtivos as jest.MockedFunction<typeof carregarVinculosAtivos>;
type Campos = { bairro: string; instituicao: string; whatsapp: string };
let form: ReturnType<typeof useForm<Campos>>;
let root: any;
function Formulario({ bairroInicial = '' }: { bairroInicial?: string }) {
  const metodos = useForm<Campos>({ defaultValues: { bairro: bairroInicial, instituicao: '', whatsapp: '' } });
  React.useEffect(() => { form = metodos; }, [metodos]);
  return <FormProvider {...metodos}><Passo3ContatoVinculo /></FormProvider>;
}
const opcoes = {
  bairros: [{ id: 7, nome: 'Serra do Estêvão', ativo: true, pontos: [] }],
  faculdades: [{ id: 9, nome: 'Universidade', sigla: 'UNI', campus: 'Quixadá', ativo: true }],
};
beforeEach(() => { mockCarregar.mockReset(); });

async function abrir(bairroInicial = '') {
  await renderer.act(async () => { root = renderer.create(<Formulario bairroInicial={bairroInicial} />); });
}
function textos() {
  return root.root.findAllByType('Text').flatMap((item: any) => item.children.filter((child: any) => typeof child === 'string')).join(' ');
}
async function selecionar(label: string, opcao: string) {
  const seletor = root.root.findAllByType(TouchableOpacity).find((item: any) =>
    item.findAllByType('TextInput').some((input: any) => input.props.label === label)
  );
  await renderer.act(async () => { seletor.props.onPress(); });
  const item = root.root.findAllByType(TouchableOpacity).find((element: any) => {
    const labels = element.findAllByType('Text');
    return labels.length === 1 && labels[0].children.join('') === opcao;
  });
  await renderer.act(async () => { item.props.onPress(); });
}

describe('Seletores de vínculos do aluno', () => {
  it('converte o nome salvo no perfil em ID de um bairro ativo na renovação', async () => {
    mockCarregar.mockResolvedValue(opcoes);
    await abrir('Serra do Estêvão');
    expect(form.getValues('bairro')).toBe('7');
    await renderer.act(async () => root.unmount());
  });

  it('exibe nomes e guarda IDs das opções escolhidas', async () => {
    mockCarregar.mockResolvedValue(opcoes);
    await abrir();
    await selecionar('Bairro / Localidade *', 'Serra do Estêvão');
    await selecionar('Instituição de Ensino *', 'UNI - Universidade (Quixadá)');
    expect(form.getValues('bairro')).toBe('7');
    expect(form.getValues('instituicao')).toBe('9');
    expect(mockCarregar).toHaveBeenCalledTimes(1);
    await renderer.act(async () => root.unmount());
  });

  it('mostra ausência de cadastros sem inserir bairros de exemplo', async () => {
    mockCarregar.mockResolvedValue({ bairros: [], faculdades: [] });
    await abrir();
    expect(textos()).toContain('Não há bairros ou instituições ativos disponíveis');
    expect(textos()).not.toContain('Centro');
    expect(form.getValues('bairro')).toBe('');
    await renderer.act(async () => root.unmount());
  });

  it('informa falha de conexão e permite tentar novamente', async () => {
    mockCarregar.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(opcoes);
    await abrir();
    expect(textos()).toContain('Erro de conexão com o servidor');
    await renderer.act(async () => { root.root.findByType('Button').props.onPress(); });
    expect(mockCarregar).toHaveBeenCalledTimes(2);
    expect(textos()).not.toContain('Erro de conexão com o servidor');
    await renderer.act(async () => root.unmount());
  });
});
