import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn<(url: string) => Promise<any>>();
const mockPost = jest.fn<
  (url: string, body?: any, config?: any) => Promise<any>
>();

jest.mock('@/api/api', () => ({
  api: {
    get: (url: string) => mockGet(url),
    post: (url: string, body?: any, config?: any) => mockPost(url, body, config),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

import { relatorioService } from '../relatorioService';

describe('ÉPICO EP-006 / HU-022 - Relatórios Quantitativos de Transporte Universitário', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  it('consulta a API com os filtros e mapeia consolidação e detalhamento reais', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        tipo: 'agendamentos',
        mensagem: null,
        filtrosResumo: {
          tipoLabel: 'Relatório de Agendamentos',
          periodoLabel: '16/11/2026 a 20/11/2026',
          faculdadeLabel: 'UFC',
          bairroLabel: 'Centro',
        },
        consolidado: {
          totalAgendamentos: 312,
          totalEmbarques: 289,
          totalFaltas: 23,
          comparecimento: '92,6%',
          porcentagemFaltas: '7,4%',
          rotaMaiorDemanda: 'Rota Centro - UFC',
        },
        detalhamento: [
          {
            data: '16/11/2026',
            rota: 'Rota Centro - UFC',
            turno: 'IDA',
            faculdade: 'UFC',
            bairro: 'Centro',
            agendados: 40,
            embarques: 37,
            faltas: 3,
            comparecimento: '92,5%',
            porcentagemFaltas: '7,5%',
          },
        ],
        motoristas: [],
      },
    });

    const resultado = await relatorioService.gerarRelatorio({
      tipo: 'agendamentos',
      dataInicial: '2026-11-16',
      dataFinal: '2026-11-20',
      faculdadeId: '1',
      bairroId: '2',
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/transporte/relatorios?tipo=agendamentos&data_inicio=2026-11-16&data_fim=2026-11-20&faculdade_id=1&bairro_id=2',
    );
    expect(resultado.consolidado.taxaComparecimento).toBe('92,6%');
    expect(resultado.detalhamento[0]).toMatchObject({
      linhaNome: 'Rota Centro - UFC',
      faculdadeDestino: 'UFC',
      localidade: 'Centro',
      embarquesEfetivos: 37,
      taxaPresenca: '92,5%',
    });
  });

  it('omite filtros "todas/todos" da URL', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        filtrosResumo: {},
        consolidado: {},
        detalhamento: [],
        motoristas: [],
      },
    });

    await relatorioService.gerarRelatorio({
      tipo: 'motoristas',
      dataInicial: '2026-11-16',
      dataFinal: '2026-11-20',
      faculdadeId: 'todas',
      bairroId: 'todos',
    });

    expect(mockGet).toHaveBeenCalledWith(
      '/transporte/relatorios?tipo=motoristas&data_inicio=2026-11-16&data_fim=2026-11-20',
    );
  });

  it('exibe a mensagem oficial quando a API não encontra dados', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        tipo: 'agendamentos',
        mensagem: 'Nenhum dado encontrado para os filtros informados.',
        filtrosResumo: {
          tipoLabel: 'Relatório de Agendamentos',
          periodoLabel: '01/01/2099 a 31/01/2099',
          faculdadeLabel: 'Todas as faculdades',
          bairroLabel: 'Todos os bairros',
        },
        consolidado: {
          totalAgendamentos: 0,
          totalEmbarques: 0,
          totalFaltas: 0,
          comparecimento: '0,0%',
          porcentagemFaltas: '0,0%',
          rotaMaiorDemanda: '-',
        },
        detalhamento: [],
        motoristas: [],
      },
    });

    const resultado = await relatorioService.gerarRelatorio({
      tipo: 'agendamentos',
      dataInicial: '2099-01-01',
      dataFinal: '2099-01-31',
    });

    expect(resultado.mensagem).toBe('Nenhum dado encontrado para os filtros informados.');
    expect(resultado.consolidado.totalAgendamentos).toBe(0);
    expect(resultado.detalhamento).toEqual([]);
    expect(resultado.motoristas).toEqual([]);
  });

  it('não inventa dados quando a API falha', async () => {
    mockGet.mockRejectedValueOnce(new Error('Erro de rede'));

    await expect(
      relatorioService.gerarRelatorio({
        tipo: 'agendamentos',
        dataInicial: '2026-11-16',
        dataFinal: '2026-11-20',
      }),
    ).rejects.toThrow('Erro de rede');
  });

  it('mapeia rotas e escalas de motoristas vindas da API', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        tipo: 'motoristas',
        mensagem: null,
        filtrosResumo: {},
        consolidado: {},
        detalhamento: [],
        motoristas: [
          {
            nome: 'João da Silva',
            diasTrabalhados: 2,
            rotas: ['Rota Centro - UFC'],
            ativo: false,
            escalas: [
              { data: '16/11/2026', rota: 'Rota Centro - UFC', turno: 'Ida' },
              { data: '16/11/2026', rota: 'Rota Centro - UFC', turno: 'Volta' },
            ],
          },
        ],
      },
    });

    const resultado = await relatorioService.gerarRelatorio({
      tipo: 'motoristas',
      dataInicial: '2026-11-16',
      dataFinal: '2026-11-20',
    });

    expect(resultado.motoristas[0]).toMatchObject({
      nome: 'João da Silva',
      diasTrabalhados: 2,
      rotasAlocadas: 'Rota Centro - UFC',
      ativo: false,
    });
    expect(resultado.motoristas[0].escalaResumo).toContain('16/11/2026');
    expect(resultado.motoristas[0].escalaResumo).toContain('Volta');
  });

  it.each(['pdf', 'csv'] as const)(
    'exporta %s como arquivo binário com nome e mensagem da API',
    async (formato) => {
      mockPost.mockResolvedValueOnce({
        data: new Uint8Array([37, 80, 68, 70]),
        headers: {
          'content-disposition': `attachment; filename="relatorio-agendamentos.${formato}"`,
          'x-mensagem-relatorio': 'Arquivo gerado com sucesso.',
        },
      });

      const relatorio: any = {
        tipo: 'agendamentos',
        filtrosResumo: {},
        consolidado: { totalAgendamentos: 10 },
        detalhamento: [],
        motoristas: [],
      };

      const resultado = await relatorioService.exportarRelatorio(formato, relatorio);

      expect(mockPost).toHaveBeenCalledWith(
        `/transporte/relatorios/exportar?formato=${formato}`,
        relatorio,
        { responseType: 'arraybuffer' },
      );
      expect(resultado.nomeArquivo).toBe(`relatorio-agendamentos.${formato}`);
      expect(resultado.mensagem).toBe('Arquivo gerado com sucesso.');
      expect(resultado.blob.size).toBeGreaterThan(0);
    },
  );
});
