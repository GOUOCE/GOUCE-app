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

describe('Máscara do nome da rota (HU-011, #338)', () => {
  const base = {
    horarioSaida: '06:40',
    horarioRetorno: '17:30',
    faculdadesIdaIds: [1],
    faculdadesVoltaIds: [1],
    bairrosIds: [1],
  };

  it.each(['Rota Centro - UFC', 'Linha 01/02', "Rota D'Ávila", 'Rota São João'])('aceita "%s"', (nome) => {
    expect(rotaPrincipalSchema.safeParse({ ...base, nome }).success).toBe(true);
  });

  it.each(['wwww@@@2', 'Rota #1', 'Rota (Manhã)', 'Rota_Centro'])('recusa "%s" com a mensagem do campo', (nome) => {
    const res = rotaPrincipalSchema.safeParse({ ...base, nome });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe('Use apenas letras, números, espaços, hífen, apóstrofo ou barra');
    }
  });

  it('tira espaços das pontas e espaços repetidos', () => {
    const res = rotaPrincipalSchema.safeParse({ ...base, nome: '  Rota   Centro  ' });
    expect(res.success && res.data.nome).toBe('Rota Centro');
  });
});

describe('Horários livres no formato HH:mm (HU-011, #340)', () => {
  const base = {
    nome: 'Rota Centro - UFC',
    faculdadesIdaIds: [1],
    faculdadesVoltaIds: [1],
    bairrosIds: [1],
  };
  const erroDe = (res: any, campo: string) =>
    res.error.issues.find((i: any) => i.path[0] === campo)?.message;

  it('aceita qualquer horário válido, como 13:15 e 22:40, e 00:00 a 23:59', () => {
    expect(rotaPrincipalSchema.safeParse({ ...base, horarioSaida: '13:15', horarioRetorno: '22:40' }).success).toBe(true);
    expect(rotaPrincipalSchema.safeParse({ ...base, horarioSaida: '00:00', horarioRetorno: '23:59' }).success).toBe(true);
  });

  it.each(['24:00', '06:60', '6:30', '0630'])('recusa "%s" com a mensagem da API', (horario) => {
    const res = rotaPrincipalSchema.safeParse({ ...base, horarioSaida: horario, horarioRetorno: '23:00' });
    expect(res.success).toBe(false);
    expect(erroDe(res, 'horarioSaida')).toBe('Horário deve estar no formato HH:MM.');
  });

  it('exige os dois horários', () => {
    const res = rotaPrincipalSchema.safeParse({ ...base, horarioSaida: '', horarioRetorno: '' });
    expect(erroDe(res, 'horarioSaida')).toBe('Horário de saída é obrigatório.');
    expect(erroDe(res, 'horarioRetorno')).toBe('Horário de retorno é obrigatório.');
  });

  it.each([['13:15', '13:15'], ['13:15', '13:14'], ['22:00', '06:00']])(
    'recusa retorno %s → %s (igual ou antes da saída) no campo de retorno',
    (saida, retorno) => {
      const res = rotaPrincipalSchema.safeParse({ ...base, horarioSaida: saida, horarioRetorno: retorno });
      expect(res.success).toBe(false);
      expect(erroDe(res, 'horarioRetorno')).toBe('Horário de retorno deve ser maior que o horário de saída.');
    }
  );
});
