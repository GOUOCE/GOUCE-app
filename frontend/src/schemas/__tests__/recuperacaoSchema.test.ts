import { describe, it, expect } from '@jest/globals';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../loginSchema';

describe('Suíte de Testes Unitários - HU-004 (Recuperação e Redefinição de Senha)', () => {

  describe('Esqueci Minha Senha (forgotPasswordSchema) - AC-01', () => {
    it('deve sanitizar o e-mail removendo espaços e convertendo para minúsculas', () => {
      const res = forgotPasswordSchema.safeParse({
        email: '  MARIA.SOUZA@ALUNO.UFC.BR  ',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('maria.souza@aluno.ufc.br');
      }
    });

    it('deve recusar solicitação de recuperação de senha com e-mail vazio', () => {
      const res = forgotPasswordSchema.safeParse({
        email: '   ',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('O e-mail é obrigatório');
      }
    });

    it('deve recusar solicitação com e-mail em formato inválido', () => {
      const res = forgotPasswordSchema.safeParse({
        email: 'email_invalido',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe um e-mail válido');
      }
    });
  });

  describe('Redefinição de Senha (resetPasswordSchema) - AC-04', () => {
    it('deve aprovar nova senha forte (8+ caracteres, maiúscula, minúscula, número) com confirmação idêntica', () => {
      const res = resetPasswordSchema.safeParse({
        novaSenha: 'NovaSenha123',
        confirmarNovaSenha: 'NovaSenha123',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar senha nova com menos de 8 caracteres', () => {
      const res = resetPasswordSchema.safeParse({
        novaSenha: 'Senha1',
        confirmarNovaSenha: 'Senha1',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('A senha deve ter pelo menos 8 caracteres');
      }
    });

    it('deve recusar senha nova sem letra maiúscula', () => {
      const res = resetPasswordSchema.safeParse({
        novaSenha: 'novasenha123',
        confirmarNovaSenha: 'novasenha123',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('A senha deve conter pelo menos uma letra maiúscula');
      }
    });

    it('deve recusar redefinição quando a confirmação de senha for diferente da nova senha', () => {
      const res = resetPasswordSchema.safeParse({
        novaSenha: 'NovaSenha123',
        confirmarNovaSenha: 'OutraSenha123',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const erroConfirm = res.error.issues.find((i) => i.path.includes('confirmarNovaSenha'));
        expect(erroConfirm).toBeDefined();
        expect(erroConfirm?.message).toBe('As senhas não coincidem');
      }
    });
  });
});
