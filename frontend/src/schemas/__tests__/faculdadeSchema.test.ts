import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { faculdadeSchema } from '../faculdadeSchema';
import { faculdadeService } from '../../services/faculdadeService';

describe('Suíte de Testes Unitários - HU-008 (Gerenciamento de Faculdades)', () => {
  describe('Validação do Formulário de Faculdade (faculdadeSchema)', () => {
    it('deve aprovar cadastro com nome, sigla e campus preenchidos corretamente', () => {
      const res = faculdadeSchema.safeParse({
        nome: 'Universidade Federal do Ceará',
        sigla: 'UFC',
        campus: 'Campus Quixadá',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando o nome da instituição for menor que 3 caracteres', () => {
      const res = faculdadeSchema.safeParse({
        nome: 'Uf',
        sigla: 'UFC',
        campus: 'Campus Quixadá',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });

    it('deve recusar quando a sigla da instituição não for informada', () => {
      const res = faculdadeSchema.safeParse({
        nome: 'Universidade Federal do Ceará',
        sigla: '',
        campus: 'Campus Quixadá',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Informe a sigla do nome');
      }
    });

    it('deve recusar quando o campus não for informado', () => {
      const res = faculdadeSchema.safeParse({
        nome: 'Universidade Federal do Ceará',
        sigla: 'UFC',
        campus: '',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Informe o campus da instituição');
      }
    });
  });

  describe('Regras de Negócio de Faculdades', () => {
    it('deve bloquear o cadastro se a combinação (nome + campus) ou (sigla + campus) já existir', async () => {
      await expect(
        faculdadeService.criarFaculdade(
          'Universidade Federal do Ceará',
          'UFC',
          'Campus Quixadá'
        )
      ).rejects.toThrow('Esta faculdade já está cadastrada.');
    });

    it('deve bloquear a inativação se a faculdade tiver viagens programadas pendentes', async () => {
      await expect(
        faculdadeService.inativarFaculdade(1)
      ).rejects.toThrow('Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento.');
    });

    it('deve permitir inativar uma faculdade sem viagens pendentes', async () => {
      await faculdadeService.inativarFaculdade(2);
      const fac = await faculdadeService.obterFaculdadePorId(2);
      expect(fac?.ativo).toBe(false);
    });

    it('deve permitir reativar uma faculdade inativa', async () => {
      await faculdadeService.reativarFaculdade(3);
      const fac = await faculdadeService.obterFaculdadePorId(3);
      expect(fac?.ativo).toBe(true);
    });
  });
});
