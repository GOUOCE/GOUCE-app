import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../faculdadeService', () => ({
  faculdadeService: {
    listarFaculdades: jest.fn(() =>
      Promise.resolve([
        { id: 1, nome: 'UFC', sigla: 'UFC', campus: 'Campus Quixadá', ativo: true },
        { id: 7, nome: 'Instituto Federal do Ceará', sigla: 'IFCE', campus: 'Campus Quixadá', ativo: true },
      ])
    ),
  },
}));

import { resolverFaculdadeId } from '../userService';

describe('resolverFaculdadeId - faculdade_id enviado ao cadastro e à renovação (#192)', () => {
  it('mantém o id quando o valor já é numérico', async () => {
    await expect(resolverFaculdadeId(1)).resolves.toBe('1');
    await expect(resolverFaculdadeId('7')).resolves.toBe('7');
  });

  it('converte o nome exibido no seletor no id da faculdade', async () => {
    await expect(resolverFaculdadeId('UFC')).resolves.toBe('1');
    await expect(resolverFaculdadeId('instituto federal do ceará')).resolves.toBe('7');
  });

  it('aceita o nome antigo do seletor, que começa pela sigla', async () => {
    await expect(resolverFaculdadeId('UFC - Universidade Federal do Ceará')).resolves.toBe('1');
  });

  it('recusa instituição que não existe no cadastro, com mensagem clara', async () => {
    await expect(resolverFaculdadeId('Estácio')).rejects.toThrow('Instituição de ensino não encontrada');
    await expect(resolverFaculdadeId('')).rejects.toThrow('Instituição de ensino não encontrada');
  });
});
