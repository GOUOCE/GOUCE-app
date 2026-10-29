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
  agendamentos_pendentes?: boolean;
}

// Mocks de Faculdades e Bairros
let FACULDADES_MOCK: FaculdadeOpcao[] = [
  { id: 1, nome: 'Universidade Federal do Ceará', sigla: 'UFC', ativo: true },
  { id: 2, nome: 'Unicatólica', sigla: 'Unicatólica', ativo: true },
  { id: 3, nome: 'Universidade Estadual do Ceará', sigla: 'UECE', ativo: true },
  { id: 4, nome: 'Instituto Federal do Ceará', sigla: 'IFCE', ativo: true },
  { id: 5, nome: 'Uniateneu Inativa', sigla: 'Uniateneu', ativo: false },
];

let BAIRROS_MOCK: BairroOpcao[] = [
  { id: 1, nome: 'Centro', ativo: true },
  { id: 2, nome: 'Bairro Novo', ativo: true },
  { id: 3, nome: 'Vila Antiga Inativa', ativo: false },
];

// Mocks de Rotas Principais
let ROTAS_PRINCIPAIS_MOCK: RotaPrincipalItem[] = [
  {
    id: 1,
    nome: 'Linha 01 - Centro',
    horario_saida: '06:40',
    horario_retorno: '17:30',
    faculdades_ida: [FACULDADES_MOCK[0], FACULDADES_MOCK[1], FACULDADES_MOCK[2], FACULDADES_MOCK[3]],
    faculdades_volta: [FACULDADES_MOCK[0], FACULDADES_MOCK[1]],
    bairros: [BAIRROS_MOCK[0], BAIRROS_MOCK[1]],
    ativo: true,
    agendamentos_pendentes: true,
  },
  {
    id: 2,
    nome: 'Linha 02 - Bairro Novo',
    horario_saida: '06:30',
    horario_retorno: '17:30',
    faculdades_ida: [FACULDADES_MOCK[0], FACULDADES_MOCK[3]],
    faculdades_volta: [FACULDADES_MOCK[0], FACULDADES_MOCK[3]],
    bairros: [BAIRROS_MOCK[1]],
    ativo: true,
    agendamentos_pendentes: false,
  },
  {
    id: 3,
    nome: 'Linha 03 - Vila Antiga',
    horario_saida: '07:00',
    horario_retorno: '18:00',
    faculdades_ida: [FACULDADES_MOCK[0]],
    faculdades_volta: [FACULDADES_MOCK[0]],
    bairros: [BAIRROS_MOCK[0]],
    ativo: false,
    agendamentos_pendentes: false,
  },
];

export const rotaPrincipalService = {
  resetMocks() {
    ROTAS_PRINCIPAIS_MOCK = [
      {
        id: 1,
        nome: 'Linha 01 - Centro',
        horario_saida: '06:40',
        horario_retorno: '17:30',
        faculdades_ida: [FACULDADES_MOCK[0], FACULDADES_MOCK[1], FACULDADES_MOCK[2], FACULDADES_MOCK[3]],
        faculdades_volta: [FACULDADES_MOCK[0], FACULDADES_MOCK[1]],
        bairros: [BAIRROS_MOCK[0], BAIRROS_MOCK[1]],
        ativo: true,
        agendamentos_pendentes: true,
      },
      {
        id: 2,
        nome: 'Linha 02 - Bairro Novo',
        horario_saida: '06:30',
        horario_retorno: '17:30',
        faculdades_ida: [FACULDADES_MOCK[0], FACULDADES_MOCK[3]],
        faculdades_volta: [FACULDADES_MOCK[0], FACULDADES_MOCK[3]],
        bairros: [BAIRROS_MOCK[1]],
        ativo: true,
        agendamentos_pendentes: false,
      },
      {
        id: 3,
        nome: 'Linha 03 - Vila Antiga',
        horario_saida: '07:00',
        horario_retorno: '18:00',
        faculdades_ida: [FACULDADES_MOCK[0]],
        faculdades_volta: [FACULDADES_MOCK[0]],
        bairros: [BAIRROS_MOCK[0]],
        ativo: false,
        agendamentos_pendentes: false,
      },
    ];
  },

  async listarRotasPrincipais(busca = '', incluirInativos = true): Promise<RotaPrincipalItem[]> {
    try {
      const params: any = { incluir_inativos: incluirInativos };
      if (busca && busca.trim()) params.nome = busca.trim();

      const response = await api.get<any[]>('/rotas-principais', { params });
      const listaApi = response.data || [];
      const lista = listaApi.length > 0 ? listaApi : ROTAS_PRINCIPAIS_MOCK;

      const mapeados: RotaPrincipalItem[] = lista.map((r) => ({
        id: r.id,
        nome: r.nome,
        horario_saida: r.horario_saida,
        horario_retorno: r.horario_retorno,
        faculdades_ida: Array.isArray(r.faculdades_ida)
          ? r.faculdades_ida.map((f: any) => ({
              id: f.id_faculdade || f.id,
              nome: f.nome_faculdade || f.nome || '',
              sigla: f.sigla || f.nome_faculdade || f.nome || '',
              ativo: f.ativo ?? true,
            }))
          : [],
        faculdades_volta: Array.isArray(r.faculdades_volta)
          ? r.faculdades_volta.map((f: any) => ({
              id: f.id_faculdade || f.id,
              nome: f.nome_faculdade || f.nome || '',
              sigla: f.sigla || f.nome_faculdade || f.nome || '',
              ativo: f.ativo ?? true,
            }))
          : [],
        bairros: Array.isArray(r.bairros)
          ? r.bairros.map((b: any) => ({
              id: b.bairro_id || b.id,
              nome: b.nome_bairro || b.nome || '',
              ativo: b.ativo ?? true,
            }))
          : [],
        ativo: r.ativo ?? true,
        agendamentos_pendentes: Boolean(r.agendamentos_pendentes),
      }));

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (r) =>
          r.nome.toLowerCase().includes(q) ||
          r.horario_saida.includes(q) ||
          r.horario_retorno.includes(q)
      );
    } catch (error) {
      console.warn('Backend /rotas-principais indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      let resultado = JSON.parse(JSON.stringify(ROTAS_PRINCIPAIS_MOCK));

      if (!incluirInativos) {
        resultado = resultado.filter((r: RotaPrincipalItem) => r.ativo);
      }

      if (!q) return resultado;

      return resultado.filter(
        (r: RotaPrincipalItem) =>
          r.nome.toLowerCase().includes(q) ||
          r.horario_saida.includes(q) ||
          r.horario_retorno.includes(q)
      );
    }
  },

  async listarFaculdadesAtivas(): Promise<FaculdadeOpcao[]> {
    try {
      const response = await api.get<any>('/rotas-principais/opcoes');
      if (response.data && Array.isArray(response.data.faculdades)) {
        return response.data.faculdades
          .filter((f: any) => f.ativo !== false)
          .map((f: any) => ({
            id: f.id_faculdade || f.id,
            nome: f.nome_faculdade || f.nome || '',
            sigla: f.sigla || f.nome_faculdade || f.nome || '',
            ativo: true,
          }));
      }
    } catch (err) {
      console.warn('Erro ao carregar opções de faculdades do backend, usando mock:', err);
    }

    return FACULDADES_MOCK.filter((f) => f.ativo);
  },

  async listarBairrosAtivos(): Promise<BairroOpcao[]> {
    try {
      const response = await api.get<any>('/rotas-principais/opcoes');
      if (response.data && Array.isArray(response.data.bairros)) {
        return response.data.bairros
          .filter((b: any) => b.ativo !== false)
          .map((b: any) => ({
            id: b.bairro_id || b.id,
            nome: b.nome_bairro || b.nome || '',
            ativo: true,
          }));
      }
    } catch (err) {
      console.warn('Erro ao carregar opções de bairros do backend, usando mock:', err);
    }

    return BAIRROS_MOCK.filter((b) => b.ativo);
  },

  async obterRotaPrincipalPorId(id: number): Promise<RotaPrincipalItem | undefined> {
    try {
      const response = await api.get<any>(`/rotas-principais/${id}`);
      const r = response.data;
      if (r) {
        return {
          id: r.id,
          nome: r.nome,
          horario_saida: r.horario_saida,
          horario_retorno: r.horario_retorno,
          faculdades_ida: Array.isArray(r.faculdades_ida)
            ? r.faculdades_ida.map((f: any) => ({
                id: f.id_faculdade || f.id,
                nome: f.nome_faculdade || f.nome || '',
                sigla: f.sigla || f.nome_faculdade || f.nome || '',
                ativo: f.ativo ?? true,
              }))
            : [],
          faculdades_volta: Array.isArray(r.faculdades_volta)
            ? r.faculdades_volta.map((f: any) => ({
                id: f.id_faculdade || f.id,
                nome: f.nome_faculdade || f.nome || '',
                sigla: f.sigla || f.nome_faculdade || f.nome || '',
                ativo: f.ativo ?? true,
              }))
            : [],
          bairros: Array.isArray(r.bairros)
            ? r.bairros.map((b: any) => ({
                id: b.bairro_id || b.id,
                nome: b.nome_bairro || b.nome || '',
                ativo: b.ativo ?? true,
              }))
            : [],
          ativo: r.ativo ?? true,
          agendamentos_pendentes: Boolean(r.agendamentos_pendentes),
        };
      }
    } catch (err) {
      console.warn('Erro ao obter rota principal por ID no backend, usando mock:', err);
    }

    const itemLocal = ROTAS_PRINCIPAIS_MOCK.find((r) => r.id === id);
    return itemLocal ? JSON.parse(JSON.stringify(itemLocal)) : undefined;
  },

  async criarRotaPrincipal(dados: {
    nome: string;
    horarioSaida: string;
    horarioRetorno: string;
    faculdadesIdaIds: number[];
    faculdadesVoltaIds: number[];
    bairrosIds: number[];
  }): Promise<RotaPrincipalItem> {
    const nomeLimpo = dados.nome.trim();

    try {
      const response = await api.post<any>('/rotas-principais', {
        nome: nomeLimpo,
        horario_saida: dados.horarioSaida.trim(),
        horario_retorno: dados.horarioRetorno.trim(),
        bairros_ids: dados.bairrosIds,
        faculdades_ida_ids: dados.faculdadesIdaIds,
        faculdades_volta_ids: dados.faculdadesVoltaIds,
      });
      const r = response.data?.data || response.data;
      return {
        id: r.id || Date.now(),
        nome: r.nome || nomeLimpo,
        horario_saida: r.horario_saida || dados.horarioSaida,
        horario_retorno: r.horario_retorno || dados.horarioRetorno,
        faculdades_ida: r.faculdades_ida || [],
        faculdades_volta: r.faculdades_volta || [],
        bairros: r.bairros || [],
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta rota já está cadastrada.');
      }

      if (!error.response) {
        const jaExiste = ROTAS_PRINCIPAIS_MOCK.some(
          (r) => r.nome.toLowerCase() === nomeLimpo.toLowerCase()
        );
        if (jaExiste) {
          throw new Error('Esta rota já está cadastrada.');
        }

        const facsAtivas = await this.listarFaculdadesAtivas();
        const bairrosAtivos = await this.listarBairrosAtivos();

        const facsIda = facsAtivas.filter((f) => dados.faculdadesIdaIds.includes(f.id));
        const facsVolta = facsAtivas.filter((f) => dados.faculdadesVoltaIds.includes(f.id));
        const bairrosVinculados = bairrosAtivos.filter((b) => dados.bairrosIds.includes(b.id));

        if (facsIda.length === 0) throw new Error('Selecione ao menos uma faculdade de ida.');
        if (facsVolta.length === 0) throw new Error('Selecione ao menos uma faculdade de volta.');
        if (bairrosVinculados.length === 0) throw new Error('Vincule ao menos um bairro à rota.');

        const novaRota: RotaPrincipalItem = {
          id: Date.now(),
          nome: nomeLimpo,
          horario_saida: dados.horarioSaida.trim(),
          horario_retorno: dados.horarioRetorno.trim(),
          faculdades_ida: facsIda,
          faculdades_volta: facsVolta,
          bairros: bairrosVinculados,
          ativo: true,
          agendamentos_pendentes: false,
        };

        ROTAS_PRINCIPAIS_MOCK.unshift(novaRota);
        return JSON.parse(JSON.stringify(novaRota));
      }

      throw error;
    }
  },

  async atualizarRotaPrincipal(
    id: number,
    dados: {
      nome: string;
      horarioSaida: string;
      horarioRetorno: string;
      faculdadesIdaIds: number[];
      faculdadesVoltaIds: number[];
      bairrosIds: number[];
    }
  ): Promise<RotaPrincipalItem> {
    const nomeLimpo = dados.nome.trim();

    try {
      const response = await api.patch<any>(`/rotas-principais/${id}`, {
        nome: nomeLimpo,
        horario_saida: dados.horarioSaida.trim(),
        horario_retorno: dados.horarioRetorno.trim(),
        bairros_ids: dados.bairrosIds,
        faculdades_ida_ids: dados.faculdadesIdaIds,
        faculdades_volta_ids: dados.faculdadesVoltaIds,
      });
      const r = response.data?.data || response.data;
      return {
        id: r.id || id,
        nome: r.nome || nomeLimpo,
        horario_saida: r.horario_saida || dados.horarioSaida,
        horario_retorno: r.horario_retorno || dados.horarioRetorno,
        faculdades_ida: r.faculdades_ida || [],
        faculdades_volta: r.faculdades_volta || [],
        bairros: r.bairros || [],
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta rota já está cadastrada.');
      }

      if (!error.response) {
        const index = ROTAS_PRINCIPAIS_MOCK.findIndex((r) => r.id === id);
        if (index !== -1) {
          const facsAtivas = await this.listarFaculdadesAtivas();
          const bairrosAtivos = await this.listarBairrosAtivos();

          ROTAS_PRINCIPAIS_MOCK[index].nome = nomeLimpo;
          ROTAS_PRINCIPAIS_MOCK[index].horario_saida = dados.horarioSaida.trim();
          ROTAS_PRINCIPAIS_MOCK[index].horario_retorno = dados.horarioRetorno.trim();
          ROTAS_PRINCIPAIS_MOCK[index].faculdades_ida = facsAtivas.filter((f) => dados.faculdadesIdaIds.includes(f.id));
          ROTAS_PRINCIPAIS_MOCK[index].faculdades_volta = facsAtivas.filter((f) => dados.faculdadesVoltaIds.includes(f.id));
          ROTAS_PRINCIPAIS_MOCK[index].bairros = bairrosAtivos.filter((b) => dados.bairrosIds.includes(b.id));

          return JSON.parse(JSON.stringify(ROTAS_PRINCIPAIS_MOCK[index]));
        }
      }

      throw error;
    }
  },

  async inativarRotaPrincipal(id: number): Promise<void> {
    // O bloqueio por agendamentos vem só da API; a lista local não decide a inativação
    const rotaLocal = ROTAS_PRINCIPAIS_MOCK.find((r) => r.id === id);

    try {
      await api.patch(`/rotas-principais/${id}/inativar`);
      if (rotaLocal) rotaLocal.ativo = false;
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.detail) {
        const msg = error.response.data.detail || error.response.data.message;
        if (msg) throw new Error(msg);
      }

      if (!error.response) {
        if (rotaLocal) {
          rotaLocal.ativo = false;
          return;
        }
      }

      throw error;
    }
  },

  async reativarRotaPrincipal(id: number): Promise<void> {
    const rotaLocal = ROTAS_PRINCIPAIS_MOCK.find((r) => r.id === id);
    try {
      await api.patch(`/rotas-principais/${id}/reativar`);
      if (rotaLocal) rotaLocal.ativo = true;
    } catch (error: any) {
      if (!error.response) {
        if (rotaLocal) {
          rotaLocal.ativo = true;
          return;
        }
      }

      throw error;
    }
  },
};
