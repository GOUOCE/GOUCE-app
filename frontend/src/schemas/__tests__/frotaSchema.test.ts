import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { frotaSchema } from '../frotaSchema';
import { frotaService } from '../../services/frotaService';

describe('Suíte de Testes BDD / Unitários - HU-009 (Gerenciamento da Frota / Ônibus)', () => {
  describe('AC-02 & AC-09 - Validação e Normalização de Placas (Mercosul e Antiga)', () => {
    it('deve aprovar e normalizar placas com letras minúsculas ou hífen (ex.: qxd2e45 -> QXD2E45, ABC-1234 -> ABC1234)', () => {
      const res1 = frotaSchema.safeParse({
        placa: 'qxd2e45',
        assentos: 44,
        capacidadeEmPe: 20,
      });
      expect(res1.success).toBe(true);
      if (res1.success) expect(res1.data.placa).toBe('QXD2E45');

      const res2 = frotaSchema.safeParse({
        placa: 'ABC-1234',
        assentos: 44,
        capacidadeEmPe: 0,
      });
      expect(res2.success).toBe(true);
      if (res2.success) expect(res2.data.placa).toBe('ABC1234');
    });

    it('deve recusar placas com formato inválido (ex.: menos de 7 caracteres ou formato fora do padrão)', () => {
      const res1 = frotaSchema.safeParse({
        placa: 'AB1234',
        assentos: 44,
        capacidadeEmPe: 20,
      });
      expect(res1.success).toBe(false);
      if (!res1.success) {
        expect(res1.error.issues[0].message).toBe('Placa inválida.');
      }

      const res2 = frotaSchema.safeParse({
        placa: '1234567',
        assentos: 44,
        capacidadeEmPe: 20,
      });
      expect(res2.success).toBe(false);
    });
  });

  describe('AC-10 - Validação de Assentos e Capacidade em Pé', () => {
    it('deve recusar quantidade de assentos <= 0', () => {
      const res = frotaSchema.safeParse({
        placa: 'QXD2E45',
        assentos: 0,
        capacidadeEmPe: 20,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('A quantidade de assentos deve ser maior que zero');
      }
    });

    it('deve recusar capacidade de alunos em pé < 0', () => {
      const res = frotaSchema.safeParse({
        placa: 'QXD2E45',
        assentos: 44,
        capacidadeEmPe: -1,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('A capacidade em pé não pode ser negativa');
      }
    });
  });

  describe('FA-002 & AC-03 - Bloqueio de Placa Duplicada no Cadastro e Edição', () => {
    it('deve bloquear o cadastro com placa já existente no sistema (ativa ou inativa)', async () => {
      await expect(
        frotaService.criarOnibus('OCR-1234', 40, 10)
      ).rejects.toThrow('Este veículo já está registrado.');
    });
  });

  describe('FA-001 & AC-06 - Bloqueio de Inativação de Ônibus Escalado em Rota Futura', () => {
    it('deve bloquear a inativação se o ônibus tiver alocações pendentes para dias futuros', async () => {
      await expect(
        frotaService.inativarOnibus(1)
      ).rejects.toThrow('Este veículo possui alocações pendentes e não pode ser inativado no momento.');
    });

    it('deve permitir inativar um ônibus sem alocações pendentes', async () => {
      await frotaService.inativarOnibus(2);
      const onibus = await frotaService.obterOnibusPorId(2);
      expect(onibus?.ativo).toBe(false);
    });

    it('deve permitir reativar um ônibus inativo', async () => {
      await frotaService.reativarOnibus(3);
      const onibus = await frotaService.obterOnibusPorId(3);
      expect(onibus?.ativo).toBe(true);
    });
  });
});
