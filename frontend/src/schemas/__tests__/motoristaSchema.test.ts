import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../api/api', () => ({
  api: {
    get: jest.fn((...args: any[]) => {
      const url = args[0];
      if (url === '/motoristas/2') {
        return Promise.resolve({
          data: {
            id: 2,
            nome: 'Ana Souza',
            telefone: '88999999999',
            ativo: false,
          },
        });
      }
      if (url === '/motoristas/3') {
        return Promise.resolve({
          data: {
            id: 3,
            nome: 'Paulo Ferreira',
            telefone: '88999999999',
            ativo: true,
          },
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn((...args: any[]) => {
      const url = args[0];
      const body = args[1];
      if (url === '/motoristas' && body?.telefone === '88999999999') {
        const error: any = new Error('Este profissional já está registrado.');
        (error as any).response = { status: 409 };
        return Promise.reject(error);
      }
      return Promise.resolve({
        data: {
          id: 100,
          nome: body?.nome || 'Motorista Teste',
          telefone: body?.telefone || '88999999999',
          ativo: true,
        },
      });
    }),
    patch: jest.fn((...args: any[]) => {
      const url = args[0];
      if (url.includes('1/inativar')) {
        const error: any = new Error('Este profissional possui alocações pendentes e não pode ser inativado no momento.');
        (error as any).response = {
          status: 409,
          data: { detail: 'Este profissional possui alocações pendentes e não pode ser inativado no momento.' },
        };
        return Promise.reject(error);
      }
      return Promise.resolve({ data: { success: true } });
    }),
  },
}));

import { motoristaSchema } from '../motoristaSchema';
import { motoristaService } from '../../services/motoristaService';

describe('Suíte de Testes Unitários - HU-010 (Gerenciamento de Motoristas)', () => {
  describe('Validação do Formulário de Motorista (motoristaSchema)', () => {
    it('deve aprovar nome completo e telefone válidos com DDD', () => {
      const res = motoristaSchema.safeParse({
        nome: 'José Almeida',
        telefone: '(88) 9 9999-9999',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando o nome completo for menor que 3 caracteres', () => {
      const res = motoristaSchema.safeParse({
        nome: 'Jo',
        telefone: '(88) 9 9999-9999',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });

    it('deve recusar quando o telefone não for informado', () => {
      const res = motoristaSchema.safeParse({
        nome: 'José Almeida',
        telefone: '',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Informe um telefone válido');
      }
    });
  });

  describe('Regras de Negócio de Motoristas', () => {
    it('deve bloquear o cadastro com um número de telefone já existente no sistema', async () => {
      await expect(
        motoristaService.criarMotorista('Novo Motorista', '(88) 9 9999-9999')
      ).rejects.toThrow('Este profissional já está registrado.');
    });

    it('deve bloquear a inativação se o motorista possuir alocações pendentes para datas futuras', async () => {
      // José Almeida (ID 1) possui alocações pendentes
      await expect(
        motoristaService.inativarMotorista(1)
      ).rejects.toThrow('Este profissional possui alocações pendentes e não pode ser inativado no momento.');
    });

    it('deve permitir inativar um motorista sem alocações pendentes', async () => {
      // Ana Souza (ID 2) não possui alocações pendentes
      await motoristaService.inativarMotorista(2);
      const mot = await motoristaService.obterMotoristaPorId(2);
      expect(mot?.ativo).toBe(false);
    });

    it('deve permitir reativar um motorista inativo', async () => {
      // Paulo Ferreira (ID 3) está inativo
      await motoristaService.reativarMotorista(3);
      const mot = await motoristaService.obterMotoristaPorId(3);
      expect(mot?.ativo).toBe(true);
    });
  });
});
