import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

import { api } from '../../api/api';
import { userService } from '../userService';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../api/api', () => ({
  api: { get: jest.fn(), put: jest.fn(), patch: jest.fn(), defaults: { baseURL: 'http://api.test' } },
}));

const mockPut = api.put as jest.MockedFunction<typeof api.put>;
const mockGet = api.get as jest.MockedFunction<typeof api.get>;

afterEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

describe('HU-031: consulta e reenvio de documentos reprovados', () => {
  it('lê os documentos reprovados em GET /usuarios/reenvio_documento', async () => {
    mockGet.mockResolvedValueOnce({
      data: { documentos: [{ tipo: 'comprovante_residencia', motivo: 'Documento ilegível' }] },
    } as any);

    const res = await userService.getReenvioDocumento();

    expect(mockGet).toHaveBeenCalledWith('/usuarios/reenvio_documento');
    expect(res.documentos[0]).toEqual({ tipo: 'comprovante_residencia', motivo: 'Documento ilegível' });
  });

  it('envia só o documento escolhido por PUT /usuarios/reenvio_documento (File na web)', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    mockPut.mockResolvedValueOnce({ data: { mensagem: 'ok' } } as any);
    const pdf = new Blob(['pdf'], { type: 'application/pdf' });
    const append = jest.spyOn(FormData.prototype, 'append');

    await userService.reenviarDocumentos({
      comprovante_residencia: { uri: 'blob:http://localhost/1', name: 'residencia.pdf', mimeType: 'application/pdf', file: pdf },
    });

    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith('comprovante_residencia', pdf, 'residencia.pdf');
    expect(mockPut).toHaveBeenCalledWith('/usuarios/reenvio_documento', expect.any(FormData), expect.anything());
  });

  it('propaga a falha do servidor em vez de simular sucesso', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    mockPut.mockRejectedValueOnce(Object.assign(new Error('x'), { response: { status: 400 } }));
    const pdf = new Blob(['pdf'], { type: 'application/pdf' });

    await expect(
      userService.reenviarDocumentos({
        comprovante_matricula: { uri: 'blob:http://localhost/2', name: 'matricula.pdf', mimeType: 'application/pdf', file: pdf },
      }),
    ).rejects.toThrow('x');
  });
});
