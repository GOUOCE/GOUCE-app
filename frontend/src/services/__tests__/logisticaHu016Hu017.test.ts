import { logisticaService } from '../logisticaService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('ÉPICO EP-005 / HU-016 & HU-017 - Distribuição Logística e Alocação de Motoristas e Ônibus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // HU-016: Distribuição de Alunos nos Ônibus (Demanda, Vagas e Excedentes)
  // =========================================================================

  describe('HU-016 - Distribuição Logística de Alunos', () => {
    it('deve listar as linhas da distribuição logística com demanda de alunos, vagas e status', async () => {
      const mockResponse = {
        linhas: [
          {
            id: 1,
            nomeLinha: 'Linha 01 - Centro',
            horarioSaida: '06:40',
            horarioVolta: '17:40',
            faculdades: ['UFC', 'Unicatólica'],
            status: 'pendente',
            alunosAgendados: 38,
            alunosSentados: 32,
            alunosEmPe: 6,
            capacidadeSentados: 42,
            capacidadeEmPe: 8,
          },
        ],
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const resultado = await logisticaService.listarDistribuicaoLogistica('2026-09-01', 'proximos');
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nomeLinha).toBe('Linha 01 - Centro');
      expect(resultado[0].alunosAgendados).toBe(38);
      expect(resultado[0].status).toBe('pendente');
      expect(api.get).toHaveBeenCalledWith('/transporte/logistica/distribuicao?data=2026-09-01&tab=proximos');
    });

    it('deve listar alunos excedentes de uma linha superlotada', async () => {
      const mockExcedentes = {
        alunos: [
          { id: 301, nome: 'Felipe Maia', iniciais: 'FM', trajetoText: 'Pça. Matriz ↔ UFC', selecionado: true },
          { id: 302, nome: 'João Vitor', iniciais: 'JV', trajetoText: 'Pça. Matriz ➔ Unicatólica', selecionado: true },
        ],
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockExcedentes });

      const resultado = await logisticaService.listarAlunosExcedentes('3', '2026-09-02');
      expect(resultado).toHaveLength(2);
      expect(resultado[0].nome).toBe('Felipe Maia');
      expect(api.get).toHaveBeenCalledWith('/transporte/logistica/excedentes?linha_id=3&data=2026-09-02');
    });

    it('deve confirmar realocação dos alunos excedentes para outro ônibus', async () => {
      const mockConfirm = { success: true, mensagem: 'Realocação confirmada com sucesso' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockConfirm });

      const payload = {
        linhaOrigemId: '3',
        dataIso: '2026-09-02',
        onibusDestinoId: '201',
        alunosIds: [301, 302],
      };

      const resultado = await logisticaService.confirmarRealocacao(payload);
      expect(resultado).toEqual(mockConfirm);
      expect(api.post).toHaveBeenCalledWith('/transporte/logistica/realocar', payload);
    });
  });

  // =========================================================================
  // HU-017: Alocação de Motoristas e Ônibus às Rotas
  // =========================================================================

  describe('HU-017 - Alocação de Motoristas e Frota', () => {
    it('deve obter opções de ônibus e motoristas disponíveis para alocação', async () => {
      const mockOpcoes = {
        onibusOptions: [{ label: 'Ônibus 07', value: '201' }],
        motoristaOptions: [{ label: 'Ana Souza', value: '101' }],
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockOpcoes });

      const resultado = await logisticaService.obterOpcoesAlocacao('1', '2026-09-02');
      expect(resultado.onibusOptions).toHaveLength(1);
      expect(resultado.motoristaOptions).toHaveLength(1);
      expect(api.get).toHaveBeenCalledWith('/transporte/logistica/opcoes?linha_id=1&data=2026-09-02');
    });

    it('deve confirmar a alocação do binômio ônibus + motorista à rota', async () => {
      const mockConfirm = { success: true, mensagem: 'Alocação confirmada com sucesso' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: mockConfirm });

      const payload = {
        linhaId: '1',
        dataIso: '2026-09-02',
        onibusId: '201',
        motoristaId: '101',
      };

      const resultado = await logisticaService.confirmarAlocacao(payload);
      expect(resultado).toEqual(mockConfirm);
      expect(api.post).toHaveBeenCalledWith('/transporte/logistica/alocar', payload);
    });
  });
});
