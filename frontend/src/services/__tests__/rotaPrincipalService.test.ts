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

import { rotaPrincipalService } from '../rotaPrincipalService';
import { getErrorMessage } from '../../utils/errorUtils';

const semConexao = Object.assign(new Error('Network Error'), { request: {} });

describe('rotaPrincipalService - só dados da API (HU-011, #333 e #334)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('lista vazia quando a API não tem rotas, sem rotas de exemplo', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await expect(rotaPrincipalService.listarRotasPrincipais()).resolves.toEqual([]);
  });

  it('repassa a falha de conexão na listagem e nas opções', async () => {
    mockGet.mockRejectedValue(semConexao);

    await expect(rotaPrincipalService.listarRotasPrincipais()).rejects.toBe(semConexao);
    await expect(rotaPrincipalService.listarOpcoes()).rejects.toBe(semConexao);
  });

  it('não finge sucesso ao cadastrar, editar, inativar ou reativar sem conexão', async () => {
    mockPost.mockRejectedValue(semConexao);
    mockPatch.mockRejectedValue(semConexao);
    const dados = {
      nome: 'Rota Sem Conexão',
      horarioSaida: '06:30',
      horarioRetorno: '17:30',
      faculdadesIdaIds: [1],
      faculdadesVoltaIds: [1],
      bairrosIds: [1],
    };

    await expect(rotaPrincipalService.criarRotaPrincipal(dados)).rejects.toBe(semConexao);
    await expect(rotaPrincipalService.atualizarRotaPrincipal(1, dados)).rejects.toBe(semConexao);
    await expect(rotaPrincipalService.inativarRotaPrincipal(1)).rejects.toBe(semConexao);
    await expect(rotaPrincipalService.reativarRotaPrincipal(1)).rejects.toBe(semConexao);
  });

  it('inativa a rota de id 1 chamando a API, sem bloqueio local', async () => {
    mockPatch.mockResolvedValue({ data: { success: true } });

    await rotaPrincipalService.inativarRotaPrincipal(1);

    expect(mockPatch).toHaveBeenCalledWith('/rotas-principais/1/inativar', undefined);
  });

  it('opções só com faculdades e bairros que a API mandou', async () => {
    mockGet.mockResolvedValue({
      data: {
        faculdades: [{ id: 2, nome: 'Instituto Federal do Ceará', campus: 'Quixadá' }],
        bairros: [{ id: 1, nome: 'Centro' }],
      },
    });

    const opcoes = await rotaPrincipalService.listarOpcoes();

    expect(opcoes.faculdades.map((f) => f.id)).toEqual([2]);
    expect(opcoes.bairros.map((b) => b.nome)).toEqual(['Centro']);
  });
});

describe('rotaPrincipalService - nome em uso (HU-011, #347)', () => {
  beforeEach(() => {
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('mantém a mensagem da API no 409 do cadastro e da edição', async () => {
    const conflito = Object.assign(new Error('Request failed with status code 409'), {
      response: { status: 409, data: { success: false, error: { code: 'CONFLICT', message: 'Já existe uma rota com este nome.' } } },
    });
    mockPost.mockRejectedValue(conflito);
    mockPatch.mockRejectedValue(conflito);
    const dados = {
      nome: 'Rota Integrada',
      horarioSaida: '06:30',
      horarioRetorno: '17:30',
      faculdadesIdaIds: [1],
      faculdadesVoltaIds: [1],
      bairrosIds: [1],
    };

    await expect(rotaPrincipalService.criarRotaPrincipal(dados)).rejects.toBe(conflito);
    await expect(rotaPrincipalService.atualizarRotaPrincipal(1, dados)).rejects.toBe(conflito);
    expect(getErrorMessage(conflito)).toBe('Já existe uma rota com este nome.');
  });
});

describe('rotaPrincipalService - bloqueios de inativação e reativação (HU-011, #348)', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('mantém a mensagem da API, sem "Request failed with status code 409"', async () => {
    const mensagem =
      'Esta rota possui rotas complementares ativas vinculadas. Inative ou desvincule as rotas complementares antes de continuar.';
    const bloqueio = Object.assign(new Error('Request failed with status code 409'), {
      response: { status: 409, data: { success: false, error: { code: 'CONFLICT', message: mensagem } } },
    });
    mockPatch.mockRejectedValue(bloqueio);

    const erroInativar = await rotaPrincipalService.inativarRotaPrincipal(2).catch((e) => e);
    const erroReativar = await rotaPrincipalService.reativarRotaPrincipal(2).catch((e) => e);

    expect(getErrorMessage(erroInativar)).toBe(mensagem);
    expect(getErrorMessage(erroReativar)).toBe(mensagem);
  });
});

describe('rotaPrincipalService - sigla e campus das faculdades (HU-011, #344)', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('guarda sigla e campus para montar "SIGLA - Campus" sem trocar a sigla pelo nome', async () => {
    mockGet.mockResolvedValue({
      data: {
        faculdades: [
          { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
          { id: 9, nome: 'Faculdade Sem Sigla', sigla: null, campus: 'Quixadá' },
        ],
        bairros: [],
      },
    });

    const { faculdades } = await rotaPrincipalService.listarOpcoes();

    expect(faculdades[0]).toMatchObject({ sigla: 'UFC', campus: 'Quixadá', nome: 'Universidade Federal do Ceará' });
    expect(faculdades[1].sigla).toBe('');
  });
});

describe('rotaPrincipalService - ida e volta independentes (HU-011, #337)', () => {
  beforeEach(() => {
    mockPost.mockReset();
  });

  it('envia só as faculdades escolhidas em cada lista, sem copiar a ida na volta', async () => {
    mockPost.mockResolvedValue({ data: { success: true, data: { id: 9, nome: 'Rota Integrada' } } });

    await rotaPrincipalService.criarRotaPrincipal({
      nome: '  Rota Integrada ',
      horarioSaida: '06:30',
      horarioRetorno: '17:30',
      faculdadesIdaIds: [1, 2, 3],
      faculdadesVoltaIds: [1],
      bairrosIds: [1, 2],
    });

    expect(mockPost).toHaveBeenCalledWith('/rotas-principais', {
      nome: 'Rota Integrada',
      horario_saida: '06:30',
      horario_retorno: '17:30',
      bairros_ids: [1, 2],
      faculdades_ida_ids: [1, 2, 3],
      faculdades_volta_ids: [1],
    });
  });
});
