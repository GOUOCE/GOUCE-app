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

export interface AlunoElegivelItem {
  id: number;
  aluno_id: number;
  nome: string;
  email: string;
  instituicao: string;
  campus: string;
  curso: string;
  periodo_ingresso: string;
  status_cadastro: string;
  id_foto_aluno?: string;
}

let REPRESENTANTES_MOCK: RepresentanteItem[] = [
  {
    id: 1,
    aluno_id: 101,
    nome: 'Ana Beatriz Costa',
    email: 'ana.costa@ufc.br',
    instituicao: 'UFC',
    campus: 'Campus Quixadá',
    curso: 'Engenharia de Software',
    periodo_ingresso: '2023.1',
    ativo: true,
  },
  {
    id: 2,
    aluno_id: 102,
    nome: 'Pedro Henrique Lima',
    email: 'pedro.lima@ifce.edu.br',
    instituicao: 'IFCE',
    campus: 'Campus Quixadá',
    curso: 'Sistemas de Informação',
    periodo_ingresso: '2022.2',
    ativo: true,
  },
];

let ALUNOS_ELEGIVEIS_MOCK: AlunoElegivelItem[] = [
  {
    id: 103,
    aluno_id: 103,
    nome: 'João Neves',
    email: 'joao@email.com',
    instituicao: 'UFC',
    campus: 'Campus Quixadá',
    curso: 'Engenharia de Software',
    periodo_ingresso: '2024.1',
    status_cadastro: 'ativado',
  },
  {
    id: 104,
    aluno_id: 104,
    nome: 'Clara Meireles',
    email: 'clara@email.com',
    instituicao: 'IFCE',
    campus: 'Campus Quixadá',
    curso: 'Engenharia de Computação',
    periodo_ingresso: '2023.2',
    status_cadastro: 'ativado',
  },
];

export const representanteService = {
  async listarRepresentantes(busca = ''): Promise<RepresentanteItem[]> {
    const q = busca.toLowerCase().trim();
    if (!q) return [...REPRESENTANTES_MOCK];

    return REPRESENTANTES_MOCK.filter(
      (r) => r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  },

  async listarAlunosElegiveis(instituicao = '', busca = ''): Promise<AlunoElegivelItem[]> {
    return ALUNOS_ELEGIVEIS_MOCK.filter((aluno) => {
      // Regra de Negócio: Somente alunos com cadastro Aprovado e Ativo
      if (aluno.status_cadastro !== 'ativado') return false;

      // Regra de Negócio: Aluno que já possui a função não pode ser selecionado novamente
      const jaEhRepresentante = REPRESENTANTES_MOCK.some((r) => r.aluno_id === aluno.aluno_id && r.ativo);
      if (jaEhRepresentante) return false;

      if (instituicao && !aluno.instituicao.toLowerCase().includes(instituicao.toLowerCase())) {
        return false;
      }

      if (busca) {
        const q = busca.toLowerCase().trim();
        return aluno.nome.toLowerCase().includes(q) || aluno.email.toLowerCase().includes(q);
      }

      return true;
    });
  },

  async atribuirRepresentante(alunoId: number): Promise<RepresentanteItem> {
    const jaExiste = REPRESENTANTES_MOCK.find((r) => (r.aluno_id === alunoId || r.id === alunoId) && r.ativo);
    if (jaExiste) {
      throw new Error('Este aluno já possui a função de representante.');
    }

    const aluno = ALUNOS_ELEGIVEIS_MOCK.find((a) => a.aluno_id === alunoId || a.id === alunoId);
    if (!aluno) {
      throw new Error('Aluno não encontrado ou inelegível.');
    }

    if (aluno.status_cadastro !== 'ativado') {
      throw new Error('Apenas alunos com cadastro aprovado e ativo podem se tornar representantes.');
    }

    const novoRepresentante: RepresentanteItem = {
      id: Date.now(),
      aluno_id: aluno.aluno_id,
      nome: aluno.nome,
      email: aluno.email,
      instituicao: aluno.instituicao,
      campus: aluno.campus,
      curso: aluno.curso,
      periodo_ingresso: aluno.periodo_ingresso,
      ativo: true,
      id_foto_aluno: aluno.id_foto_aluno,
    };

    REPRESENTANTES_MOCK.unshift(novoRepresentante);
    return novoRepresentante;
  },

  async revogarRepresentante(id: number): Promise<void> {
    const index = REPRESENTANTES_MOCK.findIndex((r) => r.id === id || r.aluno_id === id);
    if (index !== -1) {
      // Revoga a função mantendo o aluno ativo no sistema
      REPRESENTANTES_MOCK[index].ativo = false;
    }
  },
};
