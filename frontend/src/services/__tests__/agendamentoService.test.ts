import { agendamentoService } from '../agendamentoService';
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
}));

describe('agendamentoService - HU-013 Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar opções de agendamento do backend', async () => {
    const mockData = {
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
    expect(resultado.pontosEmbarque.length).toBeGreaterThan(0);
    expect(resultado.faculdades.length).toBeGreaterThan(0);
  });

  it('deve criar agendamentos com sucesso', async () => {
    const payload = {
      data: '2026-09-02',
      usa_ida: true,
      usa_volta: true,
      ponto_embarque_id: 1,
      ies_destino_id: 1,
    };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true, agendamento_criado: true } });

    const resultado = await agendamentoService.criarAgendamento(payload);
    expect(resultado).toEqual({ success: true, agendamento_criado: true });
    expect(api.post).toHaveBeenCalledWith('/transporte/agendamentos', payload);
  });

  it('deve cancelar agendamento com sucesso', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const resultado = await agendamentoService.cancelarAgendamento('123');
    expect(resultado).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalledWith('/transporte/agendamentos/123');
  });
});
