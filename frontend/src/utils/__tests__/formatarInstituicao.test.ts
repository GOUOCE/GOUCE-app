import { describe, it, expect } from '@jest/globals';
import { formatarInstituicao } from '../formatarInstituicao';

describe('formatarInstituicao (#192)', () => {
  it('usa a sigla e o campus do perfil e do detalhe do aluno', () => {
    expect(
      formatarInstituicao({ faculdade_id: 1, sigla_faculdade: 'UFC', nome_faculdade: 'Universidade Federal do Ceará', campus: 'Quixadá' } as any)
    ).toBe('UFC - Quixadá');
  });

  it('usa a sigla e o campus da listagem de alunos', () => {
    expect(formatarInstituicao({ faculdade: 'Instituto Federal do Ceará', sigla: 'IFCE', campus: 'Quixadá' })).toBe('IFCE - Quixadá');
  });

  it('cai para o nome da faculdade quando não há sigla', () => {
    expect(formatarInstituicao({ nome_faculdade: 'Centro Universitário Uniateneu', campus: 'Ocara' })).toBe(
      'Centro Universitário Uniateneu - Ocara'
    );
  });

  it('mostra só o que a API enviou, sem valores de exemplo nem o id', () => {
    expect(formatarInstituicao({ sigla_faculdade: 'UFC' })).toBe('UFC');
    expect(formatarInstituicao({ campus: 'Quixadá' })).toBe('Quixadá');
    expect(formatarInstituicao({ faculdade_id: 1 } as any)).toBe('');
    expect(formatarInstituicao(null)).toBe('');
    expect(formatarInstituicao(undefined)).toBe('');
  });
});
