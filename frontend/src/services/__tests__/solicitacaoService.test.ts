import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn<(url: string, config: any) => Promise<any>>();
jest.mock('../../api/api', () => ({ api: { get: (url: string, config: any) => mockGet(url, config) } }));

import { solicitacaoService } from '../solicitacaoService';

describe('solicitacaoService.listarSolicitacoes - fila do administrador (HU-028)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation(async (_url, config) => {
      if (config.params.status === 'pendente') {
        return { data: [{ id: 1, nome: 'Novo Cadastro', status_cadastro: 'pendente', data_hora_envio_analise: '2026-10-20T10:00:00Z' }] };
      }
      return { data: [{ id: 2, nome: 'Renovação', status_cadastro: 'analise_renovacao', data_hora_envio_analise: '2026-10-19T10:00:00Z' }] };
    });
  });

  it('busca cadastros novos e renovações por padrão', async () => {
    const lista = await solicitacaoService.listarSolicitacoes();

    expect(mockGet.mock.calls.map(([, config]) => config.params.status)).toEqual(['pendente', 'analise_renovacao']);
    expect(lista.map((item) => item.status_cadastro).sort()).toEqual(['analise_renovacao', 'pendente']);
  });

  it('ordena pela data de envio, mais antigas primeiro', async () => {
    const lista = await solicitacaoService.listarSolicitacoes();

    expect(lista.map((item) => item.id)).toEqual([2, 1]);
  });

  it('continua aceitando um único status', async () => {
    const lista = await solicitacaoService.listarSolicitacoes('pendente');

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(lista.map((item) => item.id)).toEqual([1]);
  });
});

describe('solicitacaoService.obterDetalhes - instituição do aluno (#192)', () => {
  it('monta "SIGLA - Campus" com o nome que a API devolve, sem mostrar o id da faculdade', async () => {
    mockGet.mockResolvedValue({
      data: { id: 6, nome: 'Marcos Vinícius', status_cadastro: 'pendente', faculdade_id: 1, sigla_faculdade: 'UFC', nome_faculdade: 'Universidade Federal do Ceará', campus: 'Quixadá' },
    });

    const detalhes = await solicitacaoService.obterDetalhes(6);

    expect(detalhes.instituicao).toBe('UFC - Quixadá');
  });

  it('deixa a instituição vazia quando a API não envia a faculdade, sem valor de exemplo', async () => {
    mockGet.mockResolvedValue({ data: { id: 7, nome: 'Sem Faculdade', status_cadastro: 'pendente', faculdade_id: 1 } });

    expect((await solicitacaoService.obterDetalhes(7)).instituicao).toBe('');
  });
});

describe('solicitacaoService.obterDetalhes - bairro do aluno (HU-027, #366)', () => {
  it('usa o nome do bairro que a API devolve', async () => {
    mockGet.mockResolvedValue({ data: { id: 2, nome: 'Zuleide Andrade', status_cadastro: 'pendente', bairro: 'Centro' } });

    expect((await solicitacaoService.obterDetalhes(2)).bairro).toBe('Centro');
  });
});
