import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { api } from '@/api/api';
import {
  INTERVALO_POLLING_LISTA_MS,
  calcularTotaisFrequencia,
  determinarSentidoViagem,
  extrairMensagemErroListaEmbarque,
  formatarTempoSincronizacao,
  formatarTrajetoEmbarque,
  listaEmbarqueService,
  mapearRespostaListaEmbarque,
  type ListaEmbarqueApiResponse,
} from '../listaEmbarqueService';

const mockAsyncStore = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockAsyncStore.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => {
    mockAsyncStore.set(key, value);
  }),
  removeItem: jest.fn(async (key: string) => {
    mockAsyncStore.delete(key);
  }),
}));

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;
const mockApiPatch = api.patch as jest.MockedFunction<typeof api.patch>;

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
  beforeEach(async () => {
    jest.clearAllMocks();
    mockAsyncStore.clear();
    await listaEmbarqueService.limparCacheFrequencia();
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

  describe('registro de frequência e fila offline (HU-021)', () => {
    it('inicializa alunos sem check-in com status PENDENTE e calcula totais (CA-03 e CA-07)', () => {
      const lista = mapearRespostaListaEmbarque(criarRespostaApiFixture());

      expect(lista.alunos.every((aluno) => aluno.statusPresenca === 'PENDENTE')).toBe(true);
      expect(lista.totalPresentes).toBe(0);
      expect(lista.totalFaltas).toBe(0);
      expect(lista.totalPendentes).toBe(4);
      expect(
        calcularTotaisFrequencia([
          { ...lista.alunos[0], statusPresenca: 'PRESENTE' },
          { ...lista.alunos[1], statusPresenca: 'FALTA' },
          lista.alunos[2],
        ]),
      ).toEqual({
        totalPresentes: 1,
        totalFaltas: 1,
        totalPendentes: 1,
      });
    });

    it('envia PATCH ao registrar presença/falta na data corrente (CA-01 e CA-02)', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 16, 30, 0));
      mockApiPatch.mockResolvedValueOnce({ data: { ok: true } } as any);

      const resultado = await listaEmbarqueService.registrarFrequencia({
        rotaId: 1,
        agendamentoId: 101,
        statusPresenca: 'PRESENTE',
        data: '2026-11-21',
      });

      expect(resultado).toEqual({ sincronizado: true, pendenteOffline: false });
      expect(mockApiPatch).toHaveBeenCalledWith('/alocacao-diaria/lista-embarque/frequencia', {
        data: '2026-11-21',
        rota_id: 1,
        agendamento_id: 101,
        status_presenca: 'PRESENTE',
      });
    });

    it('bloqueia registro de frequência fora da data da viagem (RN-014 e FA-001)', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 16, 30, 0));

      await expect(
        listaEmbarqueService.registrarFrequencia({
          rotaId: 1,
          agendamentoId: 101,
          statusPresenca: 'PRESENTE',
          data: '2026-11-20',
        }),
      ).rejects.toThrow('A chamada só pode ser realizada no dia exato da viagem.');
      expect(mockApiPatch).not.toHaveBeenCalled();
    });

    it('armazena marcação localmente quando sem conexão e sincroniza ao restabelecer rede (FA-003)', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 16, 30, 0));
      mockApiPatch.mockRejectedValueOnce(new Error('Network Error'));

      const offlineRes = await listaEmbarqueService.registrarFrequencia({
        rotaId: 1,
        agendamentoId: 101,
        statusPresenca: 'FALTA',
        data: '2026-11-21',
      });

      expect(offlineRes).toEqual({ sincronizado: false, pendenteOffline: true });
      const pendentesAntes = await listaEmbarqueService.obterFrequenciasPendentes({ rotaId: 1 });
      expect(pendentesAntes).toHaveLength(1);
      expect(pendentesAntes[0].statusPresenca).toBe('FALTA');

      mockApiPatch.mockResolvedValueOnce({ data: { ok: true } } as any);
      const syncRes = await listaEmbarqueService.sincronizarFrequenciasPendentes();

      expect(syncRes).toEqual({ sincronizados: 1, restantes: 0 });
      expect(mockApiPatch).toHaveBeenLastCalledWith('/alocacao-diaria/lista-embarque/frequencia', {
        data: '2026-11-21',
        rota_id: 1,
        agendamento_id: 101,
        status_presenca: 'FALTA',
      });
      const pendentesDepois = await listaEmbarqueService.obterFrequenciasPendentes();
      expect(pendentesDepois).toHaveLength(0);
    });

    it('mapeia dataOperacaoIso, status_presenca, presenca_registrada_em e totais do backend', () => {
      const fixture = criarRespostaApiFixture({
        data: '2026-11-21',
        total_presentes: 1,
        total_faltas: 1,
        total_pendentes: 2,
        somente_leitura: true,
        alunos: [
          {
            ...criarRespostaApiFixture().alunos[0],
            status_presenca: 'PRESENTE',
            presenca_registrada_em: '2026-11-21T09:15:00.000Z',
          },
          {
            ...criarRespostaApiFixture().alunos[1],
            status_presenca: 'FALTA',
            presenca_registrada_em: '2026-11-21T09:16:00.000Z',
          },
          ...criarRespostaApiFixture().alunos.slice(2),
        ],
      });

      const lista = mapearRespostaListaEmbarque(fixture);

      expect(lista.dataOperacaoIso).toBe('2026-11-21');
      expect(lista.somenteLeitura).toBe(true);
      expect(lista.totalPresentes).toBe(1);
      expect(lista.totalFaltas).toBe(1);
      expect(lista.totalPendentes).toBe(2);
      expect(lista.alunos[0].statusPresenca).toBe('PRESENTE');
      expect(lista.alunos[0].dataHoraCheckin).toBe('2026-11-21T09:15:00.000Z');
      expect(lista.alunos[1].statusPresenca).toBe('FALTA');
      expect(lista.alunos[1].dataHoraCheckin).toBe('2026-11-21T09:16:00.000Z');
    });

    it('reflete alteração posterior do backend no polling após registrarFrequencia online', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 16, 30, 0));
      mockApiPatch.mockResolvedValueOnce({ data: { status_presenca: 'PRESENTE' } } as any);

      await listaEmbarqueService.registrarFrequencia({
        rotaId: 1,
        agendamentoId: 101,
        statusPresenca: 'PRESENTE',
        data: '2026-11-21',
      });

      const fixtureAtualizada = criarRespostaApiFixture({
        data: '2026-11-21',
        total_presentes: 0,
        total_faltas: 1,
        total_pendentes: 3,
        alunos: [
          {
            ...criarRespostaApiFixture().alunos[0],
            status_presenca: 'FALTA',
            presenca_registrada_em: '2026-11-21T16:35:00.000Z',
          },
          ...criarRespostaApiFixture().alunos.slice(1),
        ],
      });
      mockApiGet.mockResolvedValueOnce({ data: fixtureAtualizada } as any);

      const listaPolling = await listaEmbarqueService.obterListaEmbarque({
        rotaId: 1,
        data: '2026-11-21',
      });

      expect(listaPolling.alunos[0].statusPresenca).toBe('FALTA');
      expect(listaPolling.totalFaltas).toBe(1);
    });

    it('rejeita e não enfileira offline quando backend retorna 403, 404 ou 422', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 16, 30, 0));

      for (const erroHttp of [
        { response: { status: 403, data: { detail: 'Representante sem permissão para esta IES.' } } },
        { response: { status: 404, data: { detail: 'Endpoint não encontrado' } } },
        {
          response: {
            status: 422,
            data: { success: false, error: { code: 'LISTA_EMBARQUE_ERRO', message: 'Aluno inativo.' } },
          },
        },
      ]) {
        mockApiPatch.mockRejectedValueOnce(erroHttp);
        await expect(
          listaEmbarqueService.registrarFrequencia({
            rotaId: 1,
            agendamentoId: 101,
            statusPresenca: 'PRESENTE',
            data: '2026-11-21',
          }),
        ).rejects.toEqual(erroHttp);
      }

      const pendentes = await listaEmbarqueService.obterFrequenciasPendentes();
      expect(pendentes).toHaveLength(0);
    });

    it('descarta rejeição 422 na sincronização e mantém falhas 500 ou de rede na fila offline', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2026, 10, 21, 16, 30, 0));

      mockApiPatch.mockRejectedValue(new Error('Network Error'));
      await listaEmbarqueService.registrarFrequencia({
        rotaId: 1,
        agendamentoId: 101,
        statusPresenca: 'PRESENTE',
        data: '2026-11-21',
      });
      await listaEmbarqueService.registrarFrequencia({
        rotaId: 1,
        agendamentoId: 102,
        statusPresenca: 'FALTA',
        data: '2026-11-21',
      });
      await listaEmbarqueService.registrarFrequencia({
        rotaId: 1,
        agendamentoId: 103,
        statusPresenca: 'PRESENTE',
        data: '2026-11-21',
      });

      mockApiPatch.mockReset();
      mockApiPatch
        .mockRejectedValueOnce({
          response: {
            status: 422,
            data: { success: false, error: { code: 'LISTA_EMBARQUE_ERRO', message: 'Inválido' } },
          },
        })
        .mockRejectedValueOnce({ response: { status: 500, data: { detail: 'Erro interno' } } })
        .mockRejectedValueOnce(new Error('Network Error'));

      const syncRes = await listaEmbarqueService.sincronizarFrequenciasPendentes();
      expect(syncRes).toEqual({ sincronizados: 0, restantes: 2 });

      const restantes = await listaEmbarqueService.obterFrequenciasPendentes();
      expect(restantes.map((item) => item.agendamentoId)).toEqual([102, 103]);
    });
  });
});
