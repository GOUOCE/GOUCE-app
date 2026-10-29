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

const semConexao = Object.assign(new Error('Network Error'), { request: {} });

const dados = {
  nome: 'Van Sem Conexão',
  rotaPrincipalId: 1,
  horarioSaida: '06:30',
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
});
