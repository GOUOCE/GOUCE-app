import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn<(url: string, config?: any) => Promise<any>>();
const mockPost = jest.fn<(url: string, body?: any) => Promise<any>>();

jest.mock('@/api/api', () => ({
  api: {
    get: (url: string, config?: any) => mockGet(url, config),
    post: (url: string, body?: any) => mockPost(url, body),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

import {
  logisticaService,
  AlocacaoDistribuicao,
  PreviaDistribuicao,
} from '../logisticaService';

const agendamentos = (quantidade: number) =>
  Array.from({ length: quantidade }, (_, indice) => ({
    agendamento_id: indice + 1,
    tipo_lugar: 'sentado' as const,
  }));

function respostaPreview(overrides: Partial<PreviaDistribuicao> = {}): PreviaDistribuicao {
  return {
    data: '2026-09-01',
    demanda_por_rota: [],
    alocacoes: [],
    excedentes_globais: [],
    alertas: [],
    ...overrides,
  };
}

function alocacao(overrides: Partial<AlocacaoDistribuicao> = {}): AlocacaoDistribuicao {
  return {
    rota_id: 1,
    onibus_id: 'ABC1234',
    motorista_id: 10,
    turno: 'ida',
    capacidade: { assentos: 40, em_pe: 10 },
    sentados: 0,
    em_pe: 0,
    alunos: [],
    excedentes: [],
    ...overrides,
  };
}

describe('EP-005 / HU-016 & HU-017 - Distribuição logística e alocação', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPost.mockReset();
  });

  describe('HU-016 - distribuição automática', () => {
    it('mapeia demanda, status, excedentes, ônibus e motorista a partir da prévia da API', async () => {
      const dataIso = '2026-09-01';
      const preview = respostaPreview({
        data: dataIso,
        demanda_por_rota: [
          { rota_id: 1, total_alunos: 38 },
          { rota_id: 2, total_alunos: 12 },
        ],
        alocacoes: [
          alocacao({
            rota_id: 1,
            onibus_id: 'ABC1234',
            motorista_id: 10,
            sentados: 38,
            alunos: agendamentos(38),
          }),
        ],
      });

      mockGet
        .mockResolvedValueOnce({ data: preview })
        .mockResolvedValueOnce({
          data: [
            {
              id: 1,
              nome: 'Linha 01 - Centro',
              horario_saida: '06:40',
              horario_retorno: '17:40',
              faculdades_ida: [{ sigla: 'UFC', nome: 'Universidade Federal do Ceará' }],
              faculdades_volta: [],
            },
            {
              id: 2,
              nome: 'Linha 02 - Bairro Novo',
              horario_saida: '07:00',
              horario_retorno: '18:00',
              faculdades_ida: [],
              faculdades_volta: [],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [
            {
              placa_onibus: 'ABC1234',
              apelido_onibus: 'Ônibus 07',
              qtd_assentos: 40,
              capacidade_maxima: 10,
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, nome: 'Ana Souza', ativo: true }],
        });

      const linhas = await logisticaService.listarDistribuicaoLogistica(dataIso);

      expect(mockGet).toHaveBeenCalledWith('/alocacao-diaria/distribuicao-automatica', {
        params: { data: dataIso },
      });
      expect(mockGet).toHaveBeenCalledWith('/rotas-principais', {
        params: { incluir_inativos: false },
      });
      expect(mockGet).toHaveBeenCalledWith('/onibus', { params: { ativo: true } });
      expect(mockGet).toHaveBeenCalledWith('/motoristas', {
        params: { incluir_inativos: false },
      });

      expect(linhas).toHaveLength(2);
      expect(linhas[0]).toMatchObject({
        id: 1,
        nomeLinha: 'Linha 01 - Centro',
        faculdades: ['UFC'],
        horarioSaida: '06:40',
        horarioVolta: '17:40',
        status: 'alocada',
        alunosAgendados: 38,
        alunosSentados: 38,
        alunosEmPe: 0,
        capacidadeSentados: 40,
        capacidadeEmPe: 10,
        excedentes: 0,
        motoristaNome: 'Ana Souza',
        onibusApelido: 'Ônibus 07',
      });
      expect(linhas[1]).toMatchObject({
        id: 2,
        nomeLinha: 'Linha 02 - Bairro Novo',
        status: 'pendente',
        alunosAgendados: 12,
        excedentes: 12,
        motoristaNome: null,
        onibusApelido: null,
      });
    });

    it('marca a rota como superlotada quando a demanda excede os alunos alocados', async () => {
      const dataIso = '2026-09-02';
      mockGet
        .mockResolvedValueOnce({
          data: respostaPreview({
            data: dataIso,
            demanda_por_rota: [{ rota_id: 3, total_alunos: 45 }],
            alocacoes: [
              alocacao({
                rota_id: 3,
                onibus_id: 'XYZ9999',
                turno: 'volta',
                sentados: 40,
                alunos: agendamentos(40),
                excedentes: [{ agendamento_id: 41, turno: 'volta' }],
              }),
            ],
          }),
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 3,
              nome: 'Linha 03 - Vila Antiga',
              horario_saida: '06:20',
              horario_retorno: '17:20',
              faculdades_ida: [],
              faculdades_volta: [],
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [
            {
              placa_onibus: 'XYZ9999',
              apelido_onibus: 'Ônibus 12',
              qtd_assentos: 40,
              capacidade_maxima: 10,
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [{ id: 10, nome: 'Ana Souza', ativo: true }],
        });

      const linhas = await logisticaService.listarDistribuicaoLogistica(dataIso);

      expect(linhas[0]).toMatchObject({
        status: 'superlotada',
        alunosAgendados: 45,
        alunosSentados: 40,
        excedentes: 5,
        onibusApelido: 'Ônibus 12',
        motoristaNome: 'Ana Souza',
      });
    });

    it('repassa a falha de conexão sem inventar linhas de exemplo', async () => {
      const semConexao = Object.assign(new Error('Network Error'), { request: {} });
      mockGet.mockRejectedValue(semConexao);

      await expect(logisticaService.listarDistribuicaoLogistica('2026-09-05')).rejects.toBe(
        semConexao,
      );
    });
  });

  describe('HU-017 - opções de alocação', () => {
    it('carrega a rota, a prévia e apenas ônibus/motoristas ativos para o formulário', async () => {
      const dataIso = '2026-09-03';
      mockGet
        .mockResolvedValueOnce({
          data: respostaPreview({
            data: dataIso,
            demanda_por_rota: [{ rota_id: 1, total_alunos: 2 }],
            alocacoes: [alocacao({ alunos: agendamentos(2), sentados: 2 })],
          }),
        })
        .mockResolvedValueOnce({
          data: {
            id: 1,
            nome: 'Linha 01 - Centro',
            horario_saida: '06:40',
            horario_retorno: '17:40',
            faculdades_ida: [],
            faculdades_volta: [],
          },
        })
        .mockResolvedValueOnce({
          data: [
            {
              placa_onibus: 'ABC1234',
              apelido_onibus: 'Ônibus 07',
              qtd_assentos: 40,
              capacidade_maxima: 10,
            },
          ],
        })
        .mockResolvedValueOnce({
          data: [
            { id: 10, nome: 'Ana Souza', ativo: true },
            { id: 11, nome: 'Motorista Inativo', ativo: false },
          ],
        });

      const opcoes = await logisticaService.obterOpcoesAlocacao(1, dataIso);

      expect(mockGet).toHaveBeenCalledWith('/rotas-principais/1', undefined);
      expect(opcoes.rota.nome).toBe('Linha 01 - Centro');
      expect(opcoes.preview.alocacoes).toHaveLength(1);
      expect(opcoes.onibus).toHaveLength(1);
      expect(opcoes.onibus[0]).toMatchObject({
        value: 'ABC1234',
        assentos: 40,
        capacidadeEmPe: 10,
      });
      expect(opcoes.onibus[0].label).toContain('40 sentados + 10 em pé');
      expect(opcoes.motoristas.map((motorista) => motorista.id)).toEqual([10]);
      expect(opcoes.onibusOptions).toEqual(opcoes.onibus);
      expect(opcoes.motoristaOptions).toEqual(opcoes.motoristas);
    });
  });

  describe('HU-017 - confirmação manual e cache da escala', () => {
    it('envia a escala manual e mantém as alocações confirmadas na listagem do dia', async () => {
      const dataIso = '2026-10-10';
      const payload = {
        data: dataIso,
        modo: 'manual' as const,
        alocacoes: [
          {
            rota_id: 5,
            onibus_id: 'NOVA123',
            motorista_id: 77,
            turno: 'ida' as const,
            alunos: agendamentos(3),
          },
        ],
      };
      const confirmadas = [
        alocacao({
          rota_id: 5,
          onibus_id: 'NOVA123',
          motorista_id: 77,
          sentados: 3,
          alunos: agendamentos(3),
        }),
      ];

      mockPost.mockResolvedValueOnce({
        data: {
          mensagem: 'Escala de motoristas confirmada com sucesso.',
          data: dataIso,
          status_logistico: 'CONFIRMADO',
          alocacoes: payload.alocacoes,
        },
      });

      const resposta = await logisticaService.confirmarDistribuicao(payload, confirmadas);

      expect(resposta.mensagem).toBe('Escala de motoristas confirmada com sucesso.');
      expect(mockPost).toHaveBeenCalledWith('/alocacao-diaria/distribuicao', payload);

      const previewOriginal = respostaPreview({
        data: dataIso,
        demanda_por_rota: [{ rota_id: 5, total_alunos: 3 }],
        alocacoes: [
          alocacao({
            rota_id: 5,
            onibus_id: 'ANTIGA1',
            motorista_id: 99,
            sentados: 3,
            alunos: agendamentos(3),
          }),
        ],
      });

      const mockReferencias = () => {
        mockGet
          .mockResolvedValueOnce({ data: previewOriginal })
          .mockResolvedValueOnce({
            data: [
              {
                id: 5,
                nome: 'Linha 05 - Jardim',
                horario_saida: '06:00',
                horario_retorno: '18:00',
                faculdades_ida: [],
                faculdades_volta: [],
              },
            ],
          })
          .mockResolvedValueOnce({
            data: [
              {
                placa_onibus: 'NOVA123',
                apelido_onibus: 'Ônibus Novo',
                qtd_assentos: 40,
                capacidade_maxima: 10,
              },
              {
                placa_onibus: 'ANTIGA1',
                apelido_onibus: 'Ônibus Antigo',
                qtd_assentos: 40,
                capacidade_maxima: 10,
              },
            ],
          })
          .mockResolvedValueOnce({
            data: [
              { id: 77, nome: 'Carlos Lima', ativo: true },
              { id: 99, nome: 'Motorista Antigo', ativo: true },
            ],
          });
      };

      mockReferencias();
      const linhasComCache = await logisticaService.listarDistribuicaoLogistica(dataIso);

      expect(linhasComCache[0]).toMatchObject({
        onibusApelido: 'Ônibus Novo',
        motoristaNome: 'Carlos Lima',
        alunosSentados: 3,
        excedentes: 0,
      });

      mockPost.mockResolvedValueOnce({
        data: {
          mensagem: 'Distribuição realizada com sucesso',
          data: dataIso,
          status_logistico: 'CONFIRMADO',
          alocacoes: [],
        },
      });

      await logisticaService.confirmarDistribuicao({
        data: dataIso,
        modo: 'automatico',
        alocacoes: [],
      });

      mockReferencias();
      const linhasAutomaticas = await logisticaService.listarDistribuicaoLogistica(dataIso);

      expect(linhasAutomaticas[0]).toMatchObject({
        onibusApelido: 'Ônibus Antigo',
        motoristaNome: 'Motorista Antigo',
      });
    });
  });

  describe('HU-016 - alunos excedentes', () => {
    it('lista os excedentes globais e a contagem da rota selecionada', async () => {
      const dataIso = '2026-09-04';
      mockGet
        .mockResolvedValueOnce({
          data: respostaPreview({
            data: dataIso,
            demanda_por_rota: [{ rota_id: 3, total_alunos: 45 }],
            alocacoes: [
              alocacao({
                rota_id: 3,
                sentados: 40,
                alunos: agendamentos(40),
                excedentes: [
                  { agendamento_id: 41, turno: 'ida' },
                  { agendamento_id: 42, turno: 'volta' },
                ],
              }),
            ],
            excedentes_globais: [
              { agendamento_id: 41, turno: 'ida' },
              { agendamento_id: 42, turno: 'volta' },
            ],
          }),
        })
        .mockResolvedValueOnce({
          data: [
            {
              id: 3,
              nome: 'Linha 03 - Vila Antiga',
              horario_saida: '06:20',
              horario_retorno: '17:20',
              faculdades_ida: [],
              faculdades_volta: [],
            },
          ],
        })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      const { rota, alunos } = await logisticaService.obterExcedentes(dataIso, 3);

      expect(rota?.excedentes).toBe(5);
      expect(rota?.nomeLinha).toBe('Linha 03 - Vila Antiga');
      expect(alunos).toHaveLength(2);
      expect(alunos[0]).toMatchObject({
        id: 41,
        turno: 'ida',
        nome: 'Agendamento #41',
        trajetoText: 'Turno de ida',
        selecionado: false,
      });
      expect(alunos[1]).toMatchObject({
        id: 42,
        turno: 'volta',
        nome: 'Agendamento #42',
        trajetoText: 'Turno de volta',
      });
    });
  });
});
