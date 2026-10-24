import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { renovacaoSchema } from '../alunoSchema';

describe('Suíte de Testes Unitários - HU-028 (Renovação de Vínculo Institucional)', () => {
  const MB = 1024 * 1024;
  const arquivoValido = { uri: 'file://matricula.pdf', name: 'matricula.pdf', size: 1 * MB, type: 'application/pdf', mimeType: 'application/pdf' };

  const baseValida = {
    nomeCompleto: 'João Silva Neves',
    email: 'joao.neves@gmail.com',
    dataNascimento: '15/05/2002',
    raca: 'Branco',
    identificacaoSexual: 'Heterossexual',
    genero: 'Homem',
    transgenero: 'Não',
    temFilhos: false,
    bairro: 'Centro',
    whatsapp: '(88) 9 9999-8888',
    instituicao: 'UFC - Universidade Federal do Ceará',
    curso: 'Engenharia de Software',
    campus: 'Quixadá',
    periodoIngresso: '2023.1',
    turno: 'Vespertino',
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
