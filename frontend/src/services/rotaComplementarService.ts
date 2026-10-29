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
  horario_saida: string;
  ponto_conexao: string;
  ativo: boolean;
}

export interface DadosRotaComplementar {
  nome: string;
  rotaPrincipalId: number;
  horarioSaida: string;
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
    horario_saida: rc.horario_saida,
    ponto_conexao: rc.ponto_conexao,
    ativo: rc.ativo ?? true,
  };
}

function corpoDaRotaComplementar(dados: DadosRotaComplementar) {
  return {
    nome: dados.nome.trim(),
    horario_saida: dados.horarioSaida.trim(),
    ponto_conexao: dados.pontoConexao.trim(),
    rota_principal_id: dados.rotaPrincipalId,
  };
}

export const rotaComplementarService = {
  async listarRotasComplementares(busca = '', incluirInativos = true): Promise<RotaComplementarItem[]> {
    const params: any = { incluir_inativos: incluirInativos };
    if (busca && busca.trim()) params.nome = busca.trim();

    const response = await api.get<any[]>('/rotas-complementares', { params });
    const mapeados = (response.data || []).map(mapearRotaComplementar);

    const q = busca.toLowerCase().trim();
    if (!q) return mapeados;

    return mapeados.filter(
      (rc) =>
        rc.nome.toLowerCase().includes(q) ||
        rc.rota_principal_nome.toLowerCase().includes(q) ||
        rc.ponto_conexao.toLowerCase().includes(q)
    );
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

  // O bloqueio (agendamentos pendentes) é decidido só pela API (#352)
  async inativarRotaComplementar(id: number): Promise<void> {
    try {
      await api.patch(`/rotas-complementares/${id}/inativar`);
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.detail) {
        const msg = error.response.data.detail || error.response.data.message;
        if (msg) throw new Error(msg);
      }
      throw error;
    }
  },

  async reativarRotaComplementar(id: number): Promise<void> {
    await api.patch(`/rotas-complementares/${id}/reativar`);
  },
};
