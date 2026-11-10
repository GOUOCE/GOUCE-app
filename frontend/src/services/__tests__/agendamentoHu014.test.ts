import { agendamentoService } from '../agendamentoService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('HU-014 - Service Tests (Visualização e Cancelamento de Agendamentos)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar agendamentos ativos do aluno com sucesso (Critério de Aceite 1 e 10)', async () => {
    const mockBackendResponse = {
      agendamentos: [
        { id: 1, data: '2026-08-31', usa_ida: true, usa_volta: true },
        { id: 2, data: '2026-09-01', usa_ida: true, usa_volta: true },
      ],
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockBackendResponse });

    const resultado = await agendamentoService.listarAgendamentosAtivos();
    expect(resultado).toEqual([
      { idAgendamento: 1, dataIso: '2026-08-31', usaIda: true, usaVolta: true, pontoEmbarqueIda: undefined, faculdadeDestinoIda: undefined, pontoDesembarqueVolta: undefined, faculdadeOrigemVolta: undefined, pode_remover: undefined, pode_editar: undefined },
      { idAgendamento: 2, dataIso: '2026-09-01', usaIda: true, usaVolta: true, pontoEmbarqueIda: undefined, faculdadeDestinoIda: undefined, pontoDesembarqueVolta: undefined, faculdadeOrigemVolta: undefined, pode_remover: undefined, pode_editar: undefined },
    ]);
    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/meus');
  });

  it('deve retornar lista vazia caso o aluno não possua agendamentos (FA-001 - Estado Vazio)', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: { agendamentos: [] } });

    const resultado = await agendamentoService.listarAgendamentosAtivos();
    expect(resultado).toEqual([]);
    expect(resultado.length).toBe(0);
  });

  it('deve realizar cancelamento sem exigência de horário limite de antecedência (RN-005 / Critério 5)', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const resultado = await agendamentoService.cancelarAgendamento('1');
    expect(resultado).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalledWith('/transporte/agendamentos/1');
  });

  it('deve tratar falha na comunicação com a API ao tentar cancelar (FA-004 / Issue #411)', async () => {
    (api.delete as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(agendamentoService.cancelarAgendamento('1')).rejects.toThrow('Network error');
  });
});
