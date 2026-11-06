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

import { rotaComplementarService } from '../rotaComplementarService';
import { getErrorMessage } from '../../utils/errorUtils';

const semConexao = Object.assign(new Error('Network Error'), { request: {} });

const dados = {
  nome: 'Van Sem Conexão',
  rotaPrincipalId: 1,
  horarioSaida: '06:30',
  horarioRetorno: '17:30',
  pontoConexao: 'Trevo do Bairro Novo',
};

describe('rotaComplementarService - só dados da API (HU-012, #351 e #352)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
    mockPatch.mockReset();
  });

  it('lista vazia quando a API não tem complementares, sem rotas de exemplo', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await expect(rotaComplementarService.listarRotasComplementares()).resolves.toEqual([]);
  });

  it('lê a rota principal vinculada do objeto rota_principal da API', async () => {
    mockGet.mockResolvedValue({
      data: [
        {
          id: 7,
          nome: 'Van Sítio',
          horario_saida: '06:15',
          ponto_conexao: 'Entrada do Sítio',
          ativo: true,
          rota_principal: { id: 2, nome: 'Rota Campo Velho - IFCE', ativo: true },
        },
      ],
    });

    const [rc] = await rotaComplementarService.listarRotasComplementares();
    expect(rc.rota_principal_id).toBe(2);
    expect(rc.rota_principal_nome).toBe('Rota Campo Velho - IFCE');
  });

  it('opções sem rotas principais de exemplo quando a API não tem nenhuma ativa', async () => {
    mockGet.mockResolvedValue({ data: { rotas_principais: [] } });

    await expect(rotaComplementarService.listarRotasPrincipaisAtivas()).resolves.toEqual([]);
  });

  it('repassa a falha de conexão na listagem, nas opções e na busca por id', async () => {
    mockGet.mockRejectedValue(semConexao);

    await expect(rotaComplementarService.listarRotasComplementares()).rejects.toBe(semConexao);
    await expect(rotaComplementarService.listarRotasPrincipaisAtivas()).rejects.toBe(semConexao);
    await expect(rotaComplementarService.obterRotaComplementarPorId(1)).rejects.toBe(semConexao);
  });

  it('não finge sucesso ao cadastrar, editar, inativar ou reativar sem conexão', async () => {
    mockPost.mockRejectedValue(semConexao);
    mockPatch.mockRejectedValue(semConexao);

    await expect(rotaComplementarService.criarRotaComplementar(dados)).rejects.toBe(semConexao);
    await expect(rotaComplementarService.atualizarRotaComplementar(1, dados)).rejects.toBe(semConexao);
    await expect(rotaComplementarService.inativarRotaComplementar(1)).rejects.toBe(semConexao);
    await expect(rotaComplementarService.reativarRotaComplementar(1)).rejects.toBe(semConexao);
  });

  it('inativa a complementar de id 1 chamando a API, sem bloqueio local', async () => {
    mockPatch.mockResolvedValue({ data: { success: true } });

    await rotaComplementarService.inativarRotaComplementar(1);

    expect(mockPatch).toHaveBeenCalledWith('/rotas-complementares/1/inativar', undefined);
  });

  it('nome em uso chega à tela com a mensagem da API, no cadastro e na edição (#361)', async () => {
    const conflito = Object.assign(new Error('Request failed with status code 409'), {
      response: {
        status: 409,
        data: { success: false, error: { code: 'CONFLICT', message: 'Já existe uma rota com este nome.' } },
      },
    });
    mockPost.mockRejectedValue(conflito);
    mockPatch.mockRejectedValue(conflito);

    const erroCadastro = await rotaComplementarService.criarRotaComplementar(dados).catch((e) => e);
    const erroEdicao = await rotaComplementarService.atualizarRotaComplementar(1, dados).catch((e) => e);

    expect(getErrorMessage(erroCadastro)).toBe('Já existe uma rota com este nome.');
    expect(getErrorMessage(erroEdicao)).toBe('Já existe uma rota com este nome.');
  });

  it('envia o horário de retorno que a API exige no cadastro e na edição (#350)', async () => {
    const resposta = {
      data: {
        success: true,
        data: {
          id: 3,
          nome: 'Van Sem Conexão',
          horario_saida: '06:30',
          horario_retorno: '17:30',
          ponto_conexao: 'Trevo do Bairro Novo',
          ativo: true,
          rota_principal: { id: 1, nome: 'Rota Centro - UFC', ativo: true },
        },
      },
    };
    mockPost.mockResolvedValue(resposta);
    mockPatch.mockResolvedValue(resposta);

    const criada = await rotaComplementarService.criarRotaComplementar(dados);
    await rotaComplementarService.atualizarRotaComplementar(3, dados);

    const corpo = {
      nome: 'Van Sem Conexão',
      horario_saida: '06:30',
      horario_retorno: '17:30',
      ponto_conexao: 'Trevo do Bairro Novo',
      rota_principal_id: 1,
    };
    expect(mockPost).toHaveBeenCalledWith('/rotas-complementares', corpo);
    expect(mockPatch).toHaveBeenCalledWith('/rotas-complementares/3', corpo);
    expect(criada.horario_retorno).toBe('17:30');
  });

  it('bloqueios de inativação e reativação chegam à tela com a mensagem da API (#362)', async () => {
    const bloqueio = (mensagem: string) =>
      Object.assign(new Error('Request failed with status code 409'), {
        response: { status: 409, data: { success: false, error: { code: 'CONFLICT', message: mensagem } } },
      });
    const reativar = 'Não é possível reativar esta rota complementar pois a rota principal vinculada está inativa.';
    const inativar = 'Esta rota possui agendamentos pendentes e não pode ser inativada no momento.';
    mockPatch.mockRejectedValueOnce(bloqueio(inativar)).mockRejectedValueOnce(bloqueio(reativar));

    const erroInativar = await rotaComplementarService.inativarRotaComplementar(1).catch((e) => e);
    const erroReativar = await rotaComplementarService.reativarRotaComplementar(2).catch((e) => e);

    expect(getErrorMessage(erroInativar)).toBe(inativar);
    expect(getErrorMessage(erroReativar)).toBe(reativar);
  });

  it('marca quando a rota principal vinculada está inativa (#362)', async () => {
    mockGet.mockResolvedValue({
      data: {
        id: 2,
        nome: 'Van Sítio',
        horario_saida: '06:15',
        horario_retorno: '18:10',
        ponto_conexao: 'Entrada do Sítio',
        ativo: false,
        rota_principal: { id: 2, nome: 'Rota Campo Velho - IFCE', ativo: false },
      },
    });

    const rc = await rotaComplementarService.obterRotaComplementarPorId(2);

    expect(rc.ativo).toBe(false);
    expect(rc.rota_principal_ativa).toBe(false);
  });

  it('lista ativas e inativas de uma vez, sem filtrar por nome na API (#363)', async () => {
    mockGet.mockResolvedValue({ data: [] });

    await rotaComplementarService.listarRotasComplementares();

    expect(mockGet).toHaveBeenCalledWith('/rotas-complementares', { params: { incluir_inativos: true } });
  });
});
