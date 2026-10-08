import { api } from '../api/api';

export interface SolicitacaoItem {
  id: number;
  aluno_id?: number;
  nome: string;
  email: string;
  status_cadastro: string;
  curso?: string;
  campus?: string;
  faculdade_id?: string;
  data_hora_envio_analise?: string;
}

export interface DetalhesSolicitacaoItem extends SolicitacaoItem {
  telefone?: string;
  data_nascimento?: string;
  bairro_id?: string;
  turno_curso?: string;
  periodo_ingresso?: string;
  id_comprovante_matricula?: string;
  id_comprovante_residencia?: string;
  id_foto_aluno?: string;
}

export const solicitacaoService = {
  async listarSolicitacoes(status = 'pendente'): Promise<SolicitacaoItem[]> {
    const response = await api.get<any[]>('/usuarios/alunos', {
      params: { status },
    });
    return response.data.map((item) => ({
      id: item.id || item.aluno_id,
      aluno_id: item.aluno_id || item.id,
      nome: item.nome || item.nome_completo,
      email: item.email,
      status_cadastro: item.status_cadastro || item.status,
      curso: item.curso,
      campus: item.campus,
      faculdade_id: item.faculdade_id,
      data_hora_envio_analise: item.data_hora_envio_analise,
    }));
  },

  async obterDetalhes(alunoId: number): Promise<DetalhesSolicitacaoItem> {
    const response = await api.get<any>(`/alunos/${alunoId}`);
    return {
      id: response.data.id || response.data.aluno_id,
      aluno_id: response.data.aluno_id || response.data.id,
      nome: response.data.nome || response.data.nome_completo,
      email: response.data.email,
      status_cadastro: response.data.status_cadastro || response.data.status,
      telefone: response.data.telefone,
      curso: response.data.curso,
      campus: response.data.campus,
      faculdade_id: response.data.faculdade_id,
      data_nascimento: response.data.data_nascimento,
      bairro_id: response.data.bairro_id,
      turno_curso: response.data.turno_curso,
      periodo_ingresso: response.data.periodo_ingresso,
      id_comprovante_matricula: response.data.id_comprovante_matricula,
      id_comprovante_residencia: response.data.id_comprovante_residencia,
      id_foto_aluno: response.data.id_foto_aluno || response.data.foto_perfil,
    };
  },

  async aprovarSolicitacao(alunoId: number): Promise<any> {
    const response = await api.patch(`/usuarios/alunos/${alunoId}/aprovar`);
    return response.data;
  },

  async reprovarSolicitacao(
    alunoId: number,
    motivo: string,
    documentos: { tipo: string; motivo: string }[]
  ): Promise<any> {
    const response = await api.patch(`/usuarios/alunos/${alunoId}/status`, {
      status_cadastro: 'rejeitado',
      motivo_reprovacao: motivo,
      documentos_reenvio: documentos,
    });
    return response.data;
  },
};
