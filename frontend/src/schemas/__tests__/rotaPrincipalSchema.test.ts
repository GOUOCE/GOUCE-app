import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { rotaPrincipalSchema } from '../rotaPrincipalSchema';

describe('Suíte de Testes Unitários - HU-011 (Gerenciamento de Rotas Principais)', () => {
  describe('Validação do Formulário de Rota Principal (rotaPrincipalSchema)', () => {
    it('deve aprovar nome, horários, faculdades de ida/volta e bairros válidos', () => {
      const res = rotaPrincipalSchema.safeParse({
        nome: 'Linha 01 - Centro',
        horarioSaida: '06:40',
        horarioRetorno: '17:30',
        faculdadesIdaIds: [1, 2],
        faculdadesVoltaIds: [1],
        bairrosIds: [1, 2],
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando o nome da rota for menor que 3 caracteres', () => {
      const res = rotaPrincipalSchema.safeParse({
        nome: 'Li',
        horarioSaida: '06:40',
        horarioRetorno: '17:30',
        faculdadesIdaIds: [1],
        faculdadesVoltaIds: [1],
        bairrosIds: [1],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });

    it('deve recusar quando nenhuma faculdade de ida for selecionada', () => {
      const res = rotaPrincipalSchema.safeParse({
        nome: 'Linha 01 - Centro',
        horarioSaida: '06:40',
        horarioRetorno: '17:30',
        faculdadesIdaIds: [],
        faculdadesVoltaIds: [1],
        bairrosIds: [1],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Selecione ao menos uma faculdade de ida');
      }
    });

    it('deve recusar quando nenhum bairro for vinculado à rota', () => {
      const res = rotaPrincipalSchema.safeParse({
        nome: 'Linha 01 - Centro',
        horarioSaida: '06:40',
        horarioRetorno: '17:30',
        faculdadesIdaIds: [1],
        faculdadesVoltaIds: [1],
        bairrosIds: [],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Vincule ao menos um bairro à rota');
      }
    });
  });
});
