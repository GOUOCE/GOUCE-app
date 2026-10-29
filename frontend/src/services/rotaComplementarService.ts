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
  agendamentos_pendentes?: boolean;
}

// Rotas Principais no MOCK (com ativas e inativas para validação)
let ROTAS_PRINCIPAIS_MOCK: RotaPrincipalSimples[] = [
  { id: 1, nome: 'Linha 01 - Centro', ativo: true },
  { id: 2, nome: 'Linha 02 - Bairro Novo', ativo: true },
  { id: 3, nome: 'Linha 03 - Inativa', ativo: false },
];

// Mocks iniciais do protótipo
let ROTAS_COMPLEMENTARES_MOCK: RotaComplementarItem[] = [
  {
    id: 1,
    nome: 'Van 2 - Bairro Novo',
    rota_principal_id: 1,
    rota_principal_nome: 'Linha 01 - Centro',
    horario_saida: '06:10',
    ponto_conexao: 'Trevo do Bairro Novo',
    ativo: true,
    agendamentos_pendentes: true,
  },
  {
    id: 2,
    nome: 'Van 5 - Trevo da BR',
    rota_principal_id: 2,
    rota_principal_nome: 'Linha 02 - Bairro Novo',
    horario_saida: '06:20',
    ponto_conexao: 'Posto da BR',
    ativo: true,
    agendamentos_pendentes: false,
  },
  {
    id: 3,
    nome: 'Rota complementar inativa',
    rota_principal_id: 1,
    rota_principal_nome: 'Linha 01 - Centro',
    horario_saida: '07:00',
    ponto_conexao: 'Praça Central',
    ativo: false,
    agendamentos_pendentes: false,
  },
];

export const rotaComplementarService = {
  resetMocks() {
    ROTAS_COMPLEMENTARES_MOCK = [
      {
        id: 1,
        nome: 'Van 2 - Bairro Novo',
        rota_principal_id: 1,
        rota_principal_nome: 'Linha 01 - Centro',
        horario_saida: '06:10',
        ponto_conexao: 'Trevo do Bairro Novo',
        ativo: true,
        agendamentos_pendentes: true,
      },
      {
        id: 2,
        nome: 'Van 5 - Trevo da BR',
        rota_principal_id: 2,
        rota_principal_nome: 'Linha 02 - Bairro Novo',
        horario_saida: '06:20',
        ponto_conexao: 'Posto da BR',
        ativo: true,
        agendamentos_pendentes: false,
      },
      {
        id: 3,
        nome: 'Rota complementar inativa',
        rota_principal_id: 1,
        rota_principal_nome: 'Linha 01 - Centro',
        horario_saida: '07:00',
        ponto_conexao: 'Praça Central',
        ativo: false,
        agendamentos_pendentes: false,
      },
    ];
  },

  async listarRotasComplementares(busca = '', incluirInativos = true): Promise<RotaComplementarItem[]> {
    try {
      const params: any = { incluir_inativos: incluirInativos };
      if (busca && busca.trim()) params.nome = busca.trim();

      const response = await api.get<any[]>('/rotas-complementares', { params });
      const listaApi = response.data || [];
      const lista = listaApi.length > 0 ? listaApi : ROTAS_COMPLEMENTARES_MOCK;

      const mapeados: RotaComplementarItem[] = lista.map((rc) => ({
        id: rc.id,
        nome: rc.nome,
        rota_principal_id: rc.rota_principal_id || rc.rota_principal?.id || 1,
        rota_principal_nome: rc.rota_principal_nome || rc.rota_principal?.nome || '',
        horario_saida: rc.horario_saida,
        ponto_conexao: rc.ponto_conexao,
        ativo: rc.ativo ?? true,
        agendamentos_pendentes: Boolean(rc.agendamentos_pendentes),
      }));

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (rc) =>
          rc.nome.toLowerCase().includes(q) ||
          rc.rota_principal_nome.toLowerCase().includes(q) ||
          rc.ponto_conexao.toLowerCase().includes(q)
      );
    } catch (error) {
      console.warn('Backend /rotas-complementares indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      let resultado = JSON.parse(JSON.stringify(ROTAS_COMPLEMENTARES_MOCK));

      if (!incluirInativos) {
        resultado = resultado.filter((rc: RotaComplementarItem) => rc.ativo);
      }

      if (!q) return resultado;

      return resultado.filter(
        (rc: RotaComplementarItem) =>
          rc.nome.toLowerCase().includes(q) ||
          rc.rota_principal_nome.toLowerCase().includes(q) ||
          rc.ponto_conexao.toLowerCase().includes(q)
      );
    }
  },

  async listarRotasPrincipaisAtivas(): Promise<RotaPrincipalSimples[]> {
    try {
      const response = await api.get<any>('/rotas-complementares/opcoes');
      if (response.data && Array.isArray(response.data.rotas_principais)) {
        return response.data.rotas_principais
          .filter((rp: any) => rp.ativo !== false)
          .map((rp: any) => ({
            id: rp.id,
            nome: rp.nome,
            ativo: true,
          }));
      }
    } catch (err) {
      console.warn('Erro ao carregar opções de rotas principais do backend, usando mock:', err);
    }

    return ROTAS_PRINCIPAIS_MOCK.filter((rp) => rp.ativo);
  },

  async obterRotaComplementarPorId(id: number): Promise<RotaComplementarItem | undefined> {
    try {
      const response = await api.get<any>(`/rotas-complementares/${id}`);
      const rc = response.data;
      if (rc) {
        return {
          id: rc.id,
          nome: rc.nome,
          rota_principal_id: rc.rota_principal_id || rc.rota_principal?.id || 1,
          rota_principal_nome: rc.rota_principal_nome || rc.rota_principal?.nome || '',
          horario_saida: rc.horario_saida,
          ponto_conexao: rc.ponto_conexao,
          ativo: rc.ativo ?? true,
          agendamentos_pendentes: Boolean(rc.agendamentos_pendentes),
        };
      }
    } catch (err) {
      console.warn('Erro ao obter rota complementar por ID no backend, usando mock:', err);
    }

    const rc = ROTAS_COMPLEMENTARES_MOCK.find((item) => item.id === id);
    return rc ? JSON.parse(JSON.stringify(rc)) : undefined;
  },

  async criarRotaComplementar(dados: {
    nome: string;
    rotaPrincipalId: number;
    horarioSaida: string;
    pontoConexao: string;
  }): Promise<RotaComplementarItem> {
    const nomeLimpo = dados.nome.trim();
    const horarioLimpo = dados.horarioSaida.trim();
    const pontoLimpo = dados.pontoConexao.trim();

    try {
      const response = await api.post<any>('/rotas-complementares', {
        nome: nomeLimpo,
        horario_saida: horarioLimpo,
        ponto_conexao: pontoLimpo,
        rota_principal_id: dados.rotaPrincipalId,
      });
      const rc = response.data?.data || response.data;
      return {
        id: rc.id || Date.now(),
        nome: rc.nome || nomeLimpo,
        rota_principal_id: rc.rota_principal_id || dados.rotaPrincipalId,
        rota_principal_nome: rc.rota_principal_nome || 'Rota Principal',
        horario_saida: rc.horario_saida || horarioLimpo,
        ponto_conexao: rc.ponto_conexao || pontoLimpo,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('registrada')) {
        throw new Error('Esta rota complementar já está cadastrada.');
      }

      if (!error.response) {
        const rotaPrincipal = ROTAS_PRINCIPAIS_MOCK.find(
          (rp) => rp.id === dados.rotaPrincipalId && rp.ativo
        );
        if (!rotaPrincipal) {
          throw new Error('A rota principal selecionada é inválida ou está inativa.');
        }

        const novaRota: RotaComplementarItem = {
          id: Date.now(),
          nome: nomeLimpo,
          rota_principal_id: rotaPrincipal.id,
          rota_principal_nome: rotaPrincipal.nome,
          horario_saida: horarioLimpo,
          ponto_conexao: pontoLimpo,
          ativo: true,
          agendamentos_pendentes: false,
        };

        ROTAS_COMPLEMENTARES_MOCK.unshift(novaRota);
        return JSON.parse(JSON.stringify(novaRota));
      }

      throw error;
    }
  },

  async atualizarRotaComplementar(
    id: number,
    dados: {
      nome: string;
      rotaPrincipalId: number;
      horarioSaida: string;
      pontoConexao: string;
    }
  ): Promise<RotaComplementarItem> {
    const nomeLimpo = dados.nome.trim();

    try {
      const response = await api.patch<any>(`/rotas-complementares/${id}`, {
        nome: nomeLimpo,
        horario_saida: dados.horarioSaida.trim(),
        ponto_conexao: dados.pontoConexao.trim(),
        rota_principal_id: dados.rotaPrincipalId,
      });
      const rc = response.data?.data || response.data;
      return {
        id: rc.id || id,
        nome: rc.nome || nomeLimpo,
        rota_principal_id: rc.rota_principal_id || dados.rotaPrincipalId,
        rota_principal_nome: rc.rota_principal_nome || 'Rota Principal',
        horario_saida: rc.horario_saida || dados.horarioSaida,
        ponto_conexao: rc.ponto_conexao || dados.pontoConexao,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('registrada')) {
        throw new Error('Esta rota complementar já está cadastrada.');
      }

      if (!error.response) {
        const index = ROTAS_COMPLEMENTARES_MOCK.findIndex((rc) => rc.id === id);
        if (index !== -1) {
          const rotaPrincipal = ROTAS_PRINCIPAIS_MOCK.find(
            (rp) => rp.id === dados.rotaPrincipalId && rp.ativo
          );
          if (rotaPrincipal) {
            ROTAS_COMPLEMENTARES_MOCK[index].nome = nomeLimpo;
            ROTAS_COMPLEMENTARES_MOCK[index].rota_principal_id = rotaPrincipal.id;
            ROTAS_COMPLEMENTARES_MOCK[index].rota_principal_nome = rotaPrincipal.nome;
            ROTAS_COMPLEMENTARES_MOCK[index].horario_saida = dados.horarioSaida.trim();
            ROTAS_COMPLEMENTARES_MOCK[index].ponto_conexao = dados.pontoConexao.trim();
            return JSON.parse(JSON.stringify(ROTAS_COMPLEMENTARES_MOCK[index]));
          }
        }
      }

      throw error;
    }
  },

  // O bloqueio (agendamentos pendentes) é decidido só pela API (#352)
  async inativarRotaComplementar(id: number): Promise<void> {
    const rcLocal = ROTAS_COMPLEMENTARES_MOCK.find((item) => item.id === id);

    try {
      await api.patch(`/rotas-complementares/${id}/inativar`);
      if (rcLocal) rcLocal.ativo = false;
    } catch (error: any) {
      if (error.response?.status === 409 || error.response?.data?.detail) {
        const msg = error.response.data.detail || error.response.data.message;
        if (msg) throw new Error(msg);
      }

      if (!error.response) {
        if (rcLocal) {
          rcLocal.ativo = false;
          return;
        }
      }

      throw error;
    }
  },

  async reativarRotaComplementar(id: number): Promise<void> {
    const rcLocal = ROTAS_COMPLEMENTARES_MOCK.find((item) => item.id === id);
    try {
      await api.patch(`/rotas-complementares/${id}/reativar`);
      if (rcLocal) rcLocal.ativo = true;
    } catch (error: any) {
      if (!error.response) {
        if (rcLocal) {
          rcLocal.ativo = true;
          return;
        }
      }

      throw error;
    }
  },
};
