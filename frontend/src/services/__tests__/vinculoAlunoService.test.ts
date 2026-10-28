import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import { api } from '../../api/api';
import { carregarVinculosAtivos, validarVinculosAluno } from '../vinculoAlunoService';
import { userService } from '../userService';
import type { AlunoFormData } from '../../schemas/alunoSchema';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../api/api', () => ({
  api: { get: jest.fn(), defaults: { baseURL: 'http://api.test' } },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const mockSend = jest.fn();
const originalXHR = globalThis.XMLHttpRequest;
const dados = { bairro: '7', instituicao: '9' } as AlunoFormData;

beforeEach(() => {
  mockGet.mockReset();
  mockSend.mockClear();
  mockGet.mockImplementation(async (url) => ({ data: url === '/bairros'
    ? [
        { bairro_id: 7, nome: 'Serra do Estêvão', ativo: true },
        { bairro_id: 8, nome: 'Centro antigo', ativo: false },
      ]
    : [
        { id_faculdade: 9, nome_faculdade: 'Universidade', sigla: 'UNI', campus_faculdade: 'Quixadá', ativo: true },
        { id_faculdade: 10, nome_faculdade: 'Instituto', ativo: false },
      ],
  }) as any);
  class FakeXHR {
    status = 201;
    responseText = '{"success":true}';
    onload?: () => void;
    open() {}
    setRequestHeader() {}
    send(body: FormData) { mockSend(body); this.onload?.(); }
  }
  globalThis.XMLHttpRequest = FakeXHR as any;
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  globalThis.XMLHttpRequest = originalXHR;
  jest.restoreAllMocks();
});

describe('Vínculos do cadastro e renovação de aluno', () => {
  it('carrega apenas bairros e instituições ativos, com IDs reais', async () => {
    const opcoes = await carregarVinculosAtivos();
    expect(opcoes.bairros.map((b) => b.id)).toEqual([7]);
    expect(opcoes.faculdades.map((f) => f.id)).toEqual([9]);
    await expect(validarVinculosAluno('7', '9')).resolves.toEqual({ bairroId: '7', faculdadeId: '9' });
  });

  it('preserva listas vazias sem inserir opções de exemplo', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await expect(carregarVinculosAtivos()).resolves.toEqual({ bairros: [], faculdades: [] });
  });

  it('repassa falhas de consulta, inclusive de faculdades, sem fallback para mocks', async () => {
    mockGet.mockRejectedValue(new Error('Network Error'));
    await expect(carregarVinculosAtivos()).rejects.toThrow('Network Error');
  });

  for (const metodo of ['register', 'renovarVinculo'] as const) {
    it(`${metodo}: envia os IDs escolhidos no FormData`, async () => {
      const append = jest.spyOn(FormData.prototype, 'append');
      await userService[metodo](dados);
      expect(append).toHaveBeenCalledWith('bairro_id', '7');
      expect(append).toHaveBeenCalledWith('faculdade_id', '9');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it(`${metodo}: bloqueia nomes, Outro/Outra e vínculos não cadastrados antes do envio`, async () => {
      for (const atualizacao of [
        { bairro: 'Centro' }, { bairro: 'Outro', bairroEspecifico: 'Bairro ausente' },
        { instituicao: 'Outra', instituicaoEspecifica: 'Faculdade ausente' },
        { bairro: '999' }, { instituicao: '999' }, { bairro: '8' }, { instituicao: '10' },
      ]) {
        await expect(userService[metodo]({ ...dados, ...atualizacao })).rejects.toThrow();
      }
      expect(mockSend).not.toHaveBeenCalled();
    });

    it(`${metodo}: falha na busca não continua para POST/PUT`, async () => {
      mockGet.mockRejectedValue(new Error('Network Error'));
      await expect(userService[metodo](dados)).rejects.toThrow('Network Error');
      expect(mockSend).not.toHaveBeenCalled();
    });
  }
});
