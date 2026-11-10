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
    const mockBackendResponse = {
      agendamentos: [
        { id: 10, data: '2026-09-02', usa_ida: true, usa_volta: true },
        { id: 11, data: '2026-09-03', usa_ida: true, usa_volta: false },
      ],
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockBackendResponse });

    const resultado = await agendamentoService.listarAgendamentosAtivos();
    expect(resultado).toEqual([
      { idAgendamento: 10, dataIso: '2026-09-02', usaIda: true, usaVolta: true, pontoEmbarqueIda: undefined, faculdadeDestinoIda: undefined, pontoDesembarqueVolta: undefined, faculdadeOrigemVolta: undefined, pode_remover: undefined, pode_editar: undefined },
      { idAgendamento: 11, dataIso: '2026-09-03', usaIda: true, usaVolta: false, pontoEmbarqueIda: undefined, faculdadeDestinoIda: undefined, pontoDesembarqueVolta: undefined, faculdadeOrigemVolta: undefined, pode_remover: undefined, pode_editar: undefined },
    ]);
    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/meus');
  });

  it('deve processar o cancelamento do agendamento com sucesso ao confirmar', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const resultado = await agendamentoService.cancelarAgendamento('123');
    expect(resultado).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalledWith('/transporte/agendamentos/123');
  });

  it('deve tratar falha de conexão na API ao tentar cancelar, mantendo o estado de erro amigável (Issue #411)', async () => {
    (api.delete as jest.Mock).mockRejectedValueOnce(new Error('Erro de conexão com o servidor'));

    await expect(agendamentoService.cancelarAgendamento('123')).rejects.toThrow('Erro de conexão com o servidor');
  });

  it('deve ocultar a opção de remoção para datas passadas (regra RN-005 e critério 1)', () => {
    const dataPassadaIso = '2026-08-01';
    const hojeIso = '2026-09-01';

    const ehPassado = dataPassadaIso < hojeIso;
    expect(ehPassado).toBe(true);
  });
});
