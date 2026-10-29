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
  });
});
