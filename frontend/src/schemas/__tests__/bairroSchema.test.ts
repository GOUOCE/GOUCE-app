import { describe, it, expect, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../api/api', () => ({
  api: {
    get: jest.fn((...args: any[]) => {
      const url = args[0];
      if (url === '/bairros/2') {
        return Promise.resolve({
          data: {
            bairro_id: 2,
            nome_bairro: 'Bairro Novo',
            ativo: false,
            pontos_de_parada: [{ ponto_id: 103, nome_ponto: 'Avenida Principal', ativo: false }],
          },
        });
      }
      if (url === '/bairros/3') {
        return Promise.resolve({
          data: {
            bairro_id: 3,
            nome_bairro: 'Vila Antiga',
            ativo: true,
            pontos_de_parada: [{ ponto_id: 104, nome_ponto: 'Praça Velha', ativo: true }],
          },
        });
      }
      return Promise.resolve({
        data: [
          {
            bairro_id: 1,
            nome_bairro: 'Centro',
            ativo: true,
            vinculado_rota_ativa: true,
            pontos_de_parada: [{ ponto_id: 101, nome_ponto: 'Praça da Matriz', ativo: true }],
          },
          {
            bairro_id: 2,
            nome_bairro: 'Bairro Novo',
            ativo: true,
            vinculado_rota_ativa: false,
            pontos_de_parada: [{ ponto_id: 103, nome_ponto: 'Avenida Principal', ativo: true }],
          },
        ],
      });
    }),
    post: jest.fn((...args: any[]) => {
      const url = args[0];
      const body = args[1];
      if (url === '/bairros' && body?.nome_bairro?.toLowerCase() === 'centro') {
        const error: any = new Error('Esta localidade já está cadastrada.');
        (error as any).response = { status: 409 };
        return Promise.reject(error);
      }
      return Promise.resolve({
        data: {
          bairro_id: 100,
          nome_bairro: body?.nome_bairro || 'Novo Bairro',
          ativo: true,
          pontos_de_parada: (body?.pontos_de_parada || []).map((p: string, idx: number) => ({
            ponto_id: 1000 + idx,
            nome_ponto: p,
            ativo: true,
          })),
        },
      });
    }),
    patch: jest.fn((...args: any[]) => {
      const url = args[0];
      if (url === '/bairros/1/inativar') {
        const error: any = new Error('Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.');
        (error as any).response = { status: 409 };
        return Promise.reject(error);
      }
      return Promise.resolve({ data: { success: true } });
    }),
  },
}));

import { bairroSchema } from '../bairroSchema';
import { bairroService } from '../../services/bairroService';

describe('Suíte de Testes Unitários - HU-007 (Gerenciamento de Bairros e Pontos de Parada)', () => {
  describe('Validação do Formulário de Bairro (bairroSchema)', () => {
    it('deve aprovar nome válido e pelo menos um ponto de parada associado', () => {
      const res = bairroSchema.safeParse({
        nome: 'Centro',
        pontos: ['Praça da Matriz', 'Rodoviária'],
      });
      expect(res.success).toBe(true);
    });

    it('deve recusar quando o nome do bairro for menor que 3 caracteres', () => {
      const res = bairroSchema.safeParse({
        nome: 'Ab',
        pontos: ['Praça da Matriz'],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('pelo menos 3 caracteres');
      }
    });

    it('deve recusar nome de bairro contendo números, emojis ou símbolos especiais', () => {
      const res1 = bairroSchema.safeParse({
        nome: 'Centro 123',
        pontos: ['Praça da Matriz'],
      });
      expect(res1.success).toBe(false);
      if (!res1.success) {
        expect(res1.error.issues[0].message).toBe('Use apenas letras, espaços, hífen ou apóstrofo');
      }

      const res2 = bairroSchema.safeParse({
        nome: 'Centro 😀',
        pontos: ['Praça da Matriz'],
      });
      expect(res2.success).toBe(false);
    });

    it('deve recusar nome de ponto de parada com emojis ou símbolos especiais, aceitando números', () => {
      const resValido = bairroSchema.safeParse({
        nome: 'Centro',
        pontos: ['Rua 15 de Novembro'],
      });
      expect(resValido.success).toBe(true);

      const resInvalido = bairroSchema.safeParse({
        nome: 'Centro',
        pontos: ['Ponto 😀 @@'],
      });
      expect(resInvalido.success).toBe(false);
      if (!resInvalido.success) {
        expect(resInvalido.error.issues[0].message).toBe('Use apenas letras, números, espaços, hífen, apóstrofo ou ponto');
      }
    });

    it('deve recusar quando nenhum ponto de parada for adicionado', () => {
      const res = bairroSchema.safeParse({
        nome: 'Bairro Novo',
        pontos: [],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toBe('Adicione ao menos um ponto de parada');
      }
    });
  });

  describe('Regras de Negócio de Bairros e Pontos de Parada', () => {
    it('deve bloquear a criação de um bairro com nome já existente no sistema', async () => {
      await expect(
        bairroService.criarBairro('Centro', ['Ponto Novo'])
      ).rejects.toThrow('Esta localidade já está cadastrada.');
    });

    it('deve bloquear a inativação de um bairro que pertence a uma rota ativa', async () => {
      await expect(
        bairroService.inativarBairro(1)
      ).rejects.toThrow('Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.');
    });

    it('deve permitir inativar um bairro não vinculado a rotas ativas', async () => {
      await bairroService.inativarBairro(2);
      const bairro = await bairroService.obterBairroPorId(2);
      expect(bairro?.ativo).toBe(false);
    });

    it('deve permitir reativar um bairro inativo', async () => {
      await bairroService.reativarBairro(3);
      const bairro = await bairroService.obterBairroPorId(3);
      expect(bairro?.ativo).toBe(true);
    });
  });
});
