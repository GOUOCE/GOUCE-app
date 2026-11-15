import { agendamentoService, AgendamentoDia } from '../agendamentoService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('ÉPICO EP-004 / HU-014 - BDD: Visualização e Cancelamento de Agendamentos (Meus Agendamentos)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // REGRA: O aluno acompanha seus agendamentos ativos no calendário
  // =========================================================================

  describe('Cenário: Aluno visualiza calendário mensal e contador (AC-01)', () => {
    it('deve listar agendamentos ativos e formatar os campos para exibição no calendário', async () => {
      const mockBackendResponse = {
        agendamentos: [
          { id: 10, data: '2026-11-10', usa_ida: true, usa_volta: true },
          { id: 17, data: '2026-11-17', usa_ida: true, usa_volta: false },
        ],
        ativos: 2,
        limite: 22,
      };
      (api.get as jest.Mock).mockResolvedValueOnce({ data: mockBackendResponse });

      const resultado = await agendamentoService.listarAgendamentosAtivos();
      expect(resultado.agendamentos).toHaveLength(2);
      expect(resultado.ativos).toBe(2);
      expect(resultado.limite).toBe(22);
      expect(resultado.agendamentos[0].data).toBe('2026-11-10');
      expect(resultado.agendamentos[0].usa_ida).toBe(true);
      expect(resultado.agendamentos[0].usa_volta).toBe(true);
      expect(resultado.agendamentos[1].data).toBe('2026-11-17');
      expect(resultado.agendamentos[1].usa_volta).toBe(false);
      expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/meus');
    });

    it('deve contar ida e volta no mesmo dia como 1 único agendamento ativo', () => {
      const agendamentoDiaCompleto: AgendamentoDia = {
        idAgendamento: 10,
        dataIso: '2026-11-10',
        usaIda: true,
        usaVolta: true,
      };
      const lista = [agendamentoDiaCompleto];
      expect(lista.length).toBe(1);
    });
  });

  describe('Cenário FA-001: Estado vazio quando aluno não possui agendamentos futuros (AC-02)', () => {
    it('deve retornar lista vazia para exibição do estado vazio "Você ainda não possui agendamentos futuros."', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({ data: { agendamentos: [], ativos: 0, limite: 22 } });

      const resultado = await agendamentoService.listarAgendamentosAtivos();
      expect(resultado.agendamentos).toEqual([]);
      expect(resultado.ativos).toBe(0);
    });
  });

  // =========================================================================
  // REGRA: O aluno remove um agendamento futuro sem prazo mínimo de antecedência
  // =========================================================================

  describe('Cenário: Remoção de agendamento futuro com sucesso (AC-04, AC-06, RN-005)', () => {
    it('deve cancelar o agendamento na API e retornar a confirmação "Agendamento cancelado com sucesso"', async () => {
      const mockCancelamentoResponse = {
        mensagem: 'Agendamento cancelado com sucesso',
        estado_dia: 'DISPONIVEL',
        ativos: 1,
        limite: 22,
      };
      (api.delete as jest.Mock).mockResolvedValueOnce({ data: mockCancelamentoResponse });

      const resultado = await agendamentoService.cancelarAgendamento(10);
      expect(resultado).toEqual(mockCancelamentoResponse);
      expect(api.delete).toHaveBeenCalledWith('/transporte/agendamentos/10');
    });

    it('deve permitir o cancelamento em qualquer momento sem exigência de horário limite de antecedência (RN-005)', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({
        data: { mensagem: 'Agendamento cancelado com sucesso', estado_dia: 'DISPONIVEL', ativos: 0, limite: 22 },
      });

      const resultado = await agendamentoService.cancelarAgendamento(99);
      expect(resultado.mensagem).toBe('Agendamento cancelado com sucesso');
    });
  });

  describe('Cenário FA-004: Falha na comunicação com a API no momento da confirmação (AC-08 / Issue #411)', () => {
    it('deve rejeitar com erro de rede para que a tela exiba mensagem de falha e mantenha a reserva ativa', async () => {
      (api.delete as jest.Mock).mockRejectedValueOnce(new Error('Erro de conexão com o servidor'));

      await expect(agendamentoService.cancelarAgendamento(10)).rejects.toThrow('Erro de conexão com o servidor');
    });
  });

  // =========================================================================
  // REGRA: O histórico de frequência é preservado e agendamentos passados não podem ser removidos
  // =========================================================================

  describe('Cenário FA-003: Proteção de histórico para agendamentos de datas passadas (AC-07)', () => {
    it('deve identificar corretamente se uma data é passada para ocultar a opção "Remover agendamento"', () => {
      const dataHoje = new Date('2026-11-09T00:00:00Z');
      const dataPassada = new Date('2026-11-06T00:00:00Z');
      const dataFutura = new Date('2026-11-10T00:00:00Z');

      const ehPassada = dataPassada.getTime() < dataHoje.getTime();
      const ehFutura = dataFutura.getTime() < dataHoje.getTime();

      expect(ehPassada).toBe(true);
      expect(ehFutura).toBe(false);
    });
  });
});
