import { agendamentoService } from '../agendamentoService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('agendamentoService - HU-013 Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar opções de agendamento do backend', async () => {
    const mockData = {
      horariosIda: [{ label: '05:30', value: '05:30:00' }],
      horariosVolta: [{ label: '17:00', value: '17:00:00' }],
      pontosEmbarque: [{ label: 'Igreja Matriz', value: '1' }],
      faculdades: [{ label: 'UFC', value: '1' }],
      rotasComplementaresIda: [],
      rotasComplementaresVolta: [],
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const resultado = await agendamentoService.obterOpcoesAgendamento();
    expect(resultado).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/agendamentos/opcoes');
  });

  it('deve retornar dados fallback caso o backend falhe', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const resultado = await agendamentoService.obterOpcoesAgendamento();
    expect(resultado.horariosIda.length).toBeGreaterThan(0);
    expect(resultado.faculdades.length).toBeGreaterThan(0);
  });

  it('deve salvar agendamentos com sucesso', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true, count: 1 } });

    const agendamentos = [
      {
        dataIso: '2026-09-02',
        usaIda: true,
        horarioIda: '05:30:00',
        pontoEmbarqueIda: '1',
        faculdadeDestinoIda: '1',
        usaVolta: true,
        horarioVolta: '17:00:00',
        pontoDesembarqueVolta: '1',
        faculdadeOrigemVolta: '1',
      },
    ];

    const resultado = await agendamentoService.salvarAgendamentos(agendamentos);
    expect(resultado).toEqual({ success: true, count: 1 });
    expect(api.post).toHaveBeenCalledWith('/agendamentos', { agendamentos });
  });

  it('deve cancelar agendamento com sucesso', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const resultado = await agendamentoService.cancelarAgendamento('123');
    expect(resultado).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalledWith('/agendamentos/123');
  });
});
