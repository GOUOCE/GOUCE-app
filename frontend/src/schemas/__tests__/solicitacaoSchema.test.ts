import { describe, it, expect } from '@jest/globals';
import { reprovacaoSchema } from '../solicitacaoSchema';

describe('Suíte de Testes Unitários - HU-027 (Avaliação de Solicitação de Cadastro)', () => {
  describe('Validação de Reprovação (reprovacaoSchema)', () => {
    it('deve aprovar motivo válido e documentos de reenvio selecionados', () => {
      const res = reprovacaoSchema.safeParse({
        motivo: 'Comprovante de matrícula ilegível.',
        documentosReenvio: ['comprovante_matricula'],
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando o motivo tiver menos de 5 caracteres', () => {
      const res = reprovacaoSchema.safeParse({
        motivo: 'Erro',
        documentosReenvio: ['comprovante_matricula'],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 5 caracteres');
      }
    });

    it('deve recusar quando nenhum documento for selecionado para reenvio', () => {
      const res = reprovacaoSchema.safeParse({
        motivo: 'Documento incorreto enviado.',
        documentosReenvio: [],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('documento');
      }
    });
  });
});
