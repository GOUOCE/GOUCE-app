import { describe, it, expect } from '@jest/globals';
import { abreviarParaLargura } from '../abreviarTexto';

describe('abreviarParaLargura', () => {
  it('não altera o texto enquanto o campo não foi medido', () => {
    expect(abreviarParaLargura('UFC - Universidade Federal do Ceará', 0, 68)).toBe('UFC - Universidade Federal do Ceará');
  });

  it('mantém texto que cabe no campo', () => {
    expect(abreviarParaLargura('Redenção', 160, 68)).toBe('Redenção');
  });

  it('abrevia com reticências o texto que não cabe', () => {
    const resultado = abreviarParaLargura('UFC - Universidade Federal do Ceará', 340, 108);
    expect(resultado.endsWith('…')).toBe(true);
    expect(resultado.length).toBeLessThanOrEqual(Math.floor((340 - 108) / 9));
  });
});
