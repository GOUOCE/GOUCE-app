import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { rotaComplementarSchema } from '../rotaComplementarSchema';
import { rotaComplementarService } from '../../services/rotaComplementarService';

describe('Suíte de Testes Unitários - HU-012 (Gerenciamento de Rotas Complementares)', () => {
  describe('Validação do Formulário de Rota Complementar (rotaComplementarSchema)', () => {
    it('deve aprovar cadastro com rota principal, nome, horário e ponto de conexão válidos', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 1,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '06:10',
        pontoConexao: 'Trevo do Bairro Novo',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando a rota principal vinculada não for selecionada', () => {
      const res = rotaComplementarSchema.safeParse({
        rotaPrincipalId: 0,
        nome: 'Van 2 - Bairro Novo',
        horarioSaida: '06:10',
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
        pontoConexao: 'Tr',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });
  });

  describe('Regras de Negócio de Rotas Complementares', () => {
    it('deve exibir apenas rotas principais ATIVAS no seletor de vínculo', async () => {
      const rotasAtivas = await rotaComplementarService.listarRotasPrincipaisAtivas();
      const possuiInativa = rotasAtivas.some((r) => r.nome.includes('Inativa'));

      expect(possuiInativa).toBe(false);
      expect(rotasAtivas.every((r) => r.ativo)).toBe(true);
    });

    it('deve bloquear a inativação de uma rota complementar com agendamentos pendentes de alunos', async () => {
      // Van 2 - Bairro Novo (ID 1) possui agendamentos pendentes no MOCK
      await expect(
        rotaComplementarService.inativarRotaComplementar(1)
      ).rejects.toThrow('Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.');
    });

    it('deve permitir inativar uma rota complementar sem agendamentos pendentes', async () => {
      // Van 5 - Trevo da BR (ID 2) não possui agendamentos pendentes
      await rotaComplementarService.inativarRotaComplementar(2);
      const rc = await rotaComplementarService.obterRotaComplementarPorId(2);
      expect(rc?.ativo).toBe(false);
    });

    it('deve permitir reativar uma rota complementar inativa', async () => {
      // Rota complementar inativa (ID 3) está inativa
      await rotaComplementarService.reativarRotaComplementar(3);
      const rc = await rotaComplementarService.obterRotaComplementarPorId(3);
      expect(rc?.ativo).toBe(true);
    });
  });
});
