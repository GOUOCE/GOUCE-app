import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Platform } from 'react-native';

import { api } from '../../api/api';
import { userService } from '../userService';
import type { AlunoFormData } from '../../schemas/alunoSchema';

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('../../api/api', () => ({
  api: { get: jest.fn(), defaults: { baseURL: 'http://api.test' } },
}));

const mockGet = api.get as jest.MockedFunction<typeof api.get>;
const originalXHR = globalThis.XMLHttpRequest;
const originalFetch = globalThis.fetch;

const pdfWeb = new Blob(['pdf'], { type: 'application/pdf' });
const base = { bairro: '7', instituicao: '9' } as AlunoFormData;

beforeEach(() => {
  mockGet.mockImplementation(async (url) => ({ data: url === '/bairros'
    ? [{ bairro_id: 7, nome: 'Serra do Estêvão', ativo: true }]
    : [{ id_faculdade: 9, nome_faculdade: 'Universidade', sigla: 'UNI', campus_faculdade: 'Quixadá', ativo: true }],
  }) as any);
  class FakeXHR {
    status = 201;
    responseText = '{"success":true}';
    onload?: () => void;
    open() {}
    setRequestHeader() {}
    send() { this.onload?.(); }
  }
  globalThis.XMLHttpRequest = FakeXHR as any;
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  globalThis.XMLHttpRequest = originalXHR;
  globalThis.fetch = originalFetch;
  jest.restoreAllMocks();
});

describe('Anexo de arquivos no cadastro e na renovação (#192)', () => {
  for (const metodo of ['register', 'renovarVinculo'] as const) {
    it(`${metodo} na web: envia o File escolhido no seletor (blob:), em vez de perder o campo`, async () => {
      jest.replaceProperty(Platform, 'OS', 'web');
      const append = jest.spyOn(FormData.prototype, 'append');

      await userService[metodo]({
        ...base,
        comprovanteMatricula: { uri: 'blob:http://localhost:3000/1', name: 'matricula.pdf', mimeType: 'application/pdf', file: pdfWeb },
      } as any);

      expect(append).toHaveBeenCalledWith('comprovante_matricula', pdfWeb, 'matricula.pdf');
    });

    it(`${metodo} na web: converte a imagem em data: URI para arquivo quando não há File`, async () => {
      jest.replaceProperty(Platform, 'OS', 'web');
      globalThis.fetch = jest.fn(async () => ({ blob: async () => pdfWeb })) as any;
      const append = jest.spyOn(FormData.prototype, 'append');

      await userService[metodo]({
        ...base,
        comprovanteMatricula: { uri: 'data:application/pdf;base64,AAAA', name: 'matricula.pdf' },
      } as any);

      expect(append).toHaveBeenCalledWith('comprovante_matricula', pdfWeb, 'matricula.pdf');
    });

    it(`${metodo} no celular: continua enviando { uri, name, type }`, async () => {
      jest.replaceProperty(Platform, 'OS', 'android');
      const append = jest.spyOn(FormData.prototype, 'append');

      await userService[metodo]({
        ...base,
        comprovanteMatricula: { uri: 'file:///data/matricula.pdf', name: 'matricula.pdf', mimeType: 'application/pdf' },
      } as any);

      expect(append).toHaveBeenCalledWith('comprovante_matricula', {
        uri: 'file:///data/matricula.pdf',
        name: 'matricula.pdf',
        type: 'application/pdf',
      });
    });
  }
});
