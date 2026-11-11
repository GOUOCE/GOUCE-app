import { agendamentoService } from '../agendamentoService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
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
    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/opcoes');
  });

  it('deve propagar erro ao falhar o carregamento das opções', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(agendamentoService.obterOpcoesAgendamento()).rejects.toThrow('Network error');
  });

  it('deve buscar o calendário com o mês informado', async () => {
    const mockData = {
      mes: '2026-11',
      dias: [],
      ativos: 0,
      limite: 22,
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockData });

    const resultado = await agendamentoService.obterCalendario('2026-11');
    expect(resultado).toEqual(mockData);
    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/calendario', {
      params: { mes: '2026-11' },
    });
  });

  it('deve listar e normalizar os agendamentos ativos', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({
      data: {
        agendamentos: [
          {
            id: 7,
            data: '2026-11-12',
            usa_ida: true,
            usa_volta: false,
            ponto_embarque_id: 1,
            ies_destino_id: 2,
          },
        ],
        ativos: 1,
        limite: 22,
      },
    });

    const resultado = await agendamentoService.listarAgendamentosAtivos();

    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/meus');
    expect(resultado).toEqual(
      expect.objectContaining({
        ativos: 1,
        limite: 22,
        agendamentos: [
          expect.objectContaining({
            id: 7,
            data: '2026-11-12',
            usa_ida: true,
            usa_volta: false,
          }),
        ],
      })
    );
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

  it('deve propagar erro ao falhar a criação do agendamento', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('Conflict'));

    await expect(
      agendamentoService.criarAgendamento({ data: '2026-09-02', usa_ida: true, usa_volta: false })
    ).rejects.toThrow('Conflict');
  });

  it('deve atualizar o agendamento informando o id real', async () => {
    (api.put as jest.Mock).mockResolvedValueOnce({ data: { estado_dia: 'AGENDADO' } });

    await agendamentoService.atualizarAgendamento(42, {
      data: '2026-09-02',
      usa_ida: true,
      usa_volta: false,
    });

    expect(api.put).toHaveBeenCalledWith('/transporte/agendamentos/42', {
      data: '2026-09-02',
      usa_ida: true,
      usa_volta: false,
    });
  });

  it('deve cancelar agendamento com sucesso usando o id real', async () => {
    (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    const resultado = await agendamentoService.cancelarAgendamento(123);
    expect(resultado).toEqual({ success: true });
    expect(api.delete).toHaveBeenCalledWith('/transporte/agendamentos/123');
  });

  it('deve propagar erro ao falhar o cancelamento', async () => {
    (api.delete as jest.Mock).mockRejectedValueOnce(new Error('Not found'));

    await expect(agendamentoService.cancelarAgendamento(123)).rejects.toThrow('Not found');
  });
});
