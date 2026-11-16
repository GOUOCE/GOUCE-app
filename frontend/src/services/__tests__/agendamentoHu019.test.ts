import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/api/api';
import {
  agendamentoService,
  AgendamentoDetalhe,
  enriquecerDetalheComMinhaViagem,
  formatarSubtituloRotaPrincipal,
  mapearDetalhe,
  MinhaViagemApiResponse,
} from '../agendamentoService';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

function criarDetalheBase(override: Partial<AgendamentoDetalhe> = {}): AgendamentoDetalhe {
  const faculdades = [
    { id: 1, nome: 'Universidade Federal do Ceará' },
    { id: 2, nome: 'Centro Universitário Católica de Quixadá' },
    { id: 3, nome: 'FECLESC / Universidade Estadual do Ceará' },
  ];

  return {
    id: 10,
    aluno_id: 5,
    data: '2026-08-31',
    usa_ida: true,
    usa_volta: true,
    ponto_embarque_id: 1,
    ies_destino_id: 1,
    rota_complementar_ida_id: 1,
    ies_origem_id: 1,
    ponto_desembarque_id: 1,
    rota_complementar_volta_id: 1,
    status: 'ATIVO',
    ponto_embarque_nome: 'Bairro Novo',
    ies_destino_nome: 'UFC',
    rota_complementar_ida_nome: 'Van 2 - Bairro Novo',
    ies_origem_nome: 'UFC',
    ponto_desembarque_nome: 'Bairro Novo',
    rota_complementar_volta_nome: 'Van 2 - Bairro Novo',
    rota_complementar_ida: {
      id: 1,
      nome: 'Van 2 - Bairro Novo',
      horario_saida: '06:10',
      horario_retorno: '17:30',
      ponto_conexao: 'Trevo do Bairro Novo',
    },
    rota_complementar_volta: {
      id: 1,
      nome: 'Van 2 - Bairro Novo',
      horario_saida: '06:10',
      horario_retorno: '17:30',
      ponto_conexao: 'Trevo do Bairro Novo',
    },
    rota_principal_ida: {
      id: 1,
      nome: 'Linha 01 - Centro',
      horario_saida: '06:40',
      horario_retorno: '17:00',
      faculdades,
      onibus: { apelido_onibus: 'Ônibus 04', placa_onibus: 'OCR-1234' },
      motorista: { nome: 'Ana Souza' },
      status_alocacao: 'CONFIRMADA',
    },
    rota_principal_volta: {
      id: 1,
      nome: 'Linha 01 - Centro',
      horario_saida: '06:40',
      horario_retorno: '17:00',
      faculdades,
      onibus: { apelido_onibus: 'Ônibus 04', placa_onibus: 'OCR-1234' },
      motorista: { nome: 'Ana Souza' },
      status_alocacao: 'CONFIRMADA',
    },
    atualizado_em: '2026-08-31T06:00:00Z',
    pode_remover: true,
    pode_editar: true,
    ...override,
  };
}

function criarMinhaViagemFixture(
  override: Partial<MinhaViagemApiResponse> = {},
): MinhaViagemApiResponse {
  return {
    data: '2026-08-31',
    possui_agendamento: true,
    agendamento_id: 10,
    status_geral: 'ALOCADO',
    mensagem: null,
    foi_realocado: false,
    aviso_realocacao: null,
    ida: {
      turno: 'ida',
      status_alocacao: 'ALOCADO',
      mensagem_status: 'Alocado',
      rota_id: 1,
      nome_rota: 'Linha 01 - Centro',
      horario: '06:40',
      onibus_id: 'OCR-1234',
      placa: 'OCR-1234',
      apelido_onibus: 'Ônibus 04',
      motorista_id: 7,
      nome_motorista: 'Ana Souza',
      tipo_lugar: 'sentado',
      foi_realocado: false,
      aviso_realocacao: null,
    },
    volta: {
      turno: 'volta',
      status_alocacao: 'ALOCADO',
      mensagem_status: 'Alocado',
      rota_id: 1,
      nome_rota: 'Linha 01 - Centro',
      horario: '17:00',
      onibus_id: 'OCR-1234',
      placa: 'OCR-1234',
      apelido_onibus: 'Ônibus 04',
      motorista_id: 7,
      nome_motorista: 'Ana Souza',
      tipo_lugar: 'sentado',
      foi_realocado: false,
      aviso_realocacao: null,
    },
    consultado_em: '2026-08-31T06:00:00Z',
    ...override,
  };
}

describe('HU-019: Consulta de Alocação Diária (Rotas Principais e Complementares)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });
  it('Fluxo Principal: mapeia veículo, motorista, status confirmado e subtítulo com siglas das IES', () => {
    const detalhes = mapearDetalhe(criarDetalheBase());

    expect(detalhes.diaSemana).toBe('Segunda-feira');
    expect(detalhes.dataFormatada).toBe('31/08/2026');
    expect(detalhes.temRotaComplementar).toBe(true);

    const ida = detalhes.trechos.find((t) => t.sentido === 'ida');
    expect(ida?.rotaPrincipal.veiculo).toBe('Ônibus 04 - Placa OCR-1234');
    expect(ida?.rotaPrincipal.motorista).toBe('Ana Souza');
    expect(ida?.rotaPrincipal.subtituloRota).toBe('Linha 01 - Centro (UFC, Católica, UECE)');
    expect(ida?.rotaPrincipal.statusAlocacao).toBe('CONFIRMADA');
    expect(ida?.rotaPrincipal.statusAlocacaoLabel).toBe('Alocação confirmada');
    expect(ida?.rotaPrincipal.realocado).toBe(false);
    expect(ida?.rotaPrincipal.mensagemRealocacao).toBeNull();

    expect(ida?.rotaComplementar).toEqual({
      nomeLinha: 'Van 2 - Bairro Novo',
      pontoEmbarque: 'Bairro Novo',
      pontoConexao: 'Trevo do Bairro Novo',
      horarioSaida: '06:10',
    });

    const volta = detalhes.trechos.find((t) => t.sentido === 'volta');
    expect(volta?.rotaPrincipal.veiculo).toBe('Ônibus 04 - Placa OCR-1234');
    expect(volta?.rotaPrincipal.horarioSaida).toBe('17:00');
    expect(volta?.rotaPrincipal.pontoEmbarque).toBe('UFC');
    expect(volta?.rotaPrincipal.pontoDesembarque).toBe('Trevo do Bairro Novo');
    expect(volta?.rotaComplementar).toEqual({
      nomeLinha: 'Van 2 - Bairro Novo',
      pontoEmbarque: 'Bairro Novo',
      pontoConexao: 'Trevo do Bairro Novo',
      horarioSaida: '17:30',
    });
  });

  it('FA-001: oculta dados de frota e sinaliza "Aguardando alocação do veículo" mantendo a rota complementar para transferência', () => {
    const base = criarDetalheBase();
    const detalheAguardando = criarDetalheBase({
      rota_principal_ida: {
        ...base.rota_principal_ida!,
        onibus: null,
        motorista: null,
        status_alocacao: null,
      },
      rota_principal_volta: {
        ...base.rota_principal_volta!,
        onibus: { apelido_onibus: 'Ônibus 04', placa_onibus: 'OCR-1234' },
        motorista: { nome: 'Ana Souza' },
        status_alocacao: 'AGUARDANDO_ALOCACAO',
      },
    });

    const detalhes = mapearDetalhe(detalheAguardando);
    const ida = detalhes.trechos.find((t) => t.sentido === 'ida');
    const volta = detalhes.trechos.find((t) => t.sentido === 'volta');

    expect(ida?.rotaPrincipal.statusAlocacao).toBe('AGUARDANDO_ALOCACAO');
    expect(ida?.rotaPrincipal.statusAlocacaoLabel).toBe('Aguardando alocação do veículo');
    expect(ida?.rotaPrincipal.veiculo).toBeNull();
    expect(ida?.rotaPrincipal.motorista).toBeNull();

    expect(volta?.rotaPrincipal.statusAlocacao).toBe('AGUARDANDO_ALOCACAO');
    expect(volta?.rotaPrincipal.veiculo).toBeNull();
    expect(volta?.rotaPrincipal.motorista).toBeNull();

    expect(ida?.rotaComplementar).toEqual({
      nomeLinha: 'Van 2 - Bairro Novo',
      pontoEmbarque: 'Bairro Novo',
      pontoConexao: 'Trevo do Bairro Novo',
      horarioSaida: '06:10',
    });
  });

  it('FA-002: sinaliza realocação com aviso destacado na rota principal preservando a transferência', () => {
    const base = criarDetalheBase();
    const detalheRealocado = criarDetalheBase({
      rota_principal_ida: {
        ...base.rota_principal_ida!,
        realocado: true,
        status_alocacao: 'REALOCADO',
        rota_original_nome: 'Linha 02 - Bairro Novo',
      },
    });

    const detalhes = mapearDetalhe(detalheRealocado);
    const ida = detalhes.trechos.find((t) => t.sentido === 'ida');
    const volta = detalhes.trechos.find((t) => t.sentido === 'volta');

    expect(ida?.rotaPrincipal.statusAlocacao).toBe('REALOCADO');
    expect(ida?.rotaPrincipal.realocado).toBe(true);
    expect(ida?.rotaPrincipal.mensagemRealocacao).toBe(
      'Atenção: Você foi realocado. Seu ônibus para hoje é o veículo Ônibus 04 - Placa OCR-1234'
    );
    expect(ida?.rotaPrincipal.rotaOriginalNome).toBe('Linha 02 - Bairro Novo');
    expect(ida?.rotaComplementar?.nomeLinha).toBe('Van 2 - Bairro Novo');

    expect(volta?.rotaPrincipal.realocado).toBe(false);
    expect(volta?.rotaComplementar?.horarioSaida).toBe('17:30');
  });

  it('enriquecerDetalheComMinhaViagem preserva o detalhe original quando não há alocação ou possui_agendamento é false', () => {
    const detalheSemFrota = criarDetalheBase({
      rota_principal_ida: {
        ...criarDetalheBase().rota_principal_ida!,
        onibus: null,
        motorista: null,
        status_alocacao: null,
      },
    });

    expect(enriquecerDetalheComMinhaViagem(detalheSemFrota, null)).toBe(detalheSemFrota);
    expect(
      enriquecerDetalheComMinhaViagem(
        detalheSemFrota,
        criarMinhaViagemFixture({ possui_agendamento: false, ida: null, volta: null }),
      ),
    ).toBe(detalheSemFrota);
  });

  it('obterDetalhesViagem integra /transporte/agendamentos/detalhes com GET /alocacao-diaria/minha-viagem (Fluxo Principal)', async () => {
    const base = criarDetalheBase();
    const detalheBackendSemFrota = criarDetalheBase({
      rota_principal_ida: { ...base.rota_principal_ida!, onibus: null, motorista: null, status_alocacao: null },
      rota_principal_volta: { ...base.rota_principal_volta!, onibus: null, motorista: null, status_alocacao: null },
    });

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/transporte/agendamentos/detalhes') {
        return Promise.resolve({ data: detalheBackendSemFrota });
      }
      if (url === '/alocacao-diaria/minha-viagem') {
        return Promise.resolve({ data: criarMinhaViagemFixture() });
      }
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    const detalhes = await agendamentoService.obterDetalhesViagem('2026-08-31');

    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/detalhes', {
      params: { data: '2026-08-31' },
    });
    expect(api.get).toHaveBeenCalledWith('/alocacao-diaria/minha-viagem', {
      params: { data: '2026-08-31' },
    });

    const ida = detalhes.trechos.find((t) => t.sentido === 'ida');
    expect(ida?.rotaPrincipal.veiculo).toBe('Ônibus 04 - Placa OCR-1234');
    expect(ida?.rotaPrincipal.motorista).toBe('Ana Souza');
    expect(ida?.rotaPrincipal.statusAlocacao).toBe('CONFIRMADA');
    expect(ida?.rotaComplementar?.nomeLinha).toBe('Van 2 - Bairro Novo');

    const volta = detalhes.trechos.find((t) => t.sentido === 'volta');
    expect(volta?.rotaPrincipal.veiculo).toBe('Ônibus 04 - Placa OCR-1234');
    expect(volta?.rotaPrincipal.horarioSaida).toBe('17:00');
  });

  it('obterDetalhesViagem integra cenários FA-001 (AGUARDANDO_ALOCACAO) e FA-002 (realocado) de /alocacao-diaria/minha-viagem', async () => {
    const base = criarDetalheBase();
    const detalheBackendSemFrota = criarDetalheBase({
      rota_principal_ida: { ...base.rota_principal_ida!, onibus: null, motorista: null, status_alocacao: null },
      rota_principal_volta: { ...base.rota_principal_volta!, onibus: null, motorista: null, status_alocacao: null },
    });

    const minhaViagemMista = criarMinhaViagemFixture({
      status_geral: 'PARCIALMENTE_ALOCADO',
      foi_realocado: true,
      ida: {
        ...criarMinhaViagemFixture().ida!,
        rota_id: 2,
        nome_rota: 'Linha 02 - Bairro Novo',
        horario: '06:30',
        foi_realocado: true,
        aviso_realocacao: 'Atenção: Você foi realocado. Seu ônibus para hoje é o veículo OCR-1234',
      },
      volta: {
        turno: 'volta',
        status_alocacao: 'AGUARDANDO_ALOCACAO',
        mensagem_status: 'Aguardando alocação do veículo',
        rota_id: null,
        nome_rota: null,
        horario: null,
        onibus_id: null,
        placa: null,
        apelido_onibus: null,
        motorista_id: null,
        nome_motorista: null,
        tipo_lugar: null,
        foi_realocado: false,
        aviso_realocacao: null,
      },
    });

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/transporte/agendamentos/detalhes') {
        return Promise.resolve({ data: detalheBackendSemFrota });
      }
      if (url === '/alocacao-diaria/minha-viagem') {
        return Promise.resolve({ data: minhaViagemMista });
      }
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    const detalhes = await agendamentoService.obterDetalhesViagem('2026-08-31');
    const ida = detalhes.trechos.find((t) => t.sentido === 'ida');
    const volta = detalhes.trechos.find((t) => t.sentido === 'volta');

    expect(ida?.rotaPrincipal.statusAlocacao).toBe('REALOCADO');
    expect(ida?.rotaPrincipal.realocado).toBe(true);
    expect(ida?.rotaPrincipal.nomeLinha).toBe('Linha 02 - Bairro Novo');
    expect(ida?.rotaPrincipal.horarioSaida).toBe('06:30');
    expect(ida?.rotaPrincipal.rotaOriginalNome).toBe('Linha 01 - Centro');
    expect(ida?.rotaPrincipal.mensagemRealocacao).toBe(
      'Atenção: Você foi realocado. Seu ônibus para hoje é o veículo Ônibus 04 - Placa OCR-1234',
    );
    expect(ida?.rotaComplementar?.nomeLinha).toBe('Van 2 - Bairro Novo');

    expect(volta?.rotaPrincipal.statusAlocacao).toBe('AGUARDANDO_ALOCACAO');
    expect(volta?.rotaPrincipal.statusAlocacaoLabel).toBe('Aguardando alocação do veículo');
    expect(volta?.rotaPrincipal.veiculo).toBeNull();
    expect(volta?.rotaPrincipal.motorista).toBeNull();
  });

  it('listarAgendamentosAtivos enriquece agendamentos retornados por /meus com GET /alocacao-diaria/minha-viagem', async () => {
    const base = criarDetalheBase();
    const itemSemFrota = criarDetalheBase({
      rota_principal_ida: { ...base.rota_principal_ida!, onibus: null, motorista: null, status_alocacao: null },
      rota_principal_volta: { ...base.rota_principal_volta!, onibus: null, motorista: null, status_alocacao: null },
    });

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/transporte/agendamentos/meus') {
        return Promise.resolve({
          data: {
            agendamentos: [itemSemFrota],
            ativos: 1,
            limite: 22,
          },
        });
      }
      if (url === '/alocacao-diaria/minha-viagem') {
        return Promise.resolve({ data: criarMinhaViagemFixture() });
      }
      return Promise.reject(new Error(`URL inesperada: ${url}`));
    });

    const resposta = await agendamentoService.listarAgendamentosAtivos();
    const mapeado = mapearDetalhe(resposta.agendamentos[0]);

    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/meus');
    expect(api.get).toHaveBeenCalledWith('/alocacao-diaria/minha-viagem', {
      params: { data: '2026-08-31' },
    });
    expect(mapeado.trechos[0].rotaPrincipal.veiculo).toBe('Ônibus 04 - Placa OCR-1234');
    expect(mapeado.trechos[0].rotaPrincipal.motorista).toBe('Ana Souza');
    expect(mapeado.trechos[0].rotaPrincipal.statusAlocacao).toBe('CONFIRMADA');
  });

  it('formata subtítulo da rota principal sem parênteses quando não há faculdades', () => {
    expect(formatarSubtituloRotaPrincipal('Linha 03 - Serrinha', [])).toBe('Linha 03 - Serrinha');
    expect(
      formatarSubtituloRotaPrincipal('Linha 01 - Centro', [
        { nome: 'Instituto Federal do Ceará - Campus Quixadá' },
      ])
    ).toBe('Linha 01 - Centro (IFCE)');
  });
});
