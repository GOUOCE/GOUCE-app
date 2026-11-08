import { describe, it, expect } from '@jest/globals';
import {
  formatarDataNascimento,
  formatarDataPublicacaoAviso,
} from '../formatarData';

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

describe('formatarDataPublicacaoAviso', () => {
  const referencia = new Date(2026, 8, 1, 12, 0, 0); // 01/09/2026 12:00

  it('formata avisos publicados hoje, ontem e anteontem igual ao protótipo', () => {
    expect(
      formatarDataPublicacaoAviso(new Date(2026, 8, 1, 7, 30, 0), referencia)
    ).toBe('Publicado hoje às 07:30, 01/09/2026');

    expect(
      formatarDataPublicacaoAviso(new Date(2026, 7, 31, 18, 15, 0), referencia)
    ).toBe('Publicado ontem às 18:15, 31/08/2026');

    expect(
      formatarDataPublicacaoAviso(new Date(2026, 7, 30, 9, 0, 0), referencia)
    ).toBe('Publicado anteontem às 09:00, 30/08/2026');
  });
});
