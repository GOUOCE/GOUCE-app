// Dados da faculdade do aluno como a API manda: /usuarios/me e /alunos/{id} usam sigla_faculdade e
// nome_faculdade; a listagem /usuarios/alunos usa sigla e faculdade
interface DadosInstituicao {
  sigla_faculdade?: string | null;
  sigla?: string | null;
  nome_faculdade?: string | null;
  faculdade?: string | null;
  campus?: string | null;
}

// Texto "SIGLA - Campus" das telas, igual ao de Faculdades; nunca o id numérico (#192)
export function formatarInstituicao(dados?: DadosInstituicao | null): string {
  if (!dados) return '';
  const instituicao = dados.sigla_faculdade || dados.sigla || dados.nome_faculdade || dados.faculdade || '';
  return [instituicao, dados.campus].filter(Boolean).join(' - ');
}
