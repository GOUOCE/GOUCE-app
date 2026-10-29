import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGet = jest.fn<(url: string) => Promise<any>>();
const mockPatch = jest.fn<(url: string, body?: any) => Promise<any>>();
jest.mock('../../api/api', () => ({
  api: {
    get: (url: string) => mockGet(url),
    patch: (url: string, body?: any) => mockPatch(url, body),
  },
}));

import { faculdadeService } from '../faculdadeService';
import { getErrorMessage } from '../../utils/errorUtils';

const legada = { id_faculdade: 7, nome_faculdade: 'Universidade Legada', sigla: null, campus_faculdade: 'Centro', ativo: true };

describe('faculdadeService - sigla vinda do banco (HU-008, #259)', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockPatch.mockReset();
  });

  it('lista com sigla vazia quando o banco não tem sigla', async () => {
    mockGet.mockResolvedValue({ data: [legada] });

    const [fac] = await faculdadeService.listarFaculdades();

    expect(fac.sigla).toBe('');
    expect(fac.nome).toBe('Universidade Legada');
  });

  it('abre a edição com sigla vazia, sem derivar do nome', async () => {
    mockGet.mockResolvedValue({ data: legada });

    const fac = await faculdadeService.obterFaculdadePorId(7);

    expect(fac?.sigla).toBe('');
  });

  it('devolve o que a API gravou na edição, sem sigla inventada', async () => {
    mockPatch.mockResolvedValue({ data: { success: true, data: { ...legada, campus_faculdade: 'Sede' } } });

    const fac = await faculdadeService.atualizarFaculdade(7, 'Universidade Legada', '', 'Sede');

    expect(fac.sigla).toBe('');
    expect(fac.campus).toBe('Sede');
  });
});

describe('faculdadeService.inativarFaculdade - erros (HU-008, #263)', () => {
  beforeEach(() => {
    mockPatch.mockReset();
  });

  it('falha de conexão vira mensagem em português na tela', async () => {
    mockPatch.mockRejectedValue(Object.assign(new Error('Network Error'), { response: undefined }));

    const erro = await faculdadeService.inativarFaculdade(1).catch((e) => e);

    expect(erro.response).toBeUndefined();
    expect(getErrorMessage(erro)).toBe(
      'Erro de conexão com o servidor. Verifique sua internet ou tente novamente em instantes.'
    );
  });

  it('bloqueio da API chega à tela com a mensagem do backend', async () => {
    const mensagem = 'Esta faculdade não pode ser inativada pois pertence a uma rota ativa. Remova-a da rota antes de continuar.';
    mockPatch.mockRejectedValue({
      response: { status: 409, data: { success: false, detail: mensagem, error: { code: 'CONFLICT', message: mensagem } } },
    });

    const erro = await faculdadeService.inativarFaculdade(1).catch((e) => e);

    expect(erro.response.status).toBe(409);
    expect(getErrorMessage(erro)).toBe(mensagem);
  });
});
