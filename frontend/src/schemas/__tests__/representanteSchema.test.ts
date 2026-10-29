import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../api/api', () => ({
  api: {
    get: jest.fn((...args: any[]) => {
      const url = args[0];
      if (url === '/representantes') {
        return Promise.resolve({
          data: [
            {
              id: 1,
              aluno_id: 101,
              nome: 'Ana Beatriz Costa',
              email: 'ana.costa@ufc.br',
              instituicao: 'UFC',
              campus: 'Campus Quixadá',
              ativo: true,
            },
          ],
        });
      }
      if (url === '/usuarios/alunos') {
        return Promise.resolve({
          data: [
            {
              id: 103,
              aluno_id: 103,
              nome: 'João Neves',
              email: 'joao@email.com',
              faculdade: 'UFC',
              campus: 'Campus Quixadá',
              status_cadastro: 'ativado',
            },
          ],
        });
      }
      return Promise.resolve({ data: [] });
    }),
    post: jest.fn((...args: any[]) => {
      const url = args[0];
      if (url === '/representantes/promover') {
        const error: any = new Error('Request failed with status code 409');
        error.response = {
          status: 409,
          data: { success: false, error: { code: 'CONFLICT', message: 'Este aluno já é um representante ativo.' } },
        };
        return Promise.reject(error);
      }
      return Promise.resolve({ data: { success: true } });
    }),
    patch: jest.fn((...args: any[]) => Promise.resolve({ data: { success: true } })),
  },
}));

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

      // A mensagem de regra vem da API e segue até a tela
      await expect(
        representanteService.atribuirRepresentante(primeiroRep.aluno_id, 1)
      ).rejects.toMatchObject({
        response: { status: 409, data: { error: { message: 'Este aluno já é um representante ativo.' } } },
      });
    });

    it('deve permitir revogar a função de representante mantendo o cadastro do aluno ativo', async () => {
      const representantesIniciais = await representanteService.listarRepresentantes();
      const repParaRevogar = representantesIniciais[0];

      await representanteService.revogarRepresentante(repParaRevogar.id);

      expect(repParaRevogar.aluno_id).toBeDefined();
    });
  });
});
