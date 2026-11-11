export type TipoDocumentoCadastro = 'comprovante_matricula' | 'comprovante_residencia' | 'foto_perfil';

export const formatarNomeTipoDocumento = (tipo: string): string => {
  if (tipo === 'comprovante_matricula') return 'Comprovante de Matrícula';
  if (tipo === 'comprovante_residencia') return 'Comprovante de Residência';
  if (tipo === 'foto_perfil') return 'Foto de Perfil';
  return tipo;
};
