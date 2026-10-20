import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { frotaSchema } from '../frotaSchema';
import { frotaService } from '../../services/frotaService';

describe('Suíte de Testes Unitários - HU-009 (Gerenciamento da Frota / Ônibus)', () => {
  describe('Validação do Formulário de Ônibus (frotaSchema)', () => {
    it('deve aprovar placa, quantidade de assentos e capacidade em pé válidas', () => {
      const res = frotaSchema.safeParse({
        placa: 'OCR-1234',
        assentos: 42,
        capacidadeEmPe: 8,
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando a placa tiver menos de 7 caracteres', () => {
      const res = frotaSchema.safeParse({
        placa: 'OCR',
        assentos: 42,
        capacidadeEmPe: 8,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('placa válida');
      }
    });

    it('deve recusar quando a quantidade de assentos for menor que 1', () => {
      const res = frotaSchema.safeParse({
        placa: 'OCR-1234',
        assentos: 0,
        capacidadeEmPe: 8,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('maior que zero');
      }
    });

    it('deve recusar quando a capacidade em pé for negativa', () => {
      const res = frotaSchema.safeParse({
        placa: 'OCR-1234',
        assentos: 42,
        capacidadeEmPe: -1,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Regras de Negócio de Ônibus', () => {
    it('deve bloquear o cadastro com placa já existente no sistema', async () => {
      await expect(
        frotaService.criarOnibus('OCR-1234', 40, 10)
      ).rejects.toThrow('Este veículo já está registrado.');
    });

    it('deve bloquear a inativação se o ônibus tiver alocações pendentes para datas futuras', async () => {
      // Ônibus 04 - OCR-1234 (ID 1) possui alocações pendentes no MOCK
      await expect(
        frotaService.inativarOnibus(1)
      ).rejects.toThrow('Este veículo possui alocações pendentes e não pode ser inativado no momento.');
    });

    it('deve permitir inativar um ônibus sem alocações pendentes', async () => {
      // Ônibus 07 - OCR-5521 (ID 2) não possui alocações pendentes
      await frotaService.inativarOnibus(2);
      const onibus = await frotaService.obterOnibusPorId(2);
      expect(onibus?.ativo).toBe(false);
    });

    it('deve permitir reativar um ônibus inativo', async () => {
      // Ônibus 12 - OCR-8890 (ID 3) está inativo
      await frotaService.reativarOnibus(3);
      const onibus = await frotaService.obterOnibusPorId(3);
      expect(onibus?.ativo).toBe(true);
    });
  });
});
