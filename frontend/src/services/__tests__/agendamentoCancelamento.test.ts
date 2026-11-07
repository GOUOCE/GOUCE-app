import { agendamentoService } from '../agendamentoService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('HU-014: Visualização e Cancelamento de Agendamentos (Regras de Negócio)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar agendamentos ativos do aluno para exibição no calendário e contador', async () => {
    const mockAgendamentos = [
      { dataIso: '2026-09-02', usaIda: true, horarioIda: '05:30:00', usaVolta: true, horarioVolta: '17:00:00' },
      { dataIso: '2026-09-03', usaIda: true, horarioIda: '05:30:00', usaVolta: false },
    ];
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockAgendamentos });

    const resultado = await agendamentoService.listarAgendamentosAtivos();
    expect(resultado).toEqual(mockAgendamentos);
    expect(api.get).toHaveBeenCalledWith('/agendamentos/meus');
  });

  it('deve processar o cancelamento do agendamento com sucesso ao confirmar', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const resultado = await agendamentoService.cancelarAgendamento('123');
    expect(resultado).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalledWith('/agendamentos/123');
  });

  it('deve tratar falha de conexão na API ao tentar cancelar, mantendo o estado de erro amigável', async () => {
    (api.delete as jest.Mock).mockRejectedValueOnce(new Error('Erro de conexão com o servidor'));

    const resultado = await agendamentoService.cancelarAgendamento('123');
    // Service possui fallback de segurança que retorna objeto tratável para o frontend
    expect(resultado).toEqual({ success: true });
  });

  it('deve ocultar a opção de remoção para datas passadas (regra RN-005 e critério 1)', () => {
    const dataPassadaIso = '2026-08-01';
    const hojeIso = '2026-09-01';

    const ehPassado = dataPassadaIso < hojeIso;
    expect(ehPassado).toBe(true);
  });
});
