import {
  AgendamentoDetalhe,
  aplicarCenarioAlocacaoMock,
  criarDetalhesViagemMock,
  formatarSubtituloRotaPrincipal,
  mapearDetalhe,
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

describe('HU-019: Consulta de Alocação Diária (Rotas Principais e Complementares)', () => {
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

  it('alterna corretamente os cenários de simulação mock para trajeto direto e com rota complementar', () => {
    const diretoConfirmado = criarDetalhesViagemMock('2026-08-31', 'CONFIRMADA', {
      exibirRotaComplementar: false,
    });
    expect(diretoConfirmado.temRotaComplementar).toBe(false);
    expect(diretoConfirmado.trechos[0].rotaPrincipal.veiculo).toBe('Ônibus 04 - Placa OCR-1234');
    expect(diretoConfirmado.trechos[0].rotaPrincipal.pontoEmbarque).toBe('Pça. Matriz');
    expect(diretoConfirmado.trechos[0].rotaComplementar).toBeUndefined();

    const comTransferenciaAguardando = aplicarCenarioAlocacaoMock(
      diretoConfirmado,
      'AGUARDANDO_ALOCACAO',
      { exibirRotaComplementar: true }
    );
    expect(comTransferenciaAguardando.temRotaComplementar).toBe(true);
    expect(comTransferenciaAguardando.trechos[0].rotaPrincipal.veiculo).toBeNull();
    expect(comTransferenciaAguardando.trechos[0].rotaPrincipal.pontoEmbarque).toBe(
      'Trevo do Bairro Novo'
    );
    expect(comTransferenciaAguardando.trechos[1].rotaPrincipal.pontoDesembarque).toBe(
      'Trevo do Bairro Novo'
    );
    expect(comTransferenciaAguardando.trechos[0].rotaComplementar).toEqual({
      nomeLinha: 'Van 2 - Bairro Novo',
      pontoEmbarque: 'Bairro Novo',
      pontoConexao: 'Trevo do Bairro Novo',
      horarioSaida: '06:10',
    });

    const comTransferenciaRealocado = aplicarCenarioAlocacaoMock(
      comTransferenciaAguardando,
      'REALOCADO',
      { exibirRotaComplementar: true }
    );
    expect(comTransferenciaRealocado.trechos[0].rotaPrincipal.realocado).toBe(true);
    expect(comTransferenciaRealocado.trechos[0].rotaPrincipal.mensagemRealocacao).toContain(
      'Ônibus 04 - Placa OCR-1234'
    );
    expect(comTransferenciaRealocado.trechos[0].rotaComplementar?.nomeLinha).toBe(
      'Van 2 - Bairro Novo'
    );

    const voltouParaDireto = aplicarCenarioAlocacaoMock(comTransferenciaRealocado, 'CONFIRMADA', {
      exibirRotaComplementar: false,
    });
    expect(voltouParaDireto.temRotaComplementar).toBe(false);
    expect(voltouParaDireto.trechos[0].rotaComplementar).toBeUndefined();
    expect(voltouParaDireto.trechos[0].rotaPrincipal.pontoEmbarque).toBe('Pça. Matriz');
    expect(voltouParaDireto.trechos[1].rotaPrincipal.pontoDesembarque).toBe('Pça. Matriz');
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
