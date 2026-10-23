import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { rotaPrincipalSchema } from '../rotaPrincipalSchema';
import { rotaPrincipalService } from '../../services/rotaPrincipalService';

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

  describe('Regras de Negócio de Rotas Principais', () => {
    it('deve permitir configurar faculdades de ida (destino) e volta (origem) de forma independente', async () => {
      const novaRota = await rotaPrincipalService.criarRotaPrincipal({
        nome: 'Linha Independente',
        horarioSaida: '06:00',
        horarioRetorno: '18:00',
        faculdadesIdaIds: [1, 2, 3], // Ida passa por 3 faculdades
        faculdadesVoltaIds: [1],      // Volta passa apenas por 1
        bairrosIds: [1],
      });

      expect(novaRota.faculdades_ida).toHaveLength(3);
      expect(novaRota.faculdades_volta).toHaveLength(1);
    });

    it('deve exibir APENAS faculdades e bairros ATIVOS nos seletores de vínculo', async () => {
      const facsAtivas = await rotaPrincipalService.listarFaculdadesAtivas();
      const bairrosAtivos = await rotaPrincipalService.listarBairrosAtivos();

      expect(facsAtivas.every((f) => f.ativo)).toBe(true);
      expect(bairrosAtivos.every((b) => b.ativo)).toBe(true);
    });

    it('deve bloquear a inativação se a rota possuir agendamentos pendentes de alunos', async () => {
      // Linha 01 - Centro (ID 1) possui agendamentos pendentes no MOCK
      await expect(
        rotaPrincipalService.inativarRotaPrincipal(1)
      ).rejects.toThrow('Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.');
    });

    it('deve permitir inativar uma rota sem agendamentos pendentes', async () => {
      // Linha 02 - Bairro Novo (ID 2) não possui agendamentos pendentes
      await rotaPrincipalService.inativarRotaPrincipal(2);
      const rota = await rotaPrincipalService.obterRotaPrincipalPorId(2);
      expect(rota?.ativo).toBe(false);
    });

    it('deve permitir reativar uma rota inativa', async () => {
      // Linha 03 - Vila Antiga (ID 3) está inativa
      await rotaPrincipalService.reativarRotaPrincipal(3);
      const rota = await rotaPrincipalService.obterRotaPrincipalPorId(3);
      expect(rota?.ativo).toBe(true);
    });
  });
});
