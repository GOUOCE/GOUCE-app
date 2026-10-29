import { describe, it, expect } from '@jest/globals';
import {
  adminNomeSchema,
  adminEmailSchema,
  criarAdminSchema,
  editarAdminSchema,
} from '../adminSchema';

describe('Suíte de Testes Unitários - HU-006 (Gerenciamento de Administradores)', () => {

  describe('Validação de Nome do Administrador (adminNomeSchema)', () => {
    it('deve aprovar nome completo válido com nome e sobrenome', () => {
      const res = adminNomeSchema.safeParse('Clidenor Lopes Martins');
      expect(res.success).toBe(true);
    });

    it('deve aceitar nomes com acentos e hífen (ex: Maria-José D\'Ávila)', () => {
      const res = adminNomeSchema.safeParse("Maria-José D'Ávila");
      expect(res.success).toBe(true);
    });

    it('deve recusar nomes de apenas uma palavra (sem sobrenome)', () => {
      const res = adminNomeSchema.safeParse('Clidenor');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe nome e sobrenome completos');
      }
    });

    it('deve recusar nomes contendo números', () => {
      const res = adminNomeSchema.safeParse('Clidenor 123');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Use apenas letras, espaços, hífen ou apóstrofo');
      }
    });

    it('deve recusar nomes com apenas espaços', () => {
      const res = adminNomeSchema.safeParse('     ');
      expect(res.success).toBe(false);
    });
  });

  describe('Validação de E-mail do Administrador (adminEmailSchema)', () => {
    it('deve sanitizar e-mail removendo espaços e convertendo para minúsculas', () => {
      const res = adminEmailSchema.safeParse('  ADMIN@TRANSPORTE.CE.GOV.BR  ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('admin@transporte.ce.gov.br');
      }
    });

    it('deve recusar e-mails com formato inválido', () => {
      const res = adminEmailSchema.safeParse('email_invalido');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('E-mail inválido');
      }
    });
  });

  describe('Schema Integrado de Criação de Administrador (criarAdminSchema)', () => {
    it('deve aprovar objeto válido com nome e e-mail do administrador', () => {
      const dadosValidos = {
        nome: 'Maria José Barros',
        email: 'maria.b@transporte.ce.gov.br',
      };
      const res = criarAdminSchema.safeParse(dadosValidos);
      expect(res.success).toBe(true);
    });

    it('deve recusar quando qualquer um dos campos estiver em branco ou inválido', () => {
      const dadosInvalidos = {
        nome: 'Maria',
        email: 'email-invalido',
      };
      const res = criarAdminSchema.safeParse(dadosInvalidos);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Schema Integrado de Edição de Administrador (editarAdminSchema)', () => {
    it('deve aprovar dados de edição de administrador válidos', () => {
      const dadosEdicao = {
        nome: 'Carlos Andrade Filho',
        email: 'carlos.filho@atu.ce.gov.br',
      };
      const res = editarAdminSchema.safeParse(dadosEdicao);
      expect(res.success).toBe(true);
    });
  });
});
