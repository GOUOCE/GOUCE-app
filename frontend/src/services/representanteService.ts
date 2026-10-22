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
    try {
      const response = await api.get<any[]>('/representantes');
      const lista = response.data || [];
      const mapeados: RepresentanteItem[] = lista.map((r) => ({
        id: r.id || r.representante_id || r.aluno_id,
        aluno_id: r.aluno_id || r.id,
        nome: r.nome || r.nome_completo,
        email: r.email,
        instituicao: r.instituicao || r.nome_faculdade || 'UFC',
        campus: r.campus || r.campus_faculdade || 'Campus Quixadá',
        curso: r.curso || 'Engenharia de Software',
        periodo_ingresso: r.periodo_ingresso || '2023.1',
        ativo: r.ativo ?? r.is_representante_ativo ?? true,
        id_foto_aluno: r.id_foto_aluno,
      }));

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (r) => r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    } catch (error) {
      console.warn('Backend /representantes indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      if (!q) return JSON.parse(JSON.stringify(REPRESENTANTES_MOCK));

      return JSON.parse(JSON.stringify(REPRESENTANTES_MOCK)).filter(
        (r: RepresentanteItem) => r.nome.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
      );
    }
  },

  async listarAlunosElegiveis(instituicao = '', busca = ''): Promise<AlunoElegivelItem[]> {
    try {
      const response = await api.get<any[]>('/usuarios/alunos', { params: { status: 'ativado' } });
      const lista = response.data || [];
      const mapeados: AlunoElegivelItem[] = lista.map((aluno) => ({
        id: aluno.id || aluno.aluno_id,
        aluno_id: aluno.aluno_id || aluno.id,
        nome: aluno.nome || aluno.nome_completo,
        email: aluno.email,
        instituicao: aluno.faculdade_id || 'UFC',
        campus: aluno.campus || 'Campus Quixadá',
        curso: aluno.curso || 'Engenharia de Software',
        periodo_ingresso: aluno.periodo_ingresso || '2024.1',
        status_cadastro: aluno.status_cadastro || aluno.status || 'ativado',
        id_foto_aluno: aluno.id_foto_aluno,
      }));

      const representantesAtivos = await this.listarRepresentantes();

      return mapeados.filter((aluno) => {
        if (aluno.status_cadastro !== 'ativado') return false;

        const jaEhRepresentante = representantesAtivos.some((r) => r.aluno_id === aluno.aluno_id && r.ativo);
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
    } catch (err) {
      console.warn('Backend indisponível para listar alunos elegíveis, utilizando MOCK:', err);
      return ALUNOS_ELEGIVEIS_MOCK.filter((aluno) => {
        if (aluno.status_cadastro !== 'ativado') return false;
        const jaEhRepresentante = REPRESENTANTES_MOCK.some((r) => r.aluno_id === aluno.aluno_id && r.ativo);
        if (jaEhRepresentante) return false;
        if (instituicao && !aluno.instituicao.toLowerCase().includes(instituicao.toLowerCase())) return false;
        if (busca) {
          const q = busca.toLowerCase().trim();
          return aluno.nome.toLowerCase().includes(q) || aluno.email.toLowerCase().includes(q);
        }
        return true;
      });
    }
  },

  async atribuirRepresentante(alunoId: number, faculdadeId = 1): Promise<RepresentanteItem> {
    const jaExiste = REPRESENTANTES_MOCK.find((r) => (r.aluno_id === alunoId || r.id === alunoId) && r.ativo);
    if (jaExiste) {
      throw new Error('Este aluno já possui a função de representante.');
    }

    try {
      const response = await api.post<any>('/representantes/promover', {
        aluno_id: alunoId,
        faculdade_id: faculdadeId,
      });
      const r = response.data?.data || response.data;
      return {
        id: r.id || Date.now(),
        aluno_id: alunoId,
        nome: r.nome || 'Representante',
        email: r.email || '',
        instituicao: r.instituicao || 'UFC',
        campus: r.campus || 'Campus Quixadá',
        curso: r.curso || 'Engenharia de Software',
        periodo_ingresso: r.periodo_ingresso || '2024.1',
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('já é um representante')) {
        throw new Error('Este aluno já possui a função de representante.');
      }

      if (!error.response) {
        const aluno = ALUNOS_ELEGIVEIS_MOCK.find((a) => a.aluno_id === alunoId || a.id === alunoId);
        if (!aluno) throw new Error('Aluno não encontrado ou inelegível.');
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
        };

        REPRESENTANTES_MOCK.unshift(novoRepresentante);
        return JSON.parse(JSON.stringify(novoRepresentante));
      }

      throw error;
    }
  },

  async revogarRepresentante(id: number): Promise<void> {
    try {
      await api.patch(`/representantes/${id}/revogar`);
      const repLocal = REPRESENTANTES_MOCK.find((r) => r.id === id || r.aluno_id === id);
      if (repLocal) repLocal.ativo = false;
    } catch (error: any) {
      if (!error.response) {
        const repLocal = REPRESENTANTES_MOCK.find((r) => r.id === id || r.aluno_id === id);
        if (repLocal) {
          repLocal.ativo = false;
          return;
        }
      }
      throw error;
    }
  },
};
