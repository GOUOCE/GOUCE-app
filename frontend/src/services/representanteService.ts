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

export const representanteService = {
  async listarRepresentantes(busca = ''): Promise<RepresentanteItem[]> {
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
  },

  async listarAlunosElegiveis(instituicao = '', busca = ''): Promise<AlunoElegivelItem[]> {
    const response = await api.get<any[]>('/usuarios/alunos', { params: { status: 'ativado' } });
    const lista = response.data || [];

    const mapeados: AlunoElegivelItem[] = lista.map((aluno) => {
      const nomeInst = aluno.faculdade || aluno.nome_faculdade || aluno.faculdade_id || 'UFC';
      const campusInst = aluno.campus || aluno.campus_faculdade || 'Campus Quixadá';

      return {
        id: aluno.id || aluno.aluno_id,
        aluno_id: aluno.aluno_id || aluno.id,
        nome: aluno.nome || aluno.nome_completo,
        email: aluno.email,
        instituicao: String(nomeInst),
        campus: String(campusInst),
        curso: aluno.curso || 'Engenharia de Software',
        periodo_ingresso: aluno.periodo_ingresso || '2024.1',
        status_cadastro: aluno.status_cadastro || aluno.status || 'ativado',
        id_foto_aluno: aluno.id_foto_aluno,
      };
    });

    const representantesAtivos = await this.listarRepresentantes().catch(() => []);

    return mapeados.filter((aluno) => {
      if (aluno.status_cadastro !== 'ativado') return false;

      const jaEhRepresentante = representantesAtivos.some((r) => r.aluno_id === aluno.aluno_id && r.ativo);
      if (jaEhRepresentante) return false;

      if (instituicao) {
        const instFiltro = instituicao.toLowerCase().trim();
        const textoCompletoAluno = `${aluno.instituicao} ${aluno.campus}`.toLowerCase().trim();

        const palavrasFiltro = instFiltro.replace(/[-–]/g, ' ').split(/\s+/).filter((p) => p.length > 1);
        const palavrasAluno = textoCompletoAluno.replace(/[-–]/g, ' ').split(/\s+/).filter((p) => p.length > 1);

        const temMatchInst = palavrasFiltro.some((pf) =>
          palavrasAluno.some((pa) => pa === pf || pa.includes(pf) || pf.includes(pa))
        );

        if (!temMatchInst) return false;
      }

      if (busca) {
        const q = busca.toLowerCase().trim();
        return aluno.nome.toLowerCase().includes(q) || aluno.email.toLowerCase().includes(q);
      }

      return true;
    });
  },

  async atribuirRepresentante(alunoId: number, faculdadeId = 1): Promise<RepresentanteItem> {
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
      throw error;
    }
  },

  async revogarRepresentante(id: number): Promise<void> {
    await api.patch(`/representantes/${id}/revogar`);
  },
};
