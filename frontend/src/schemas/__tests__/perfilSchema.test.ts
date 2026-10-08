import { describe, it, expect } from '@jest/globals';
import { editarPerfilSchema, alterarEmailSchema } from '../perfilSchema';

describe('Suíte de Testes Unitários - HU-005 e HU-028 (Edição de Perfil e Alteração de E-mail)', () => {

  describe('Edição de Perfil (editarPerfilSchema) - HU-005', () => {
    it('deve aprovar telefone e bairro válidos', () => {
      const res = editarPerfilSchema.safeParse({
        telefone: '(88) 9 8123-4567',
        bairro: 'Croatá',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar telefone com menos de 10 dígitos', () => {
      const res = editarPerfilSchema.safeParse({
        telefone: '12345',
        bairro: 'Centro',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Informe DDD e número com 9 dígitos');
      }
    });

    it('deve recusar bairro em branco', () => {
      const res = editarPerfilSchema.safeParse({
        telefone: '(88) 9 8123-4567',
        bairro: '',
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Alteração de E-mail (alterarEmailSchema) - HU-005', () => {
    it('deve aprovar novo e-mail válido diferente do atual com senha informada', () => {
      const res = alterarEmailSchema.safeParse({
        emailAtual: 'joao@email.com',
        novoEmail: 'joao.novo@email.com',
        senhaAtual: 'Senha123',
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando o novo e-mail for igual ao atual', () => {
      const res = alterarEmailSchema.safeParse({
        emailAtual: 'joao@email.com',
        novoEmail: 'joao@email.com',
        senhaAtual: 'Senha123',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        const erroEmail = res.error.issues.find((i) => i.path.includes('novoEmail'));
        expect(erroEmail).toBeDefined();
        expect(erroEmail?.message).toBe('O novo e-mail deve ser diferente do e-mail atual');
      }
    });

    it('deve recusar se a senha atual não for informada', () => {
      const res = alterarEmailSchema.safeParse({
        emailAtual: 'joao@email.com',
        novoEmail: 'joao.novo@email.com',
        senhaAtual: '',
      });
      expect(res.success).toBe(false);
    });
  });
});
