import { rodizioService } from '../rodizioService';
import { api } from '@/api/api';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('ÉPICO EP-005 / HU-020 - BDD: Configuração e Alternância de Rodízio de Frota', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // AC-01: Visualizar padrão atual de rodízio aplicado na semana
  // =========================================================================

  it('deve listar o padrão de rodízio atual aplicado com as rotas e ônibus vinculados', async () => {
    const mockAtual = {
      dataInicioVigencia: '2026-09-01',
      totalVeiculos: 3,
      alertaTotal: 0,
      itens: [
        {
          onibusId: 204,
          onibusApelido: 'Ônibus 04',
          placa: 'QXD-1004',
          rotaAtualNome: 'Linha 01 - Centro',
          proximaRotaNome: 'Linha 02 - Bairro Novo',
          capacidadeSentados: 42,
          capacidadeEmPe: 8,
        },
      ],
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockAtual });

    const resultado = await rodizioService.obterPadraoAtual();
    expect(resultado.totalVeiculos).toBe(3);
    expect(resultado.itens[0].onibusApelido).toBe('Ônibus 04');
    expect(api.get).toHaveBeenCalledWith('/transporte/rodizio/atual');
  });

  // =========================================================================
  // AC-02 & AC-03 & AC-04: Prévia do novo ciclo e alerta de capacidade
  // =========================================================================

  it('deve gerar a prévia do novo ciclo e sinalizar alerta quando a capacidade não atender à demanda prevista (AC-03, AC-04)', async () => {
    const mockPrevia = {
      dataInicioVigencia: '2026-09-07',
      totalVeiculos: 3,
      alertaTotal: 1,
      itens: [
        {
          onibusId: 204,
          onibusApelido: 'Ônibus 04',
          placa: 'QXD-1004',
          rotaAtualNome: 'Linha 01 - Centro',
          proximaRotaNome: 'Linha 02 - Bairro Novo',
          capacidadeSentados: 28,
          capacidadeEmPe: 6,
          alertaCapacidade: 'Atenção: capacidade (sentado+em pé) pode não atender',
        },
      ],
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockPrevia });

    const resultado = await rodizioService.gerarPreviaRodizio('204', '2');
    expect(resultado.alertaTotal).toBe(1);
    expect(resultado.itens[0].alertaCapacidade).toBe('Atenção: capacidade (sentado+em pé) pode não atender');
    expect(api.get).toHaveBeenCalledWith('/transporte/rodizio/previa?onibus_id=204&proxima_rota_id=2');
  });

  // =========================================================================
  // AC-06 & AC-07: Confirmação e aplicação do novo padrão de rodízio
  // =========================================================================

  it('deve salvar o novo padrão de rodízio e retornar mensagem de sucesso "Rodízio de frota confirmado com sucesso"', async () => {
    const mockSucesso = { success: true, mensagem: 'Rodízio de frota confirmado com sucesso' };
    (api.post as jest.Mock).mockResolvedValueOnce({ data: mockSucesso });

    const payload = {
      onibusId: '204',
      proximaRotaId: '2',
      dataInicioIso: '2026-09-07',
    };

    const resultado = await rodizioService.salvarPadraoRodizio(payload);
    expect(resultado).toEqual(mockSucesso);
    expect(api.post).toHaveBeenCalledWith('/transporte/rodizio', payload);
  });
});
