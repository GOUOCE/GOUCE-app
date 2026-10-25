import { describe, it, expect } from '@jest/globals';
import { calcularStatusAluno } from '../statusAluno';

describe('calcularStatusAluno', () => {
  it('marca como expirado o aluno ativado com acesso vencido', () => {
    expect(calcularStatusAluno('ativado', true)).toBe('expirado');
  });

  it('mantém ativado quando o acesso está em dia', () => {
    expect(calcularStatusAluno('ativado', false)).toBe('ativado');
    expect(calcularStatusAluno('ATIVADO', undefined)).toBe('ativado');
  });

  it('não esconde outros status atrás do vencimento', () => {
    expect(calcularStatusAluno('analise_renovacao', true)).toBe('analise_renovacao');
    expect(calcularStatusAluno('pendente', true)).toBe('pendente');
    expect(calcularStatusAluno('rejeitado', true)).toBe('rejeitado');
  });

  it('usa ativado quando o backend não informa o status', () => {
    expect(calcularStatusAluno(undefined, false)).toBe('ativado');
    expect(calcularStatusAluno(null, true)).toBe('expirado');
  });
});
