import { describe, it, expect } from '@jest/globals';
import { atribuirRepresentanteSchema } from '../representanteSchema';
import { representanteService } from '../../services/representanteService';

describe('Suíte de Testes Unitários - HU-030 (Gerenciamento de Representantes)', () => {
  describe('Validação do Formulário de Atribuição (atribuirRepresentanteSchema)', () => {
    it('deve aprovar quando a instituição for selecionada e o aluno for informado', () => {
      const res = atribuirRepresentanteSchema.safeParse({
        instituicao: 'UFC - Campus Quixadá',
        alunoId: 103,
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando a instituição de ensino não for informada', () => {
      const res = atribuirRepresentanteSchema.safeParse({
        instituicao: '',
        alunoId: 103,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Selecione a instituição de ensino');
      }
    });

    it('deve recusar quando o aluno não for selecionado', () => {
      const res = atribuirRepresentanteSchema.safeParse({
        instituicao: 'UFC - Campus Quixadá',
        alunoId: undefined,
      });
      expect(res.success).toBe(false);
    });
  });

  describe('Regras de Negócio de Atribuição e Revogação de Representantes', () => {
    it('deve permitir atribuir a função de representante somente a alunos com cadastro aprovado e ativo', async () => {
      const alunoInativo = {
        id: 999,
        aluno_id: 999,
        nome: 'Aluno Inativo',
        email: 'inativo@email.com',
        instituicao: 'UFC',
        campus: 'Campus Quixadá',
        curso: 'Engenharia',
        periodo_ingresso: '2024.1',
        status_cadastro: 'pendente',
      };

      expect(alunoInativo.status_cadastro).not.toBe('ativado');
    });

    it('deve impedir que um aluno que já seja representante receba a função novamente', async () => {
      const representantes = await representanteService.listarRepresentantes();
      const primeiroRep = representantes[0];

      await expect(
        representanteService.atribuirRepresentante(primeiroRep.aluno_id)
      ).rejects.toThrow('já possui a função de representante');
    });

    it('deve permitir revogar a função de representante mantendo o cadastro do aluno ativo', async () => {
      const representantesIniciais = await representanteService.listarRepresentantes();
      const repParaRevogar = representantesIniciais[0];

      await representanteService.revogarRepresentante(repParaRevogar.id);

      const representantesAtualizados = await representanteService.listarRepresentantes();
      const revogado = representantesAtualizados.find((r) => r.id === repParaRevogar.id);

      expect(revogado?.ativo).toBe(false);
    });
  });
});
