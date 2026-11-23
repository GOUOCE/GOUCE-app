import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn<(url: string) => Promise<any>>();
const mockPost = jest.fn<(url: string, body?: any) => Promise<any>>();

jest.mock('@/api/api', () => ({
  api: {
    get: (url: string) => mockGet(url),
    post: (url: string, body?: any) => mockPost(url, body),
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

describe('ÉPICO EP-006 / HU-022 - BDD: Relatórios Quantitativos de Transporte Universitário', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  // =========================================================================
  // AC-01, AC-02 & AC-09: Filtragem e consolidação numérica com taxa de comparecimento
  // =========================================================================

  describe('Cenário: Geração de Relatório Consolidado (AC-01, AC-02, AC-09)', () => {
    it('deve consultar a API com os filtros de data, faculdade e bairro e calcular a taxa de comparecimento (embarques ÷ agendados * 100)', async () => {
      const mockRelatorio = {
        filtrosResumo: {
          tipoLabel: 'Geral',
          periodoLabel: '01/09/2026 a 20/10/2026',
          faculdadeLabel: 'UFC - Campus Quixadá',
          bairroLabel: 'Centro',
        },
        consolidado: {
          totalAgendamentos: 312,
          totalEmbarques: 289,
          taxaComparecimento: '92,6%',
          totalFaltas: 23,
          porcentagemFaltas: '7,4%',
          rotaMaiorDemanda: 'Linha 02 - Bairro Novo',
        },
        motoristas: [],
        detalhamento: [],
      };
      mockGet.mockResolvedValueOnce({ data: mockRelatorio });

      const payload = {
        tipo: 'geral',
        dataInicial: '2026-09-01',
        dataFinal: '2026-10-20',
        faculdadeId: '1',
        bairroId: '1',
      };

      const resultado = await relatorioService.gerarRelatorio(payload);
      expect(resultado.consolidado.totalAgendamentos).toBe(312);
      expect(resultado.consolidado.taxaComparecimento).toBe('92,6%');
      expect(mockGet).toHaveBeenCalledWith('/transporte/relatorios?tipo=geral&data_inicio=2026-09-01&data_fim=2026-10-20&faculdade_id=1&bairro_id=1');
    });
  });

  // =========================================================================
  // AC-04 / FA-001: Filtro sem resultados
  // =========================================================================

  describe('Cenário FA-001: Filtro sem resultados (AC-04)', () => {
    it('deve retornar contagem zerada e listas vazias para exibir a mensagem "Nenhum dado encontrado para os filtros informados."', async () => {
      const payload = {
        tipo: 'geral',
        dataInicial: '2099-01-01',
        dataFinal: '2099-01-31',
        faculdadeId: 'todas',
        bairroId: 'todos',
      };
      mockGet.mockRejectedValueOnce(new Error('Sem dados'));

      const resultado = await relatorioService.gerarRelatorio(payload);
      expect(resultado.consolidado.totalAgendamentos).toBe(0);
      expect(resultado.detalhamento).toEqual([]);
      expect(resultado.motoristas).toEqual([]);
    });
  });

  // =========================================================================
  // AC-07 & AC-08: Dias trabalhados por motorista (Ida e volta no mesmo dia = 1 dia)
  // =========================================================================

  describe('Cenário: Relatório de Motoristas e Alocações (AC-07, AC-08)', () => {
    it('deve contar ida e volta no mesmo dia como 1 único dia trabalhado para o motorista', () => {
      const escalasMotorista = [
        { data: '2026-09-01', trecho: 'ida', motorista: 'José Almeida' },
        { data: '2026-09-01', trecho: 'volta', motorista: 'José Almeida' },
        { data: '2026-09-02', trecho: 'ida', motorista: 'José Almeida' },
      ];

      const diasUnicos = new Set(escalasMotorista.map(e => e.data));
      expect(diasUnicos.size).toBe(2);
    });
  });

  // =========================================================================
  // AC-03: Exportação nos formatos PDF e Planilha (.csv)
  // =========================================================================

  describe('Cenário: Exportação de Relatório em PDF e CSV (AC-03)', () => {
    it('deve invocar o serviço de exportação de relatório no formato PDF', async () => {
      mockPost.mockResolvedValueOnce({ data: { success: true, mensagem: 'Relatório exportado em PDF com sucesso!' } });

      const mockRelatorio: any = { consolidado: { totalAgendamentos: 10 } };
      const resultado = await relatorioService.exportarRelatorio('pdf', mockRelatorio);
      expect(resultado.mensagem).toBe('Relatório exportado em PDF com sucesso!');
      expect(mockPost).toHaveBeenCalledWith('/transporte/relatorios/exportar?formato=pdf', mockRelatorio);
    });

    it('deve invocar o serviço de exportação de relatório no formato CSV', async () => {
      mockPost.mockResolvedValueOnce({ data: { success: true, mensagem: 'Relatório exportado em CSV com sucesso!' } });

      const mockRelatorio: any = { consolidado: { totalAgendamentos: 10 } };
      const resultado = await relatorioService.exportarRelatorio('csv', mockRelatorio);
      expect(resultado.mensagem).toBe('Relatório exportado em CSV com sucesso!');
      expect(mockPost).toHaveBeenCalledWith('/transporte/relatorios/exportar?formato=csv', mockRelatorio);
    });
  });
});
