import { api } from '../api/api';

export interface RotaPrincipalSimples {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface RotaComplementarItem {
  id: number;
  nome: string;
  rota_principal_id: number;
  rota_principal_nome: string;
  rota_principal_ativa: boolean;
  horario_saida: string;
  horario_retorno: string;
  ponto_conexao: string;
  ativo: boolean;
}

export interface DadosRotaComplementar {
  nome: string;
  rotaPrincipalId: number;
  horarioSaida: string;
  horarioRetorno: string;
  pontoConexao: string;
}

// Tudo vem da API: sem lista de exemplo, a tela mostra o que está no banco e
// qualquer falha chega à tela, que avisa o administrador (#351)
function mapearRotaComplementar(rc: any): RotaComplementarItem {
  return {
    id: rc.id,
    nome: rc.nome,
    rota_principal_id: rc.rota_principal?.id ?? rc.rota_principal_id,
    rota_principal_nome: rc.rota_principal?.nome ?? rc.rota_principal_nome ?? '',
    rota_principal_ativa: rc.rota_principal?.ativo ?? true,
    horario_saida: rc.horario_saida,
    horario_retorno: rc.horario_retorno,
    ponto_conexao: rc.ponto_conexao,
    ativo: rc.ativo ?? true,
  };
}

function corpoDaRotaComplementar(dados: DadosRotaComplementar) {
  return {
    nome: dados.nome.trim(),
    horario_saida: dados.horarioSaida.trim(),
    // A API exige o retorno desde a #310; sem ele, todo cadastro voltava 422 (#350)
    horario_retorno: dados.horarioRetorno.trim(),
    ponto_conexao: dados.pontoConexao.trim(),
    rota_principal_id: dados.rotaPrincipalId,
  };
}

export const rotaComplementarService = {
  // A tela busca por nome, rota principal e ponto; a API filtra só por nome, então a lista vem inteira
  // e o filtro é feito na tela, sem chamar a API a cada letra (#363)
  async listarRotasComplementares(incluirInativos = true): Promise<RotaComplementarItem[]> {
    const response = await api.get<any[]>('/rotas-complementares', { params: { incluir_inativos: incluirInativos } });
    return (response.data || []).map(mapearRotaComplementar);
  },

  // A API devolve só as rotas principais ativas (AC-03)
  async listarRotasPrincipaisAtivas(): Promise<RotaPrincipalSimples[]> {
    const response = await api.get<any>('/rotas-complementares/opcoes');
    const rotas = Array.isArray(response.data?.rotas_principais) ? response.data.rotas_principais : [];
    return rotas
      .filter((rp: any) => rp.ativo !== false)
      .map((rp: any) => ({ id: rp.id, nome: rp.nome, ativo: true }));
  },

  async obterRotaComplementarPorId(id: number): Promise<RotaComplementarItem> {
    const response = await api.get<any>(`/rotas-complementares/${id}`);
    return mapearRotaComplementar(response.data);
  },

  async criarRotaComplementar(dados: DadosRotaComplementar): Promise<RotaComplementarItem> {
    // Nome em uso (409) chega à tela com a mensagem da API: "Já existe uma rota com este nome." (#361)
    const response = await api.post<any>('/rotas-complementares', corpoDaRotaComplementar(dados));
    return mapearRotaComplementar(response.data?.data || response.data);
  },

  async atualizarRotaComplementar(id: number, dados: DadosRotaComplementar): Promise<RotaComplementarItem> {
    // Nome em uso (409) chega à tela com a mensagem da API: "Já existe uma rota com este nome." (#361)
    const response = await api.patch<any>(`/rotas-complementares/${id}`, corpoDaRotaComplementar(dados));
    return mapearRotaComplementar(response.data?.data || response.data);
  },

  // Os bloqueios (agendamentos pendentes, rota principal inativa) vêm só da API, em error.message,
  // e a tela lê com getErrorMessage (#352, #362)
  async inativarRotaComplementar(id: number): Promise<void> {
    await api.patch(`/rotas-complementares/${id}/inativar`);
  },

  async reativarRotaComplementar(id: number): Promise<void> {
    await api.patch(`/rotas-complementares/${id}/reativar`);
  },
};
