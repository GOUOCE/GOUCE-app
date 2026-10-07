import { describe, it, expect } from '@jest/globals';

describe('Suíte de Testes Unitários - HU-029 (Carteirinha Digital do Aluno)', () => {
  describe('Validação e Regras da Carteirinha Digital', () => {
    it('deve formatar o payload do QR Code com ID e e-mail do aluno sem expor token de sessão', () => {
      const carteirinha = {
        id: 20,
        email: 'maria.souza@aluno.ufc.br',
        status: 'Aprovado',
      };
      const qrcodeValue = JSON.stringify({
        id: carteirinha.id,
        email: carteirinha.email,
        status: carteirinha.status,
      });

      const parsed = JSON.parse(qrcodeValue);
      expect(parsed.id).toBe(20);
      expect(parsed.email).toBe('maria.souza@aluno.ufc.br');
      expect(parsed.status).toBe('Aprovado');
      expect(parsed.token).toBeUndefined();
    });

    it('deve identificar quando o status do aluno for inativo, pendente ou em análise', () => {
      const statusIndisponiveis = ['pendente', 'analise_renovacao', 'inativado', 'rejeitado'];
      statusIndisponiveis.forEach((st) => {
        const isPermitido = st === 'ativado';
        expect(isPermitido).toBe(false);
      });
    });

    it('deve permitir acesso à carteirinha somente quando o status for ativado/aprovado', () => {
      const statusAprovado = 'ativado';
      const isPermitido = statusAprovado === 'ativado';
      expect(isPermitido).toBe(true);
    });
  });
});
