import { describe, it, expect } from '@jest/globals';
import { formatarDataNascimento } from '../formatarData';

describe('formatarDataNascimento', () => {
  it('converte o número AAAAMMDD guardado pela API em DD/MM/AAAA', () => {
    expect(formatarDataNascimento(20050621)).toBe('21/06/2005');
    expect(formatarDataNascimento('20050621')).toBe('21/06/2005');
  });

  it('converte a data no formato ISO', () => {
    expect(formatarDataNascimento('2005-06-21')).toBe('21/06/2005');
    expect(formatarDataNascimento('2005-06-21T00:00:00Z')).toBe('21/06/2005');
  });

  it('devolve vazio sem data e mantém valores que já não reconhece', () => {
    expect(formatarDataNascimento(null)).toBe('');
    expect(formatarDataNascimento(undefined)).toBe('');
    expect(formatarDataNascimento('21/06/2005')).toBe('21/06/2005');
  });
});
