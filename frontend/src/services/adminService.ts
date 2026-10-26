import { api } from '../api/api';

export interface AdministradorItem {
  id: number;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em?: string;
}

export interface AlunoAprovadoItem {
  id: number;
  aluno_id?: number;
  nome: string;
  email: string;
  faculdade_id?: string;
  campus?: string;
  curso?: string;
  status_cadastro?: string;
}

export const adminService = {
  async listarAdministradores(ativo?: boolean): Promise<AdministradorItem[]> {
    const params = typeof ativo === 'boolean' ? { ativo } : {};
    const response = await api.get<AdministradorItem[]>('/administradores', { params });
    return response.data;
  },

  async criarAdministrador(nome: string, email: string): Promise<any> {
    const response = await api.post('/administradores', {
      nome,
      email,
    });
    return response.data;
  },

  async promoverAluno(aluno_id?: number, email?: string): Promise<any> {
    const body: any = {};
    if (aluno_id) body.aluno_id = aluno_id;
    if (email) body.email = email;

    const response = await api.post('/administradores/promover', body);
    return response.data;
  },

  async atualizarAdministrador(id: number, nome?: string, email?: string): Promise<any> {
    const body: any = {};
    if (nome) body.nome = nome;
    if (email) body.email = email;

    const response = await api.patch(`/administradores/${id}`, body);
    return response.data;
  },

  async inativarAdministrador(id: number): Promise<any> {
    const response = await api.patch(`/administradores/${id}/inativar`);
    return response.data;
  },

  async reativarAdministrador(id: number, nome: string, email: string): Promise<any> {
    // Reativa o administrador garantindo o flag ativo no backend
    const response = await api.patch(`/administradores/${id}`, {
      nome,
      email,
    });
    return response.data;
  },

  async listarAlunosAprovados(search?: string): Promise<AlunoAprovadoItem[]> {
    const [resAlunos, admins] = await Promise.all([
      api.get<any[]>('/usuarios/alunos', { params: { status: 'ativado' } }),
      this.listarAdministradores().catch(() => []),
    ]);

    const adminEmails = new Set(admins.map((adm) => (adm.email || '').toLowerCase().trim()));
    const adminIds = new Set(admins.map((adm) => adm.id));

    const lista = (resAlunos.data || [])
      .filter((item) => {
        const emailAluno = (item.email || '').toLowerCase().trim();
        const idAluno = item.id || item.aluno_id;
        // Exclui alunos que já possuem registro como administrador
        if (adminEmails.has(emailAluno) || adminIds.has(idAluno)) {
          return false;
        }
        return true;
      })
      .map((item) => ({
        id: item.id || item.aluno_id,
        aluno_id: item.aluno_id || item.id,
        nome: item.nome || item.nome_completo,
        email: item.email,
        faculdade_id: item.faculdade_id,
        campus: item.campus,
        curso: item.curso,
        status_cadastro: item.status_cadastro,
      }));

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      return lista.filter(
        (a) => a.nome?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
      );
    }

    return lista;
  },
};
