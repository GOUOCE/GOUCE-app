// O backend mantém status_cadastro "ativado" quando o vínculo vence e avisa por acesso_expirado.
// O app usa o status "expirado" para mostrar o aviso de renovação (HU-028).
export function calcularStatusAluno(statusCadastro?: string | null, acessoExpirado?: boolean | null): string {
  const status = String(statusCadastro || 'ativado').toLowerCase();
  return acessoExpirado && status === 'ativado' ? 'expirado' : status;
}
