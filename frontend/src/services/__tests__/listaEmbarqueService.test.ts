import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  determinarSentidoViagem,
  formatarTempoSincronizacao,
  formatarTrajetoEmbarque,
  listaEmbarqueService,
} from '../listaEmbarqueService';

describe('listaEmbarqueService (HU-018)', () => {
  beforeEach(() => {
    listaEmbarqueService.resetarMocks();
  });

  describe('determinarSentidoViagem e formatarTrajetoEmbarque', () => {
    it('formata ida e volta na mesma IES com seta dupla', () => {
      expect(determinarSentidoViagem('UFC', 'UFC')).toBe('IDA_E_VOLTA_MESMA_IES');
      expect(determinarSentidoViagem(' ufc ', 'UFC')).toBe('IDA_E_VOLTA_MESMA_IES');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Pça. Matriz',
          iesIda: 'UFC',
          iesVolta: 'UFC',
        })
      ).toBe('Pça. Matriz ↔ UFC');
    });

    it('formata apenas ida com seta para a direita', () => {
      expect(determinarSentidoViagem('Católica', undefined)).toBe('SOMENTE_IDA');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Pça. Matriz',
          iesIda: 'Católica',
        })
      ).toBe('Pça. Matriz → Católica');
    });

    it('formata apenas volta com seta para a esquerda', () => {
      expect(determinarSentidoViagem(undefined, 'UECE')).toBe('SOMENTE_VOLTA');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Trevo Bairro Novo',
          iesVolta: 'UECE',
        })
      ).toBe('Trevo Bairro Novo ← UECE');
    });

    it('formata IES distintas na ida e na volta separando os trechos', () => {
      expect(determinarSentidoViagem('UFC', 'Católica')).toBe('IES_DISTINTAS');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Pça. Matriz',
          iesIda: 'UFC',
          iesVolta: 'Católica',
        })
      ).toBe('Ida: Pça. Matriz → UFC | Volta: ← Católica');
    });

    it('lança erro quando nenhuma IES é informada para determinar sentido', () => {
      expect(() => determinarSentidoViagem(undefined, '   ')).toThrow(
        'Informe ao menos uma IES de ida ou de volta para o aluno.'
      );
    });
  });

  describe('formatarTempoSincronizacao', () => {
    it('retorna "Atualizado agora" para intervalos menores que 1 minuto ou inválidos', () => {
      const agora = new Date('2026-09-01T09:30:30.000Z');
      expect(formatarTempoSincronizacao('2026-09-01T09:30:00.000Z', agora)).toBe('Atualizado agora');
      expect(formatarTempoSincronizacao('data-invalida', agora)).toBe('Atualizado agora');
    });

    it('retorna "Atualizado há 1 min" e "Atualizado há 5 min" conforme o tempo decorrido', () => {
      const base = '2026-09-01T09:30:00.000Z';
      expect(formatarTempoSincronizacao(base, new Date('2026-09-01T09:31:00.000Z'))).toBe(
        'Atualizado há 1 min'
      );
      expect(formatarTempoSincronizacao(base, new Date('2026-09-01T09:35:20.000Z'))).toBe(
        'Atualizado há 5 min'
      );
    });
  });

  describe('consultas e filtros por perfil', () => {
    it('lista todas as rotas disponíveis com quantidades iniciais corretas', async () => {
      const rotas = await listaEmbarqueService.listarRotasDisponiveis();

      expect(rotas).toEqual([
        { id: 1, nome: 'Linha 01 - Centro', quantidadeAlunos: 38 },
        { id: 2, nome: 'Linha 02 - Bairro Novo', quantidadeAlunos: 0 },
        { id: 3, nome: 'Linha 03 - Serrinha', quantidadeAlunos: 6 },
      ]);
    });

    it('retorna os 38 alunos ordenados alfabeticamente para o Administrador na Linha 01', async () => {
      const lista = await listaEmbarqueService.obterListaEmbarque({
        rotaId: 1,
        perfil: 'ADMINISTRADOR',
      });

      expect(lista.rotaNome).toBe('Linha 01 - Centro');
      expect(lista.dataOperacao).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
      expect(lista.totalAlunos).toBe(38);
      expect(lista.alunos).toHaveLength(38);

      expect(lista.alunos[0].nome).toBe('Ana Paula Lima');
      expect(lista.alunos[0].trajetoFormatado).toBe('Pça. Matriz ↔ UFC');
      expect(lista.alunos[1].nome).toBe('Bruno Costa');
      expect(lista.alunos[1].trajetoFormatado).toBe('Pça. Matriz → Católica');
      expect(lista.alunos[2].nome).toBe('Carla Dias');
      expect(lista.alunos[2].trajetoFormatado).toBe('Trevo Bairro Novo ← UECE');
      expect(lista.alunos[37].nome).toBe('Wesley Pontes');
      expect(lista.alunos[37].trajetoFormatado).toBe('Ida: Pça. Matriz → UFC | Volta: ← Católica');

      expect(formatarTempoSincronizacao(lista.ultimaSincronizacaoISO)).toBe('Atualizado há 1 min');
    });

    it('retorna lista vazia para rota sem alunos alocados (FA-002)', async () => {
      const lista = await listaEmbarqueService.obterListaEmbarque({ rotaId: 2 });

      expect(lista.rotaNome).toBe('Linha 02 - Bairro Novo');
      expect(lista.totalAlunos).toBe(0);
      expect(lista.alunos).toEqual([]);
    });

    it('restringe alunos à IES de responsabilidade quando o perfil for Representante (FA-001 / RNF-010)', async () => {
      const padrao = await listaEmbarqueService.obterRotaPadraoRepresentante();
      expect(padrao).toEqual({
        rotaId: 1,
        rotaNome: 'Linha 01 - Centro',
        iesResponsavel: 'UFC',
      });

      const listaUfc = await listaEmbarqueService.obterListaEmbarque({
        rotaId: padrao.rotaId,
        perfil: 'MOTORISTA',
        iesResponsavel: padrao.iesResponsavel,
      });

      expect(listaUfc.totalAlunos).toBe(listaUfc.alunos.length);
      expect(listaUfc.totalAlunos).toBeGreaterThan(0);
      expect(listaUfc.totalAlunos).toBeLessThan(38);

      for (const aluno of listaUfc.alunos) {
        expect(aluno.iesIda === 'UFC' || aluno.iesVolta === 'UFC').toBe(true);
      }

      const nomesUfc = listaUfc.alunos.map((a) => a.nome);
      expect(nomesUfc).toContain('Ana Paula Lima');
      expect(nomesUfc).toContain('Wesley Pontes');
      expect(nomesUfc).not.toContain('Bruno Costa');
      expect(nomesUfc).not.toContain('Carla Dias');

      const listaUece = await listaEmbarqueService.obterListaEmbarque({
        rotaId: 1,
        perfil: 'MOTORISTA',
        iesResponsavel: 'UECE',
      });
      const nomesUece = listaUece.alunos.map((a) => a.nome);
      expect(nomesUece).toContain('Carla Dias');
      expect(nomesUece).not.toContain('Ana Paula Lima');
    });

    it('lança erro ao consultar rota inexistente', async () => {
      await expect(listaEmbarqueService.obterListaEmbarque({ rotaId: 999 })).rejects.toThrow(
        'Rota 999 não encontrada.'
      );
    });
  });

  describe('atualização em tempo real (FA-003)', () => {
    it('notifica listeners ao simular cancelamento e realocação e respeita cancelamento da inscrição', async () => {
      const listener = jest.fn();
      const cancelarInscricao = listaEmbarqueService.inscreverAtualizacaoRota(1, listener);

      const aposCancelamento = await listaEmbarqueService.simularAlteracaoTempoReal(
        1,
        'cancelamento'
      );
      expect(aposCancelamento.totalAlunos).toBe(37);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ rotaId: 1, totalAlunos: 37 })
      );

      const aposRealocacao = await listaEmbarqueService.simularAlteracaoTempoReal(1, 'realocacao');
      expect(aposRealocacao.totalAlunos).toBe(38);
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ rotaId: 1, totalAlunos: 38 })
      );

      cancelarInscricao();
      await listaEmbarqueService.simularAlteracaoTempoReal(1, 'cancelamento');
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('mantém filtro de IES nas notificações em tempo real para o Representante', async () => {
      const listenerRepresentante = jest.fn<(lista: { alunos: Array<{ iesIda?: string; iesVolta?: string }> }) => void>();
      const inicialUfc = await listaEmbarqueService.obterListaEmbarque({
        rotaId: 1,
        perfil: 'MOTORISTA',
        iesResponsavel: 'UFC',
      });

      const cancelar = listaEmbarqueService.inscreverAtualizacaoRota(1, listenerRepresentante, {
        perfil: 'MOTORISTA',
        iesResponsavel: 'UFC',
      });

      await listaEmbarqueService.simularAlteracaoTempoReal(1, 'realocacao');

      expect(listenerRepresentante).toHaveBeenCalledTimes(1);
      const payload = listenerRepresentante.mock.calls[0][0];
      expect(payload.alunos).toHaveLength(inicialUfc.totalAlunos + 1);
      for (const aluno of payload.alunos) {
        expect(aluno.iesIda === 'UFC' || aluno.iesVolta === 'UFC').toBe(true);
      }

      cancelar();
    });
  });
});
