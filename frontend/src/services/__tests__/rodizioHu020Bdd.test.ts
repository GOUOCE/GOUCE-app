import { rodizioService, RodizioPayload } from '../rodizioService';
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

const payload: RodizioPayload = {
  data_inicio: '2026-11-23',
  semanas: 4,
  itens: [
    { rota_id: 1, onibus_id: 'ABC1D23', turno: 'ida' },
    { rota_id: 2, onibus_id: 'XYZ9K87', turno: 'ida' },
    { rota_id: 1, onibus_id: 'XYZ9K87', turno: 'volta' },
    { rota_id: 2, onibus_id: 'ABC1D23', turno: 'volta' },
  ],
};

describe('ÉPICO EP-005 / HU-020 - BDD: Configuração e Alternância de Rodízio de Frota', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve listar o contexto do rodízio com rotas ativas e ônibus ativos (AC-01)', async () => {
    const contexto = {
      ativa: false,
      configuracao: null,
      rotas: [
        { id: 1, nome: 'Rota Centro - UFC', horario_saida: null, horario_retorno: null },
        { id: 2, nome: 'Rota Campo Velho - UFC', horario_saida: null, horario_retorno: null },
      ],
      onibus: [
        { placa: 'ABC1D23', apelido: 'Ônibus Centro', assentos: 40, capacidade_em_pe: 10 },
        { placa: 'XYZ9K87', apelido: 'Ônibus Campo', assentos: 28, capacidade_em_pe: 6 },
      ],
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: contexto });

    const resultado = await rodizioService.obterContexto();

    expect(resultado).toEqual(contexto);
    expect(api.get).toHaveBeenCalledWith('/rodizio-frota');
  });

  it('deve gerar a prévia sem persistir e sinalizar alerta de capacidade (AC-03, AC-04)', async () => {
    const previa = {
      ativa: false,
      data_inicio: '2026-11-23',
      semanas: 4,
      escalas: [
        {
          semana: 1,
          data_inicio: '2026-11-23',
          data_fim: '2026-11-29',
          itens: [
            {
              rota_id: 1,
              rota_nome: 'Rota Centro - UFC',
              onibus_id: 'ABC1D23',
              turno: 'ida' as const,
              demanda_prevista: 50,
              capacidade_assentos: 40,
              capacidade_em_pe: 10,
              alerta_capacidade: 'Atenção: O veículo selecionado pode não atender à demanda prevista para esta rota',
            },
          ],
        },
      ],
      alertas: [
        {
          semana: 1,
          rota_id: 1,
          onibus_id: 'ABC1D23',
          mensagem: 'Atenção: O veículo selecionado pode não atender à demanda prevista para esta rota',
        },
      ],
    };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: previa });

    const resultado = await rodizioService.gerarPrevia(payload);

    expect(resultado).toEqual(previa);
    expect(api.post).toHaveBeenCalledWith('/rodizio-frota/preview', payload);
  });

  it('deve confirmar o rodízio com a mensagem de sucesso exigida pela HU-020 (AC-06)', async () => {
    const resposta = {
      mensagem: 'Rodízio configurado e aplicado com sucesso',
      configuracao: {
        id: 1,
        data_inicio: '2026-11-23',
        semanas: 4,
        itens: payload.itens,
      },
    };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: resposta });

    const resultado = await rodizioService.confirmar(payload);

    expect(resultado).toEqual(resposta);
    expect(api.post).toHaveBeenCalledWith('/rodizio-frota/confirmar', payload);
  });

  it('deve propagar erro da API sem inventar dados de rodízio', async () => {
    const erro = {
      response: {
        data: {
          success: false,
          error: {
            code: 'RODIZIO_INVALIDO',
            message: 'O mesmo ônibus não pode ser alocado a mais de uma rota no mesmo dia e horário.',
          },
        },
      },
    };
    (api.get as jest.Mock).mockRejectedValueOnce(erro);

    await expect(rodizioService.obterContexto()).rejects.toBe(erro);
  });
});
