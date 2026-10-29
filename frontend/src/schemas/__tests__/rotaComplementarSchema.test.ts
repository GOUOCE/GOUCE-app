import { describe, it, expect } from '@jest/globals';

import { rotaComplementarSchema } from '../rotaComplementarSchema';

describe('Suíte de Testes Unitários - HU-012 (Gerenciamento de Rotas Complementares)', () => {
  describe('Validação do Formulário de Rota Complementar (rotaComplementarSchema)', () => {
    it('deve aprovar cadastro com rota principal, nome, horário e ponto de conexão válidos', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '06:10',
        horarioRetorno: '17:40',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando a rota principal vinculada não for selecionada', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 0,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '06:10',
        horarioRetorno: '17:40',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Selecione a rota principal vinculada');
      }
    });

    it('deve recusar quando o horário de saída não for informado', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '',
        horarioRetorno: '17:40',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Selecione o horário de saída');
      }
    });

    it('deve recusar quando o ponto de conexão for menor que 3 caracteres', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '06:10',
        horarioRetorno: '17:40',
        pontoConexao: 'Tr',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });

    it('aceita qualquer horário HH:mm, fora da antiga lista fixa (#357)', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '13:15',
        horarioRetorno: '17:40',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(true);
    });

    it('recusa horário fora do formato HH:mm (#357)', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '25:00',
        horarioRetorno: '17:40',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Horário deve estar no formato HH:MM.');
      }
    });

    it('recusa cadastro sem horário de retorno (#350)', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '06:00',
        horarioRetorno: '',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].path).toEqual(['horarioRetorno']);
        expect(res.error.issues[0].message).toBe('Selecione o horário de retorno');
      }
    });

    it('recusa retorno igual ou anterior à saída, no campo de retorno (#208, item 2a)', () => {
      for (const horarioRetorno of ['06:00', '05:30']) {
        const res = rotaComplementarSchema.safeParse({
          rotaPrincipalId: 1,
          nome: 'Van 2 - Bairro Novo',
          horarioSaida: '06:00',
          horarioRetorno,
          pontoConexao: 'Trevo do Bairro Novo',
        });
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.issues[0].path).toEqual(['horarioRetorno']);
          expect(res.error.issues[0].message).toBe('Horário de retorno deve ser maior que o horário de saída.');
        }
      }
    });

    const base = {
      rotaPrincipalId: 1,
      nome: 'Van 2 - Bairro Novo',
      horarioSaida: '06:00',
      horarioRetorno: '17:40',
      pontoConexao: 'Trevo do Bairro Novo',
    };

    it('recusa símbolos no nome e no ponto de conexão (#356)', () => {
      const nome = rotaComplementarSchema.safeParse({ ...base, nome: 'wwww@@@2' });
      const ponto = rotaComplementarSchema.safeParse({ ...base, pontoConexao: 'Trevo #1 @@' });

      expect(nome.success).toBe(false);
      expect(ponto.success).toBe(false);
      if (!nome.success) expect(nome.error.issues[0].message).toBe('Use apenas letras, números, espaços, hífen, apóstrofo ou barra');
      if (!ponto.success) expect(ponto.error.issues[0].path).toEqual(['pontoConexao']);
    });

    it('aceita endereço com ponto, vírgula e º no ponto de conexão e acentos no nome (#356)', () => {
      const res = rotaComplementarSchema.safeParse({
        ...base,
        nome: "Van Sítio D'Água 2/3",
        pontoConexao: 'Av. Plácido Castelo, Nº 120',
      });
      expect(res.success).toBe(true);
    });

    it('tira espaços das pontas e junta espaços repetidos no nome e no ponto (#356)', () => {
      const res = rotaComplementarSchema.safeParse({
        ...base,
        nome: '  Van   2 - Bairro Novo  ',
        pontoConexao: '  Trevo   do Bairro  ',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.nome).toBe('Van 2 - Bairro Novo');
        expect(res.data.pontoConexao).toBe('Trevo do Bairro');
      }
    });
  });
});
