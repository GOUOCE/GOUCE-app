import {
  agendamentoService,
  AgendamentoDetalhe,
} from '../agendamentoService';
import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

const detalheComComplementar: AgendamentoDetalhe = {
  id: 1,
  aluno_id: 2,
  data: '2026-11-12',
  usa_ida: true,
  usa_volta: true,
  ponto_embarque_id: 5,
  ies_destino_id: 1,
  rota_complementar_ida_id: 1,
  ies_origem_id: 1,
  ponto_desembarque_id: 5,
  rota_complementar_volta_id: 1,
  status: 'ATIVO',
  ponto_embarque_nome: 'Posto de Saúde do Campo Novo',
  ies_destino_nome: 'Universidade Federal do Ceará',
  rota_complementar_ida_nome: 'Van 1 - Campo Novo',
  ies_origem_nome: 'Universidade Federal do Ceará',
  ponto_desembarque_nome: 'Posto de Saúde do Campo Novo',
  rota_complementar_volta_nome: 'Van 1 - Campo Novo',
  rota_complementar_ida: {
    id: 1,
    nome: 'Van 1 - Campo Novo',
    horario_saida: '05:10',
    horario_retorno: '17:30',
    ponto_conexao: 'Terminal Rodoviário de Quixadá',
  },
  rota_complementar_volta: {
    id: 1,
    nome: 'Van 1 - Campo Novo',
    horario_saida: '05:10',
    horario_retorno: '17:30',
    ponto_conexao: 'Terminal Rodoviário de Quixadá',
  },
  rota_principal_ida: {
    id: 1,
    nome: 'Quixadá ➔ Fortaleza (Manhã)',
    horario_saida: '05:30',
    horario_retorno: '17:00',
    faculdades: [
      { id: 1, nome: 'Universidade Federal do Ceará' },
      { id: 2, nome: 'Instituto Federal do Ceará' },
    ],
    onibus: null,
    motorista: null,
  },
  rota_principal_volta: {
    id: 1,
    nome: 'Quixadá ➔ Fortaleza (Manhã)',
    horario_saida: '05:30',
    horario_retorno: '17:00',
    faculdades: [
      { id: 1, nome: 'Universidade Federal do Ceará' },
      { id: 2, nome: 'Instituto Federal do Ceará' },
    ],
    onibus: null,
    motorista: null,
  },
  atualizado_em: '2026-11-10T01:36:12.536498Z',
  pode_remover: true,
  pode_editar: true,
};

const detalheDireto: AgendamentoDetalhe = {
  ...detalheComComplementar,
  id: 2,
  data: '2026-11-13',
  rota_complementar_ida_id: null,
  rota_complementar_volta_id: null,
  ponto_embarque_id: 1,
  ponto_desembarque_id: 1,
  ponto_embarque_nome: 'Igreja Matriz de Quixadá',
  ponto_desembarque_nome: 'Igreja Matriz de Quixadá',
  rota_complementar_ida_nome: null,
  rota_complementar_volta_nome: null,
  rota_complementar_ida: null,
  rota_complementar_volta: null,
};

describe('HU-015: Consulta de Rota Complementar e Transferência (Critérios de Aceite)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('deve retornar os dados destacados da rota complementar quando houver transferência (Critério 1 e 2)', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: detalheComComplementar });

    const resultado = await agendamentoService.obterDetalhesViagem('2026-11-12');

    expect(api.get).toHaveBeenCalledWith('/transporte/agendamentos/detalhes', {
      params: { data: '2026-11-12' },
    });
    expect(resultado.temRotaComplementar).toBe(true);
    const trechoIda = resultado.trechos.find((t) => t.sentido === 'ida');
    expect(trechoIda?.rotaComplementar).toBeDefined();
    expect(trechoIda?.rotaComplementar?.nomeLinha).toBe('Van 1 - Campo Novo');
    expect(trechoIda?.rotaComplementar?.horarioSaida).toBe('05:10');
    expect(trechoIda?.rotaComplementar?.pontoConexao).toBe('Terminal Rodoviário de Quixadá');
    // O embarque na rota principal ocorre no ponto de conexão (transferência)
    expect(trechoIda?.rotaPrincipal.pontoEmbarque).toBe('Terminal Rodoviário de Quixadá');
    // Na volta, a van parte do ponto de conexão no horário de retorno
    const trechoVolta = resultado.trechos.find((t) => t.sentido === 'volta');
    expect(trechoVolta?.rotaComplementar?.horarioSaida).toBe('17:30');
    // Alocação de ônibus/motorista só no EP-005: sem valor cadastrado
    expect(trechoIda?.rotaPrincipal.veiculo).toBeNull();
    expect(trechoIda?.rotaPrincipal.motorista).toBeNull();
    // Cache offline alimentado com o DTO real (FA-002)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@GOUOCE:detalhes_viagem_2026-11-12',
      JSON.stringify(detalheComComplementar)
    );
  });

  it('deve ocultar a seção de rota complementar em trajetos diretos sem transferência (FA-001 / Critério 3)', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce({ data: detalheDireto });

    const resultado = await agendamentoService.obterDetalhesViagem('2026-11-13');

    expect(resultado.temRotaComplementar).toBe(false);
    resultado.trechos.forEach((trecho) => {
      expect(trecho.rotaComplementar).toBeUndefined();
      expect(trecho.rotaPrincipal.nomeLinha).toBe('Quixadá ➔ Fortaleza (Manhã)');
    });
    // No trajeto direto o embarque é no próprio ponto de embarque, não na conexão
    const trechoIda = resultado.trechos.find((t) => t.sentido === 'ida');
    expect(trechoIda?.rotaPrincipal.pontoEmbarque).toBe('Igreja Matriz de Quixadá');
  });

  it('deve permitir consulta offline dos dados sincronizados previamente via cache local (FA-002 / Critério 4)', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(detalheComComplementar)
    );

    const resultado = await agendamentoService.obterDetalhesViagem('2026-11-12');

    expect(resultado.isOffline).toBe(true);
    expect(resultado.temRotaComplementar).toBe(true);
    expect(
      resultado.trechos.find((t) => t.sentido === 'ida')?.rotaComplementar?.pontoConexao
    ).toBe('Terminal Rodoviário de Quixadá');
    // Dados offline vêm apenas da sincronização anterior, sem fallback inventado
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it('deve propagar o erro quando não há conexão nem cache sincronizado, sem inventar dados', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(
      agendamentoService.obterDetalhesViagem('2026-11-12')
    ).rejects.toThrow('Network error');
  });

  it('deve usar a lista sincronizada por /meus quando o detalhe nunca foi aberto offline (#430)', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        agendamentos: [detalheComComplementar],
        ativos: 1,
        limite: 22,
      })
    );

    const resultado = await agendamentoService.obterDetalhesViagem('2026-11-12');

    expect(resultado.isOffline).toBe(true);
    expect(resultado.agendamentoId).toBe(1);
    expect(resultado.temRotaComplementar).toBe(true);
  });

  it('não deve tratar recusa 404/401/403 como consulta offline (#431)', async () => {
    const naoEncontrado = { response: { status: 404 } };
    (api.get as jest.Mock).mockRejectedValueOnce(naoEncontrado);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({
        agendamentos: [detalheComComplementar],
        ativos: 1,
        limite: 22,
      })
    );

    await expect(
      agendamentoService.obterDetalhesViagem('2026-11-12')
    ).rejects.toBe(naoEncontrado);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
      '@GOUOCE:detalhes_viagem_2026-11-12'
    );
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@GOUOCE:meus_agendamentos',
      JSON.stringify({ agendamentos: [], ativos: 0, limite: 22 })
    );

    jest.clearAllMocks();
    const semPermissao = { response: { status: 403 } };
    (api.get as jest.Mock).mockRejectedValueOnce(semPermissao);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify(detalheComComplementar)
    );

    await expect(
      agendamentoService.obterDetalhesViagem('2026-11-13')
    ).rejects.toBe(semPermissao);
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
  });
});
