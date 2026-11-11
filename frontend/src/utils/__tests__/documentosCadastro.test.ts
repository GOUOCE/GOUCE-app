import { describe, expect, it } from '@jest/globals';

import { LIMITE_DOCUMENTO_BYTES, validarArquivoDocumento } from '../documentosCadastro';

describe('HU-031: validação do arquivo escolhido no reenvio', () => {
  it('aceita PDF e imagens (PNG, JPG, WEBP) de até 5 MB', () => {
    expect(validarArquivoDocumento({ name: 'a.pdf', mimeType: 'application/pdf', size: 1000 })).toBeNull();
    expect(validarArquivoDocumento({ name: 'a.png', mimeType: 'image/png', size: LIMITE_DOCUMENTO_BYTES })).toBeNull();
    expect(validarArquivoDocumento({ name: 'foto.JPG', size: 10 })).toBeNull();
  });

  it('recusa formatos como .zip com a mesma mensagem do cadastro', () => {
    expect(validarArquivoDocumento({ name: 'x.zip', mimeType: 'application/zip', size: 10 })).toBe(
      'Formato de arquivo inválido. Envie PDF ou imagem (PNG, JPG ou WEBP)',
    );
  });

  it('recusa arquivo acima de 5 MB', () => {
    expect(
      validarArquivoDocumento({ name: 'g.pdf', mimeType: 'application/pdf', size: LIMITE_DOCUMENTO_BYTES + 1 }),
    ).toBe('O arquivo excede o limite de tamanho de 5 MB');
  });

  it('deixa o backend decidir quando o seletor não informa o tamanho', () => {
    expect(validarArquivoDocumento({ name: 'a.pdf', mimeType: 'application/pdf' })).toBeNull();
  });
});
