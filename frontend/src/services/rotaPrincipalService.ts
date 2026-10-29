import { api } from '../api/api';

export interface FaculdadeOpcao {
  id: number;
  nome: string;
  sigla: string;
  ativo: boolean;
}

export interface BairroOpcao {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface RotaPrincipalItem {
  id: number;
  nome: string;
  horario_saida: string;
  horario_retorno: string;
  faculdades_ida: FaculdadeOpcao[];
  faculdades_volta: FaculdadeOpcao[];
  bairros: BairroOpcao[];
  ativo: boolean;
}

export interface OpcoesRotaPrincipal {
  faculdades: FaculdadeOpcao[];
  bairros: BairroOpcao[];
}

export interface DadosRotaPrincipal {
  nome: string;
  horarioSaida: string;
  horarioRetorno: string;
  faculdadesIdaIds: number[];
  faculdadesVoltaIds: number[];
  bairrosIds: number[];
}

// Tudo vem da API: sem lista de exemplo, a tela mostra o que está no banco e
// qualquer falha chega à tela, que avisa o administrador (#333)
function mapearFaculdade(f: any): FaculdadeOpcao {
  return {
    id: f.id_faculdade || f.id,
    nome: f.nome_faculdade || f.nome || '',
    sigla: f.sigla || f.nome_faculdade || f.nome || '',
    ativo: f.ativo ?? true,
  };
}

function mapearBairro(b: any): BairroOpcao {
  return {
    id: b.bairro_id || b.id,
    nome: b.nome_bairro || b.nome || '',
    ativo: b.ativo ?? true,
  };
}

function mapearRota(r: any): RotaPrincipalItem {
  return {
    id: r.id,
    nome: r.nome,
    horario_saida: r.horario_saida,
    horario_retorno: r.horario_retorno,
    faculdades_ida: Array.isArray(r.faculdades_ida) ? r.faculdades_ida.map(mapearFaculdade) : [],
    faculdades_volta: Array.isArray(r.faculdades_volta) ? r.faculdades_volta.map(mapearFaculdade) : [],
    bairros: Array.isArray(r.bairros) ? r.bairros.map(mapearBairro) : [],
    ativo: r.ativo ?? true,
  };
}

function corpoDaRota(dados: DadosRotaPrincipal) {
  return {
    nome: dados.nome.trim(),
    horario_saida: dados.horarioSaida.trim(),
    horario_retorno: dados.horarioRetorno.trim(),
    bairros_ids: dados.bairrosIds,
    faculdades_ida_ids: dados.faculdadesIdaIds,
    faculdades_volta_ids: dados.faculdadesVoltaIds,
  };
}

export const rotaPrincipalService = {
  async listarRotasPrincipais(busca = '', incluirInativos = true): Promise<RotaPrincipalItem[]> {
    const params: any = { incluir_inativos: incluirInativos };
    if (busca && busca.trim()) params.nome = busca.trim();

    const response = await api.get<any[]>('/rotas-principais', { params });
    const mapeados = (response.data || []).map(mapearRota);

    const q = busca.toLowerCase().trim();
    if (!q) return mapeados;

    return mapeados.filter(
      (r) =>
        r.nome.toLowerCase().includes(q) ||
        r.horario_saida.includes(q) ||
        r.horario_retorno.includes(q)
    );
  },

  // Uma chamada só para as duas listas de seleção (só bairros e faculdades ativos)
  async listarOpcoes(): Promise<OpcoesRotaPrincipal> {
    const response = await api.get<any>('/rotas-principais/opcoes');
    const faculdades = Array.isArray(response.data?.faculdades) ? response.data.faculdades : [];
    const bairros = Array.isArray(response.data?.bairros) ? response.data.bairros : [];
    return {
      faculdades: faculdades.filter((f: any) => f.ativo !== false).map(mapearFaculdade),
      bairros: bairros.filter((b: any) => b.ativo !== false).map(mapearBairro),
    };
  },

  async obterRotaPrincipalPorId(id: number): Promise<RotaPrincipalItem> {
    const response = await api.get<any>(`/rotas-principais/${id}`);
    return mapearRota(response.data);
  },

  async criarRotaPrincipal(dados: DadosRotaPrincipal): Promise<RotaPrincipalItem> {
    // Nome em uso (409) chega à tela com a mensagem da API: "Já existe uma rota com este nome." (#347)
    const response = await api.post<any>('/rotas-principais', corpoDaRota(dados));
    return mapearRota(response.data?.data || response.data);
  },

  async atualizarRotaPrincipal(id: number, dados: DadosRotaPrincipal): Promise<RotaPrincipalItem> {
    // Nome em uso (409) chega à tela com a mensagem da API: "Já existe uma rota com este nome." (#347)
    const response = await api.patch<any>(`/rotas-principais/${id}`, corpoDaRota(dados));
    return mapearRota(response.data?.data || response.data);
  },

  // Os bloqueios (complementar ativa, base inativa, agendamentos) vêm só da API, em error.message,
  // e a tela lê com getErrorMessage (#334, #348)
  async inativarRotaPrincipal(id: number): Promise<void> {
    await api.patch(`/rotas-principais/${id}/inativar`);
  },

  async reativarRotaPrincipal(id: number): Promise<void> {
    await api.patch(`/rotas-principais/${id}/reativar`);
  },
};
