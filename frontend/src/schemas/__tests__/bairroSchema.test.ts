import { describe, it, expect } from '@jest/globals';
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
      // O bairro Centro (ID 1) está vinculado a uma rota ativa no MOCK
      await expect(
        bairroService.inativarBairro(1)
      ).rejects.toThrow('Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.');
    });

    it('deve permitir inativar um bairro não vinculado a rotas ativas', async () => {
      // O bairro Bairro Novo (ID 2) não está vinculado a rotas ativas
      await bairroService.inativarBairro(2);
      const bairro = await bairroService.obterBairroPorId(2);
      expect(bairro?.ativo).toBe(false);
    });

    it('deve permitir reativar um bairro inativo', async () => {
      // O bairro Vila Antiga (ID 3) está inativo
      await bairroService.reativarBairro(3);
      const bairro = await bairroService.obterBairroPorId(3);
      expect(bairro?.ativo).toBe(true);
    });
  });
});
