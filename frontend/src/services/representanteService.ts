import { api } from '../api/api';

export interface RepresentanteItem {
  id: number;
  aluno_id: number;
  nome: string;
  email: string;
  instituicao: string;
  campus: string;
  curso: string;
  periodo_ingresso: string;
  ativo: boolean;
  id_foto_aluno?: string;
}

// Mensagem da regra FA-003; a API devolve o mesmo texto se a atribuição for tentada
export const MSG_JA_REPRESENTANTE = 'Este aluno já é um representante ativo.';

export type SituacaoRepresentacao = 'ativo' | 'revogado' | 'nenhuma';

export interface AlunoBuscaItem {
  id: number;
  aluno_id: number;
  nome: string;
  email: string;
  instituicao: string;
  campus: string;
  curso: string;
  periodo_ingresso: string;
  status_cadastro: string;
  // Se o aluno já é representante ativo, já teve a função revogada ou nunca foi representante
  situacao: SituacaoRepresentacao;
  id_foto_aluno?: string;
}

// Só repassa o que a API devolve: campo ausente fica vazio, sem valor de exemplo (#300)
const mapearRepresentante = (r: any): RepresentanteItem => ({
  id: r.id,
  aluno_id: r.aluno_id ?? r.id,
  nome: r.nome ?? '',
  email: r.email ?? '',
  instituicao: r.instituicao ?? '',
  campus: r.campus ?? '',
  curso: r.curso ?? '',
  periodo_ingresso: r.periodo_ingresso ?? '',
  ativo: Boolean(r.ativo),
  id_foto_aluno: r.id_foto_aluno,
});

export const representanteService = {
  // Traz os representantes ativos e os revogados; quem decide como exibir é a tela (AC-01)
  async listarRepresentantes(busca = ''): Promise<RepresentanteItem[]> {
    const response = await api.get<any[]>('/representantes');
    const mapeados = (response.data || []).map(mapearRepresentante);

    const q = busca.toLowerCase().trim();
    if (!q) return mapeados;

    return mapeados.filter(
      (r) => r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  },

  // Busca qualquer aluno cadastrado por nome ou e-mail (AC-02) e informa a situação dele como representante.
  // A regra de cadastro aprovado e ativo é validada pela API na atribuição (AC-03).
  // A instituição escolhida não filtra a busca: pode ser diferente da matrícula (#207, item 6b)
  async buscarAlunos(busca = ''): Promise<AlunoBuscaItem[]> {
    const response = await api.get<any[]>('/usuarios/alunos');
    const lista = response.data || [];
    const representantes = await this.listarRepresentantes();
    const q = busca.toLowerCase().trim();

    return lista
      .map((aluno): AlunoBuscaItem => {
        const alunoId = aluno.aluno_id ?? aluno.id;
        const representante = representantes.find((r) => r.aluno_id === alunoId);
        return {
          id: aluno.id,
          aluno_id: alunoId,
          nome: aluno.nome ?? '',
          email: aluno.email ?? '',
          instituicao: aluno.faculdade ?? '',
          campus: aluno.campus ?? '',
          curso: aluno.curso ?? '',
          periodo_ingresso: aluno.periodo_ingresso ?? '',
          status_cadastro: aluno.status_cadastro ?? '',
          situacao: !representante ? 'nenhuma' : representante.ativo ? 'ativo' : 'revogado',
          id_foto_aluno: aluno.id_foto_aluno,
        };
      })
      .filter((aluno) => !q || aluno.nome.toLowerCase().includes(q) || aluno.email.toLowerCase().includes(q));
  },

  // A mensagem de regra (aluno já é representante, não aprovado...) vem da API e segue até a tela (#300)
  async atribuirRepresentante(alunoId: number, faculdadeId: number): Promise<RepresentanteItem> {
    const response = await api.post<any>('/representantes/promover', {
      aluno_id: alunoId,
      faculdade_id: faculdadeId,
    });
    return mapearRepresentante(response.data?.data ?? response.data);
  },

  async revogarRepresentante(id: number): Promise<void> {
    await api.patch(`/representantes/${id}/revogar`);
  },
};
