import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '@/api/api';
import {
  INTERVALO_POLLING_LISTA_MS,
  determinarSentidoViagem,
  extrairMensagemErroListaEmbarque,
  formatarTempoSincronizacao,
  formatarTrajetoEmbarque,
  listaEmbarqueService,
  mapearRespostaListaEmbarque,
  type ListaEmbarqueApiResponse,
} from '../listaEmbarqueService';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

function criarRespostaApiFixture(
  override: Partial<ListaEmbarqueApiResponse> = {},
): ListaEmbarqueApiResponse {
  return {
    data: '2026-11-20',
    rota_id: 1,
    nome_rota: 'Linha 01 - Centro',
    horario_saida: '06:40',
    horario_retorno: '17:00',
    veiculos_escalados: [
      {
        alocacao_id: 10,
        turno: 'ida',
        onibus_placa: 'OCR-1234',
        motorista_nome: 'Ana Souza',
        total_sentados: 3,
        total_em_pe: 1,
      },
    ],
    total_alunos_alocados: 4,
    texto_contador: '4 alunos alocados',
    permite_imprimir: true,
    mensagem: null,
    ultima_sincronizacao: '2026-11-20T09:29:00.000Z',
    indicador_sincronizacao: 'Atualizado agora',
    alunos: [
      {
        aluno_id: 1,
        agendamento_id: 101,
        nome_aluno: 'Ana Paula Lima',
        ponto_embarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ponto_desembarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ies_ida: { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
        ies_volta: { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
        indicacao_turno: 'IDA_E_VOLTA_MESMA_IES',
      },
      {
        aluno_id: 2,
        agendamento_id: 102,
        nome_aluno: 'Bruno Costa',
        ponto_embarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ponto_desembarque: null,
        ies_ida: { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: null, campus: 'Quixadá' },
        ies_volta: null,
        indicacao_turno: 'APENAS_IDA',
      },
      {
        aluno_id: 3,
        agendamento_id: 103,
        nome_aluno: 'Carla Dias',
        ponto_embarque: null,
        ponto_desembarque: { ponto_id: 2, nome: 'Trevo Bairro Novo', bairro: 'Bairro Novo' },
        ies_ida: null,
        ies_volta: { id: 3, nome: 'Universidade Estadual do Ceará', sigla: 'UECE', campus: 'Quixadá' },
        indicacao_turno: 'APENAS_VOLTA',
      },
      {
        aluno_id: 4,
        agendamento_id: 104,
        nome_aluno: 'Wesley Pontes',
        ponto_embarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ponto_desembarque: { ponto_id: 1, nome: 'Pça. Matriz', bairro: 'Centro' },
        ies_ida: { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', campus: 'Quixadá' },
        ies_volta: { id: 2, nome: 'Centro Universitário Católica de Quixadá', sigla: 'Católica', campus: 'Quixadá' },
        indicacao_turno: 'IDA_E_VOLTA_IES_DISTINTAS',
      },
    ],
    ...override,
  };
}

describe('listaEmbarqueService (HU-018)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
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
        }),
      ).toBe('Pça. Matriz ↔ UFC');
    });

    it('formata apenas ida com seta para a direita', () => {
      expect(determinarSentidoViagem('Católica', undefined)).toBe('SOMENTE_IDA');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Pça. Matriz',
          iesIda: 'Católica',
        }),
      ).toBe('Pça. Matriz → Católica');
    });

    it('formata apenas volta com seta para a esquerda', () => {
      expect(determinarSentidoViagem(undefined, 'UECE')).toBe('SOMENTE_VOLTA');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Trevo Bairro Novo',
          iesVolta: 'UECE',
        }),
      ).toBe('Trevo Bairro Novo ← UECE');
    });

    it('formata IES distintas na ida e na volta separando os trechos', () => {
      expect(determinarSentidoViagem('UFC', 'Católica')).toBe('IES_DISTINTAS');
      expect(
        formatarTrajetoEmbarque({
          pontoEmbarque: 'Pça. Matriz',
          iesIda: 'UFC',
          iesVolta: 'Católica',
        }),
      ).toBe('Ida: Pça. Matriz → UFC | Volta: ← Católica');
    });

    it('lança erro quando nenhuma IES é informada para determinar sentido', () => {
      expect(() => determinarSentidoViagem(undefined, '   ')).toThrow(
        'Informe ao menos uma IES de ida ou de volta para o aluno.',
      );
    });
  });

  describe('formatarTempoSincronizacao e extrairMensagemErroListaEmbarque', () => {
    it('retorna "Atualizado agora" para intervalos menores que 1 minuto ou inválidos', () => {
      const agora = new Date('2026-09-01T09:30:30.000Z');
      expect(formatarTempoSincronizacao('2026-09-01T09:30:00.000Z', agora)).toBe('Atualizado agora');
      expect(formatarTempoSincronizacao('data-invalida', agora)).toBe('Atualizado agora');
    });

    it('retorna "Atualizado há 1 min" e "Atualizado há 5 min" conforme o tempo decorrido', () => {
      const base = '2026-09-01T09:30:00.000Z';
      expect(formatarTempoSincronizacao(base, new Date('2026-09-01T09:31:00.000Z'))).toBe(
        'Atualizado há 1 min',
      );
      expect(formatarTempoSincronizacao(base, new Date('2026-09-01T09:35:20.000Z'))).toBe(
        'Atualizado há 5 min',
      );
    });

    it('extrai mensagens de detail objeto, error.message e erro de rede', () => {
      expect(
        extrairMensagemErroListaEmbarque({
          response: {
            data: {
              detail: {
                code: 'SEM_ROTA_NO_DIA',
                message: 'Nenhuma rota encontrada para esta data e faculdade.',
              },
            },
          },
        }),
      ).toBe('Nenhuma rota encontrada para esta data e faculdade.');

      expect(
        extrairMensagemErroListaEmbarque({
          response: {
            data: {
              error: { message: 'Rota não encontrada.' },
            },
          },
        }),
      ).toBe('Rota não encontrada.');

      expect(extrairMensagemErroListaEmbarque(new Error('Network Error'))).toContain(
        'Erro de conexão com o servidor',
      );
    });
  });

  describe('integração HTTP com endpoints de alocação diária', () => {
    it('lista rotas do dia consultando GET /alocacao-diaria/rotas-do-dia', async () => {
      mockApiGet.mockResolvedValueOnce({
        data: {
          data: '2026-11-20',
          rotas: [
            { rota_id: 1, nome_rota: 'Linha 01 - Centro', horario_saida: '06:40' },
            { rota_id: 2, nome_rota: 'Linha 02 - Bairro Novo', horario_saida: '07:00' },
          ],
        },
      } as any);

      const rotas = await listaEmbarqueService.listarRotasDisponiveis('2026-11-20');

      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/rotas-do-dia', {
        params: { data: '2026-11-20' },
      });
      expect(rotas).toEqual([
        { id: 1, nome: 'Linha 01 - Centro', horarioSaida: '06:40' },
        { id: 2, nome: 'Linha 02 - Bairro Novo', horarioSaida: '07:00' },
      ]);
    });

    it('mapeia resposta de GET /alocacao-diaria/lista-embarque com os quatro sentidos de viagem', async () => {
      mockApiGet.mockResolvedValueOnce({ data: criarRespostaApiFixture() } as any);

      const lista = await listaEmbarqueService.obterListaEmbarque({
        rotaId: 1,
        data: '2026-11-20',
        turno: 'ida',
      });

      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque', {
        params: { data: '2026-11-20', rota_id: 1, turno: 'ida' },
      });
      expect(lista.rotaId).toBe(1);
      expect(lista.rotaNome).toBe('Linha 01 - Centro');
      expect(lista.dataOperacao).toBe('20/11/2026');
      expect(lista.totalAlunos).toBe(4);

      expect(lista.alunos[0].trajetoFormatado).toBe('Pça. Matriz ↔ UFC');
      expect(lista.alunos[0].sentidoViagem).toBe('IDA_E_VOLTA_MESMA_IES');

      expect(lista.alunos[1].trajetoFormatado).toBe(
        'Pça. Matriz → Centro Universitário Católica de Quixadá',
      );
      expect(lista.alunos[1].sentidoViagem).toBe('SOMENTE_IDA');

      expect(lista.alunos[2].trajetoFormatado).toBe('Trevo Bairro Novo ← UECE');
      expect(lista.alunos[2].sentidoViagem).toBe('SOMENTE_VOLTA');

      expect(lista.alunos[3].trajetoFormatado).toBe('Ida: Pça. Matriz → UFC | Volta: ← Católica');
      expect(lista.alunos[3].sentidoViagem).toBe('IES_DISTINTAS');
    });

    it('permite autodescoberta do representante sem enviar rota_id', async () => {
      mockApiGet.mockResolvedValueOnce({
        data: criarRespostaApiFixture({ total_alunos_alocados: 1, alunos: [criarRespostaApiFixture().alunos[0]] }),
      } as any);

      const lista = await listaEmbarqueService.obterListaEmbarque({
        data: '2026-11-20',
        perfil: 'MOTORISTA',
      });

      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque', {
        params: { data: '2026-11-20' },
      });
      expect(lista.totalAlunos).toBe(1);
    });

    it('retorna lista vazia com mensagem do backend para rota sem alunos alocados (FA-002)', () => {
      const lista = mapearRespostaListaEmbarque(
        criarRespostaApiFixture({
          rota_id: 2,
          nome_rota: 'Linha 02 - Bairro Novo',
          total_alunos_alocados: 0,
          texto_contador: '0 alunos alocados',
          permite_imprimir: false,
          mensagem: 'Essa rota não possui nenhum aluno alocado para este dia.',
          alunos: [],
        }),
      );

      expect(lista.rotaNome).toBe('Linha 02 - Bairro Novo');
      expect(lista.totalAlunos).toBe(0);
      expect(lista.permiteImprimir).toBe(false);
      expect(lista.mensagem).toBe('Essa rota não possui nenhum aluno alocado para este dia.');
      expect(lista.alunos).toEqual([]);
    });

    it('consulta rota padrão do representante via /rotas-do-dia', async () => {
      mockApiGet
        .mockResolvedValueOnce({
          data: {
            data: '2026-11-20',
            rotas: [{ rota_id: 7, nome_rota: 'Linha 07 - Campus', horario_saida: '06:15' }],
          },
        } as any)
        .mockResolvedValueOnce({
          data: { data: '2026-11-20', rotas: [] },
        } as any);

      const encontrada = await listaEmbarqueService.obterRotaPadraoRepresentante('2026-11-20');
      expect(encontrada).toEqual({
        rotaId: 7,
        rotaNome: 'Linha 07 - Campus',
        horarioSaida: '06:15',
      });

      const nenhuma = await listaEmbarqueService.obterRotaPadraoRepresentante('2026-11-20');
      expect(nenhuma).toBeNull();
    });
  });

  describe('atualização em tempo real via polling (FA-003)', () => {
    it('consulta periodicamente o endpoint e para após cancelar inscrição', async () => {
      jest.useFakeTimers();

      const fixture = criarRespostaApiFixture();
      mockApiGet.mockResolvedValue({ data: fixture } as any);

      const listener = jest.fn();
      const cancelar = listaEmbarqueService.inscreverAtualizacaoRota(1, listener, {
        data: '2026-11-20',
      });

      expect(mockApiGet).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(INTERVALO_POLLING_LISTA_MS);

      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(mockApiGet).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque', {
        params: { data: '2026-11-20', rota_id: 1 },
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ rotaId: 1, totalAlunos: 4 }),
      );

      cancelar();
      await jest.advanceTimersByTimeAsync(INTERVALO_POLLING_LISTA_MS * 2);
      expect(mockApiGet).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });
});
