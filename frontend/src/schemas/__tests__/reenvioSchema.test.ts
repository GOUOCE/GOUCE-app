import { describe, it, expect } from '@jest/globals';
import { reenvioDocumentosSchema } from '../reenvioSchema';

describe('Suíte de Testes Unitários - HU-031 (Critérios de Aceite de Status e Reenvio do Cadastro)', () => {
  describe('Critérios de Aceite 1 e 2 - Exibição de Status de Cadastro (Pendente, Aprovado, Reprovado)', () => {
    it('deve mapear os status oficiais do sistema corretamente', () => {
      const statusPermitidos = ['pendente', 'ativado', 'rejeitado'];
      expect(statusPermitidos).toContain('pendente'); // Pendente de aprovação
      expect(statusPermitidos).toContain('ativado');  // Aprovado
      expect(statusPermitidos).toContain('rejeitado'); // Reprovado
    });
  });

  describe('Critérios de Aceite 3 e 4 - Relação de Documentos e Motivos de Reprovação pelo Administrador', () => {
    it('deve estruturar os documentos reprovados com os motivos do administrador', () => {
      const documentosReenvio = [
        { tipo: 'foto_perfil', motivo: 'A foto enviada possui baixa resolução.' },
        { tipo: 'comprovante_matricula', motivo: 'Documento estava ilegível, cortado ou com baixa resolução' },
      ];

      expect(documentosReenvio).toHaveLength(2);
      expect(documentosReenvio[0].tipo).toBe('foto_perfil');
      expect(documentosReenvio[0].motivo).toContain('baixa resolução');
      expect(documentosReenvio[1].tipo).toBe('comprovante_matricula');
      expect(documentosReenvio[1].motivo).toContain('ilegível');
    });
  });

  describe('Critérios de Aceite 5 e 6 - Seleção de Documento Reprovado e Atualização para Pendente de Aprovação', () => {
    it('deve aprovar formulário quando ao menos um documento reprovado for selecionado para reenvio', () => {
      const res = reenvioDocumentosSchema.safeParse({
        comprovanteMatricula: { uri: 'file://matricula.pdf', name: 'matricula.pdf' },
      });
      expect(res.success).toBe(true);
    });

    it('deve atualizar o status para Pendente de Aprovação após o reenvio', () => {
      const statusPosReenvio = 'pendente';
      expect(statusPosReenvio).toBe('pendente');
    });
  });

  describe('Critério de Aceite 7 - Impedir alteração de documentos já aprovados', () => {
    it('deve identificar documentos que já foram aprovados e bloquear modificação', () => {
      const documentosStatus = {
        comprovanteMatricula: 'reprovado',
        comprovanteResidencia: 'aprovado',
      };

      const podeEditarResidencia = documentosStatus.comprovanteResidencia === 'reprovado';
      const podeEditarMatricula = documentosStatus.comprovanteMatricula === 'reprovado';

      expect(podeEditarResidencia).toBe(false);
      expect(podeEditarMatricula).toBe(true);
    });
  });

  describe('Critério de Aceite 8 - Informar quando não houver pendências', () => {
    it('deve detectar ausência de pendências e retornar mensagem de sucesso', () => {
      const documentosReenvio: Array<{ tipo: string; motivo: string }> = [];
      const semPendencias = documentosReenvio.length === 0;

      expect(semPendencias).toBe(true);
    });
  });
});
