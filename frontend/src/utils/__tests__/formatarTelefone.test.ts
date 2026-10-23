import { describe, it, expect } from '@jest/globals';
import { formatarCelular } from '../formatarTelefone';

describe('formatarCelular', () => {
  it('aplica a máscara do cadastro em um celular completo', () => {
    expect(formatarCelular('88981234567')).toBe('(88) 9 8123-4567');
  });

  it('reformata um valor que já veio com máscara', () => {
    expect(formatarCelular('(88) 98123-4567')).toBe('(88) 9 8123-4567');
  });

  it('formata parcialmente enquanto faltam dígitos', () => {
    expect(formatarCelular('88')).toBe('(88');
    expect(formatarCelular('889812')).toBe('(88) 9812');
  });

  it('ignora dígitos além de 11', () => {
    expect(formatarCelular('889812345678')).toBe('(88) 9 8123-4567');
  });

  it('devolve vazio sem valor', () => {
    expect(formatarCelular(undefined)).toBe('');
    expect(formatarCelular('')).toBe('');
  });
});
