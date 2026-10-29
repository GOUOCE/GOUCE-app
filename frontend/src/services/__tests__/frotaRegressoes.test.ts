import { beforeEach, expect, it, jest } from '@jest/globals';
import { api } from '../../api/api';
import { frotaService } from '../frotaService';
jest.mock('../../api/api', () => ({ api: { get: jest.fn(), post: jest.fn(), patch: jest.fn() } }));
beforeEach(() => { jest.resetAllMocks(); });
it('mantém a lista vazia sem dados de exemplo', async () => {
  (api.get as jest.MockedFunction<typeof api.get>).mockResolvedValue({ data: [] });
  expect(await frotaService.listarOnibus()).toEqual([]);
});
it('encaminha a placa real ao inativar e reativar', async () => {
  (api.patch as jest.MockedFunction<typeof api.patch>).mockResolvedValue({ data: {} });
  await frotaService.inativarOnibus('QXD2E46');
  await frotaService.reativarOnibus('XYZ9K87');
  expect(api.patch).toHaveBeenNthCalledWith(1, '/onibus/QXD2E46/inativar');
  expect(api.patch).toHaveBeenNthCalledWith(2, '/onibus/XYZ9K87/ativar');
});
it('propaga a falha de conexão em leitura e em todas as escritas', async () => {
  const error = new Error('Network Error');
  (api.get as jest.MockedFunction<typeof api.get>).mockRejectedValue(error);
  (api.post as jest.MockedFunction<typeof api.post>).mockRejectedValue(error);
  (api.patch as jest.MockedFunction<typeof api.patch>).mockRejectedValue(error);
  await expect(frotaService.listarOnibus()).rejects.toBe(error);
  await expect(frotaService.criarOnibus('OCR1234', 40, 0)).rejects.toBe(error);
  await expect(frotaService.atualizarOnibus('OCR1234', 'OCR1234', 40, 0)).rejects.toBe(error);
  await expect(frotaService.inativarOnibus('OCR1234')).rejects.toBe(error);
  await expect(frotaService.reativarOnibus('OCR1234')).rejects.toBe(error);
});
