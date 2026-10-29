import { describe, it, expect } from '@jest/globals';

import { formatarHorario } from '../formatarHorario';

describe('formatarHorario (HU-011, #340)', () => {
  it.each([
    ['', ''],
    ['1', '1'],
    ['13', '13'],
    ['131', '13:1'],
    ['1315', '13:15'],
    ['13:15', '13:15'],
    ['13155', '13:15'],
    ['ab1c3:4x5', '13:45'],
  ])('"%s" vira "%s"', (entrada, esperado) => {
    expect(formatarHorario(entrada)).toBe(esperado);
  });
});
