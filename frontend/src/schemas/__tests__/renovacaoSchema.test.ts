import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { renovacaoSchema } from '../alunoSchema';

describe('Suíte de Testes Unitários - HU-028 (Renovação de Vínculo Institucional)', () => {
  const arquivoValido = { uri: 'file://matricula.pdf', name: 'matricula.pdf', size: 1024 * 1024, mimeType: 'application/pdf' };

  const baseValida = {
    email: 'maria@alu.ufc.br',
    nomeCompleto: 'Maria da Silva',
    dataNascimento: '15/05/2000',
    raca: 'Preto' as const,
    identificacaoSexual: 'Bissexual' as const,
    genero: 'Homem' as const,
    transgenero: 'Não' as const,
    temFilhos: false,
    bairro: 'Centro',
    whatsapp: '(88) 99999-9999',
    instituicao: 'UFC',
    curso: 'Engenharia de Software',
    campus: 'Quixadá',
    periodoIngresso: '2024.1',
    turno: 'Noturno' as const,
    semestreAtual: '8º',
    comprovanteMatricula: arquivoValido,
    comprovanteResidencia: null,
    aceitouTermos: true,
  };

  it('deve aprovar a renovação quando todos os dados obrigatórios e o comprovante de matrícula atualizado forem fornecidos', () => {
    const res = renovacaoSchema.safeParse(baseValida);
    expect(res.success).toBe(true);
  });

  it('deve recusar a renovação quando o comprovante de matrícula obrigatório não for anexado (Critério 4)', () => {
    const res = renovacaoSchema.safeParse({
      ...baseValida,
      comprovanteMatricula: null,
    });
    expect(res.success).toBe(false);
  });

  it('deve recusar a renovação quando o nome completo ou dados obrigatórios forem esvaziados (Critério 7)', () => {
    const res = renovacaoSchema.safeParse({
      ...baseValida,
      nomeCompleto: '',
    });
    expect(res.success).toBe(false);
  });
});
