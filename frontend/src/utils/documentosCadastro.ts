export type TipoDocumentoCadastro = 'comprovante_matricula' | 'comprovante_residencia' | 'foto_perfil';

export const formatarNomeTipoDocumento = (tipo: string): string => {
  if (tipo === 'comprovante_matricula') return 'Comprovante de Matrícula';
  if (tipo === 'comprovante_residencia') return 'Comprovante de Residência';
  if (tipo === 'foto_perfil') return 'Foto de Perfil';
  return tipo;
};

// Mesmas regras do cadastro e da renovação (HU-028) e do backend: PDF, PNG, JPG ou WEBP de até 5 MB.
const MIMES_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const EXTENSOES_PERMITIDAS = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
export const LIMITE_DOCUMENTO_BYTES = 5 * 1024 * 1024;

export const DICA_ARQUIVO_DOCUMENTO = 'PDF, PNG, JPG ou WEBP de até 5 MB';

/** Devolve a mensagem de erro do arquivo escolhido, ou null quando ele pode ser enviado. */
export const validarArquivoDocumento = (arquivo: any): string | null => {
  if (!arquivo) return 'Selecione um arquivo.';
  const mime = String(arquivo.mimeType || arquivo.type || '').toLowerCase();
  const nome = String(arquivo.name || arquivo.fileName || '').toLowerCase();
  const tipoValido = MIMES_PERMITIDOS.includes(mime) || EXTENSOES_PERMITIDAS.some((ext) => nome.endsWith(ext));
  if (!tipoValido) {
    return 'Formato de arquivo inválido. Envie PDF ou imagem (PNG, JPG ou WEBP)';
  }
  // O seletor nem sempre informa o tamanho; nesse caso quem decide é o backend.
  const tamanho = arquivo.size ?? arquivo.fileSize;
  if (typeof tamanho === 'number' && tamanho > LIMITE_DOCUMENTO_BYTES) {
    return 'O arquivo excede o limite de tamanho de 5 MB';
  }
  return null;
};
