import { agendamentoService, DetalhesViagemResponse } from '../agendamentoService';
import { api } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

describe('HU-015: Consulta de Rota Complementar e Transferência (Critérios de Aceite)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar os dados destacados da rota complementar quando houver transferência (Critério 1 e 2)', async () => {
    const mockDetalhes: DetalhesViagemResponse = {
      dataIso: '2026-09-01',
      dataFormatada: 'Terça-feira 01/09/2026',
      tipoTrajeto: 'ida',
      temRotaComplementar: true,
      rotaComplementar: {
        nomeVeiculo: 'Van 2 - Bairro Novo',
        pontoEmbarque: 'Bairro Novo',
        pontoConexao: 'Trevo do Bairro Novo',
        horarioSaida: '06:10',
      },
      rotaPrincipal: {
        veiculo: 'Ônibus 07 - Placa OCR-5521',
        linha: 'Linha 01 - Centro (UFC, Católica, UECE)',
        pontoEmbarque: 'Trevo do Bairro Novo',
        desembarqueIes: 'UFC',
        motorista: 'Ana Souza',
        horarioSaida: '06:40',
        realocado: true,
      },
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockDetalhes });

    const resultado = await agendamentoService.obterDetalhesViagem('2026-09-01', true);
    expect(resultado.temRotaComplementar).toBe(true);
    expect(resultado.rotaComplementar).toBeDefined();
    expect(resultado.rotaComplementar?.nomeVeiculo).toBe('Van 2 - Bairro Novo');
    expect(resultado.rotaComplementar?.pontoConexao).toBe('Trevo do Bairro Novo');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@GOUOCE:detalhes_viagem_2026-09-01',
      JSON.stringify(mockDetalhes)
    );
  });

  it('deve ocultar a seção de rota complementar em trajetos diretos sem transferência (FA-001 / Critério 3)', async () => {
    const mockDireto: DetalhesViagemResponse = {
      dataIso: '2026-09-01',
      dataFormatada: 'Terça-feira 01/09/2026',
      tipoTrajeto: 'ida',
      temRotaComplementar: false,
      rotaPrincipal: {
        veiculo: 'Ônibus 01 - Placa QXD2E46',
        linha: 'Linha Centro',
        pontoEmbarque: 'Igreja Matriz',
        desembarqueIes: 'UFC',
        motorista: 'Carlos Silva',
        horarioSaida: '05:30',
      },
    };

    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockDireto });

    const resultado = await agendamentoService.obterDetalhesViagem('2026-09-01', false);
    expect(resultado.temRotaComplementar).toBe(false);
    expect(resultado.rotaComplementar).toBeUndefined();
  });

  it('deve permitir consulta offline dos dados sincronizados previamente via cache local (FA-002 / Critério 4)', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const mockCached = JSON.stringify({
      dataIso: '2026-09-01',
      dataFormatada: 'Terça-feira 01/09/2026',
      tipoTrajeto: 'ida',
      temRotaComplementar: true,
      rotaComplementar: {
        nomeVeiculo: 'Van 2 - Bairro Novo',
        pontoEmbarque: 'Bairro Novo',
        pontoConexao: 'Trevo do Bairro Novo',
        horarioSaida: '06:10',
      },
      rotaPrincipal: {
        veiculo: 'Ônibus 07 - Placa OCR-5521',
        linha: 'Linha 01 - Centro',
        pontoEmbarque: 'Trevo do Bairro Novo',
        desembarqueIes: 'UFC',
        motorista: 'Ana Souza',
        horarioSaida: '06:40',
      },
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(mockCached);

    const resultado = await agendamentoService.obterDetalhesViagem('2026-09-01', true);
    expect(resultado.isOffline).toBe(true);
    expect(resultado.rotaComplementar?.pontoConexao).toBe('Trevo do Bairro Novo');
  });
});
