import { describe, it, expect } from '@jest/globals';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  emailLoginSchema,
} from '../loginSchema';

describe('Suíte de Testes Unitários Completa - HU-002 (Login e Recuperação de Senha)', () => {

  // ---------------------------------------------------------------------------
  // E-MAIL DE LOGIN & SANITIZAÇÃO (CT-HU002-UI-003, CT-HU002-UI-004)
  // ---------------------------------------------------------------------------
  describe('Sanitização e Validação de E-mail (emailLoginSchema) - CT-HU002-UI-003, CT-HU002-UI-004', () => {
    it('deve remover espaços no início e no fim do e-mail e converter para minúsculas', () => {
      const res = emailLoginSchema.safeParse('  aluno@gmail.com  ');
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe('aluno@gmail.com');
      }
    });

    it('deve aceitar e-mail colado do teclado do iPhone com espaços e letras maiúsculas', () => {
      const res = loginSchema.safeParse({
        email: '  MARIA.SOUZA@ALUNO.UFC.BR  ',
        senha: 'Senha@123',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('maria.souza@aluno.ufc.br');
      }
    });

    it('deve recusar e-mail em branco (FA-002 / AC-02)', () => {
      const res = loginSchema.safeParse({
        email: '   ',
        senha: 'Senha@123',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('O e-mail é obrigatório');
      }
    });

    it('deve recusar e-mail com formato inválido (sem @ ou domínio)', () => {
      const res = loginSchema.safeParse({
        email: 'alunoalunoufcbr',
        senha: 'Senha@123',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe um e-mail válido');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // SENHA DE LOGIN (FA-002)
  // ---------------------------------------------------------------------------
  describe('Validação de Senha de Login (loginSchema) - FA-002', () => {
    it('deve aprovar login com e-mail e senha preenchidos', () => {
      const res = loginSchema.safeParse({
        email: 'maria.souza@aluno.ufc.br',
        senha: 'Senha@123',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar login com campo de senha vazio (FA-002 / AC-02)', () => {
      const res = loginSchema.safeParse({
        email: 'maria.souza@aluno.ufc.br',
        senha: '',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const erroSenha = res.error.issues.find((i) => i.path.includes('senha'));
        expect(erroSenha).toBeDefined();
        expect(erroSenha?.message).toBe('A senha é obrigatória');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // ESQUECI MINHA SENHA (forgotPasswordSchema)
  // ---------------------------------------------------------------------------
  describe('Esqueci Minha Senha (forgotPasswordSchema) - CT-HU002-UI-004', () => {
    it('deve sanitizar o e-mail removendo espaços na solicitação de recuperação de senha', () => {
      const res = forgotPasswordSchema.safeParse({
        email: '  pedro.lima@atu.ce.gov.br  ',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.email).toBe('pedro.lima@atu.ce.gov.br');
      }
    });

    it('deve recusar e-mail inválido na solicitação de recuperação de senha', () => {
      const res = forgotPasswordSchema.safeParse({
        email: 'email_invalido',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe um e-mail válido');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // REDEFINIÇÃO DE SENHA (resetPasswordSchema)
  // ---------------------------------------------------------------------------
  describe('Redefinição de Senha (resetPasswordSchema)', () => {
    it('deve aprovar redefinição quando a nova senha for forte e idêntica à confirmação', () => {
      const res = resetPasswordSchema.safeParse({
        novaSenha: 'NovaSenha123',
        confirmarNovaSenha: 'NovaSenha123',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar redefinição quando a nova senha for fraca (< 8 caracteres ou sem maiúscula/número)', () => {
      const res = resetPasswordSchema.safeParse({
        novaSenha: 'fraca',
        confirmarNovaSenha: 'fraca',
      });
      expect(res.success).toBe(false);
    });

    it('deve recusar redefinição quando as senhas não coincidirem', () => {
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
