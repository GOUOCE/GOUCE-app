import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn<(url: string, config?: any) => Promise<any>>();
const mockPost = jest.fn<(url: string, body?: any) => Promise<any>>();
const mockPatch = jest.fn<(url: string, body?: any) => Promise<any>>();
jest.mock('../../api/api', () => ({
  api: {
    get: (url: string, config?: any) => mockGet(url, config),
    post: (url: string, body?: any) => mockPost(url, body),
    patch: (url: string, body?: any) => mockPatch(url, body),
  },
}));

import { representanteService } from '../representanteService';
import { getErrorMessage } from '../../utils/errorUtils';

const ativa = { id: 7, aluno_id: 7, nome: 'Ana Beatriz', email: 'ana@ufc.br', ativo: true, instituicao: 'Universidade Federal do Ceará', campus: 'Quixadá', curso: '', periodo_ingresso: '' };
const revogado = { id: 9, aluno_id: 9, nome: 'Pedro Henrique', email: 'pedro@ifce.br', ativo: false, instituicao: 'IFCE', campus: 'Quixadá', curso: '', periodo_ingresso: '' };

const erroDaApi = (status: number, message: string) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status, data: { success: false, error: { code: 'CONFLICT', message } } },
  });

describe('representanteService - sem dados de exemplo (HU-030, #300)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('lista os representantes ativos e os revogados (AC-01, #297)', async () => {
    mockGet.mockResolvedValue({ data: [ativa, revogado] });

    const lista = await representanteService.listarRepresentantes();

    expect(lista.map((r) => [r.nome, r.ativo])).toEqual([
      ['Ana Beatriz', true],
      ['Pedro Henrique', false],
    ]);
  });

  it('devolve lista vazia quando a API não tem representantes, sem exemplos', async () => {
    mockGet.mockResolvedValue({ data: [] });

    expect(await representanteService.listarRepresentantes()).toEqual([]);
  });

  it('deixa curso, semestre e instituição vazios quando a API não envia, sem valores fixos', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 3, aluno_id: 3, nome: 'Sem Dados', email: 's@d.com', ativo: true }] });

    const [rep] = await representanteService.listarRepresentantes();

    expect(rep.instituicao).toBe('');
    expect(rep.campus).toBe('');
    expect(rep.curso).toBe('');
    expect(rep.periodo_ingresso).toBe('');
  });

  it('propaga a falha de conexão em vez de devolver exemplos', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));

    await expect(representanteService.listarRepresentantes()).rejects.toThrow('Network Error');
    expect(getErrorMessage(new Error('Network Error'))).toBe(
      'Erro de conexão com o servidor. Verifique sua internet ou tente novamente em instantes.'
    );
  });

  it('filtra a busca por nome ou e-mail', async () => {
    mockGet.mockResolvedValue({ data: [ativa, revogado] });

    const lista = await representanteService.listarRepresentantes('pedro');

    expect(lista.map((r) => r.nome)).toEqual(['Pedro Henrique']);
  });
});

describe('representanteService - busca de alunos (#298, #300)', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  const alunos = [
    { id: 7, nome: 'Ana Beatriz', email: 'ana@ufc.br', faculdade: 'UFC', campus: 'Quixadá', status_cadastro: 'ativado' },
    { id: 9, nome: 'Pedro Henrique', email: 'pedro@ifce.br', faculdade: 'IFCE', campus: 'Quixadá', status_cadastro: 'ativado' },
    { id: 11, nome: 'Marcos Vinícius', email: 'marcos@ufc.br', faculdade: 'UFC', campus: 'Quixadá', status_cadastro: 'pendente' },
  ];

  const respostas = (representantes: any[]) => (url: string) =>
    Promise.resolve({ data: url === '/representantes' ? representantes : alunos });

  it('traz todos os alunos da busca e marca quem já é representante ativo (FA-003)', async () => {
    mockGet.mockImplementation(respostas([ativa]));

    const lista = await representanteService.buscarAlunos();

    expect(lista.map((a) => [a.nome, a.situacao])).toEqual([
      ['Ana Beatriz', 'ativo'],
      ['Pedro Henrique', 'nenhuma'],
      ['Marcos Vinícius', 'nenhuma'],
    ]);
  });

  it('marca quem teve a função revogada, que pode recebê-la de novo (AC-13)', async () => {
    mockGet.mockImplementation(respostas([{ ...ativa, id: 9, aluno_id: 9, ativo: false }]));

    const lista = await representanteService.buscarAlunos('pedro');

    expect(lista.map((a) => [a.nome, a.situacao])).toEqual([['Pedro Henrique', 'revogado']]);
  });

  it('mostra a instituição do aluno e não inventa curso nem semestre', async () => {
    mockGet.mockImplementation(respostas([]));

    const [primeiro] = await representanteService.buscarAlunos();

    expect(primeiro.instituicao).toBe('UFC');
    expect(primeiro.campus).toBe('Quixadá');
    expect(primeiro.curso).toBe('');
    expect(primeiro.periodo_ingresso).toBe('');
  });

  it('busca por nome ou e-mail sem filtrar pela instituição escolhida (#207, item 6b)', async () => {
    mockGet.mockImplementation(respostas([]));

    expect((await representanteService.buscarAlunos('pedro')).map((a) => a.nome)).toEqual(['Pedro Henrique']);
    expect((await representanteService.buscarAlunos('marcos@ufc')).map((a) => a.nome)).toEqual(['Marcos Vinícius']);
    expect(await representanteService.buscarAlunos('Nome Inexistente da Silva')).toEqual([]);
  });
});

describe('representanteService - atribuir e revogar (#298, #300)', () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('envia à API a instituição escolhida, não uma fixa', async () => {
    mockPost.mockResolvedValue({ data: { success: true, data: ativa } });

    await representanteService.atribuirRepresentante(7, 4);

    expect(mockPost).toHaveBeenCalledWith('/representantes/promover', { aluno_id: 7, faculdade_id: 4 });
  });

  it('mantém a mensagem de regra da API quando o aluno já é representante', async () => {
    mockPost.mockRejectedValue(erroDaApi(409, 'Este aluno já é um representante ativo.'));

    const erro = await representanteService.atribuirRepresentante(7, 4).catch((e) => e);

    expect(erro.response.status).toBe(409);
    expect(getErrorMessage(erro)).toBe('Este aluno já é um representante ativo.');
  });

  it('não confirma a atribuição quando a API está fora do ar', async () => {
    mockPost.mockRejectedValue(new Error('Network Error'));

    await expect(representanteService.atribuirRepresentante(7, 4)).rejects.toThrow('Network Error');
  });

  it('revoga pelo id do representante e não confirma a revogação sem resposta da API', async () => {
    mockPatch.mockResolvedValueOnce({ data: { success: true } });
    await representanteService.revogarRepresentante(7);
    expect(mockPatch).toHaveBeenCalledWith('/representantes/7/revogar', undefined);

    mockPatch.mockRejectedValueOnce(new Error('Network Error'));
    await expect(representanteService.revogarRepresentante(9)).rejects.toThrow('Network Error');
  });
});
