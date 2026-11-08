import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { avisoService } from '../avisoService';
import { api } from '../../api/api';

jest.mock('../../api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('avisoService (HU-023)', () => {
  const mockedGet = api.get as jest.MockedFunction<typeof api.get>;
  const mockedPost = api.post as jest.MockedFunction<typeof api.post>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lista avisos e filtra por título quando busca é informada', async () => {
    mockedGet.mockResolvedValueOnce({
      data: [
        {
          id: 2,
          titulo: 'Alteração de horário - Linha 02',
          descricao: 'Saída às 06h30.',
          autor_id: 1,
          data_criacao: '2026-09-01T07:30:00Z',
        },
        {
          id: 1,
          titulo: 'Manutenção preventiva no Ônibus 02',
          descricao: 'Ônibus 02 em manutenção.',
          autor_id: 1,
          data_criacao: '2026-08-31T18:15:00Z',
        },
      ],
    } as any);

    const resultado = await avisoService.listarAvisos('manutenção');

    expect(mockedGet).toHaveBeenCalledWith('/avisos', {
      params: { titulo: 'manutenção' },
    });
    expect(resultado).toHaveLength(1);
    expect(resultado[0].titulo).toBe('Manutenção preventiva no Ônibus 02');
  });

  it('cria um novo aviso limpando espaços excedentes', async () => {
    mockedPost.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'Aviso publicado com sucesso.',
        data: {
          id: 10,
          titulo: 'Reajuste no ponto de embarque',
          descricao: 'O ponto de embarque da Linha 02 foi reajustado.',
          autor_id: 42,
          data_criacao: '2026-09-01T09:00:00Z',
        },
      },
    } as any);

    const criado = await avisoService.criarAviso(
      '  Reajuste no   ponto de embarque ',
      '  O ponto de embarque da Linha 02 foi reajustado. '
    );

    expect(mockedPost).toHaveBeenCalledWith('/avisos', {
      titulo: 'Reajuste no ponto de embarque',
      descricao: 'O ponto de embarque da Linha 02 foi reajustado.',
    });
    expect(criado.id).toBe(10);
    expect(criado.titulo).toBe('Reajuste no ponto de embarque');
  });
});
