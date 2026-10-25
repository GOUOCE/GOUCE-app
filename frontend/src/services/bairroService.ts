import { api } from '../api/api';

export interface PontoParadaItem {
  id: number;
  nome: string;
  ativo: boolean;
}

export interface BairroItem {
  id: number;
  nome: string;
  ativo: boolean;
  vinculado_rota_ativa?: boolean;
  pontos: PontoParadaItem[];
}

// Mocks iniciais para funcionamento frontend standalone
let BAIRROS_MOCK: BairroItem[] = [
  {
    id: 1,
    nome: 'Centro',
    ativo: true,
    vinculado_rota_ativa: true,
    pontos: [
      { id: 101, nome: 'Praça da Matriz', ativo: true },
      { id: 102, nome: 'Rodoviária', ativo: true },
    ],
  },
  {
    id: 2,
    nome: 'Bairro Novo',
    ativo: true,
    vinculado_rota_ativa: false,
    pontos: [
      { id: 103, nome: 'Avenida Principal', ativo: true },
    ],
  },
  {
    id: 3,
    nome: 'Vila Antiga',
    ativo: false,
    vinculado_rota_ativa: false,
    pontos: [
      { id: 104, nome: 'Praça Velha', ativo: false },
    ],
  },
];

export const bairroService = {
  async listarBairros(busca = ''): Promise<BairroItem[]> {
    try {
      const response = await api.get<any[]>('/bairros');
      const listaApi = response.data || [];
      const lista = listaApi.length > 0 ? listaApi : BAIRROS_MOCK;

      const mapeados: BairroItem[] = lista.map((b) => {
        const pontosMapeados: PontoParadaItem[] = Array.isArray(b.pontos_de_parada)
          ? b.pontos_de_parada.map((p: any) => ({
              id: p.ponto_id || p.id,
              nome: p.nome_ponto || p.nome || '',
              ativo: p.ativo ?? true,
            }))
          : b.pontos || [];

        return {
          id: b.bairro_id || b.id,
          nome: b.nome_bairro || b.nome || '',
          ativo: b.ativo ?? true,
          vinculado_rota_ativa: Boolean(b.vinculado_rota_ativa),
          pontos: pontosMapeados,
        };
      });

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (b) =>
          b.nome.toLowerCase().includes(q) ||
          b.pontos.some((p) => p.nome.toLowerCase().includes(q))
      );
    } catch (error) {
      console.warn('Backend /bairros indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      if (!q) return JSON.parse(JSON.stringify(BAIRROS_MOCK));

      return JSON.parse(JSON.stringify(BAIRROS_MOCK)).filter(
        (b: BairroItem) =>
          b.nome.toLowerCase().includes(q) ||
          b.pontos.some((p) => p.nome.toLowerCase().includes(q))
      );
    }
  },

  async obterBairroPorId(id: number): Promise<BairroItem | undefined> {
    try {
      const response = await api.get<any>(`/bairros/${id}`);
      const b = response.data;
      if (b) {
        const pontosMapeados: PontoParadaItem[] = Array.isArray(b.pontos_de_parada)
          ? b.pontos_de_parada.map((p: any) => ({
              id: p.ponto_id || p.id,
              nome: p.nome_ponto || p.nome || '',
              ativo: p.ativo ?? true,
            }))
          : b.pontos || [];

        return {
          id: b.bairro_id || b.id,
          nome: b.nome_bairro || b.nome || '',
          ativo: b.ativo ?? true,
          vinculado_rota_ativa: Boolean(b.vinculado_rota_ativa),
          pontos: pontosMapeados,
        };
      }
    } catch (err) {
      console.warn('Erro ao obter bairro por ID, usando mock:', err);
    }

    const bairro = BAIRROS_MOCK.find((b) => b.id === id);
    return bairro ? JSON.parse(JSON.stringify(bairro)) : undefined;
  },

  async criarBairro(nome: string, pontosNomes: string[]): Promise<BairroItem> {
    const nomeLimpo = nome.trim();

    try {
      const response = await api.post<any>('/bairros', {
        nome_bairro: nomeLimpo,
        pontos_de_parada: pontosNomes.map((p) => p.trim()),
      });
      const b = response.data?.data || response.data;
      const pontosMapeados: PontoParadaItem[] = Array.isArray(b.pontos_de_parada)
        ? b.pontos_de_parada.map((p: any) => ({
            id: p.ponto_id || p.id,
            nome: p.nome_ponto || p.nome || '',
            ativo: p.ativo ?? true,
          }))
        : pontosNomes.map((pNome, idx) => ({ id: Date.now() + idx + 1, nome: pNome.trim(), ativo: true }));

      return {
        id: b.bairro_id || b.id || Date.now(),
        nome: b.nome_bairro || nomeLimpo,
        ativo: true,
        vinculado_rota_ativa: false,
        pontos: pontosMapeados,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta localidade já está cadastrada.');
      }

      if (!error.response) {
        const jaExiste = BAIRROS_MOCK.some(
          (b) => b.nome.toLowerCase() === nomeLimpo.toLowerCase()
        );
        if (jaExiste) {
          throw new Error('Esta localidade já está cadastrada.');
        }

        if (!pontosNomes || pontosNomes.length === 0) {
          throw new Error('Adicione ao menos um ponto de parada para o bairro.');
        }

        const novoBairro: BairroItem = {
          id: Date.now(),
          nome: nomeLimpo,
          ativo: true,
          vinculado_rota_ativa: false,
          pontos: pontosNomes.map((pNome, idx) => ({
            id: Date.now() + idx + 1,
            nome: pNome.trim(),
            ativo: true,
          })),
        };

        BAIRROS_MOCK.unshift(novoBairro);
        return JSON.parse(JSON.stringify(novoBairro));
      }

      throw error;
    }
  },

  async atualizarBairro(id: number, nome: string, pontosNomes: string[]): Promise<BairroItem> {
    const nomeLimpo = nome.trim();

    try {
      const response = await api.patch<any>(`/bairros/${id}`, {
        nome_bairro: nomeLimpo,
        pontos_de_parada: pontosNomes.map((p) => p.trim()),
      });
      const b = response.data?.data || response.data;
      const pontosMapeados: PontoParadaItem[] = Array.isArray(b.pontos_de_parada)
        ? b.pontos_de_parada.map((p: any) => ({
            id: p.ponto_id || p.id,
            nome: p.nome_ponto || p.nome || '',
            ativo: p.ativo ?? true,
          }))
        : pontosNomes.map((pNome, idx) => ({ id: Date.now() + idx + 1, nome: pNome.trim(), ativo: true }));

      return {
        id: b.bairro_id || id,
        nome: b.nome_bairro || nomeLimpo,
        ativo: true,
        vinculado_rota_ativa: false,
        pontos: pontosMapeados,
      };
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('cadastrada')) {
        throw new Error('Esta localidade já está cadastrada.');
      }

      if (!error.response) {
        const index = BAIRROS_MOCK.findIndex((b) => b.id === id);
        if (index !== -1) {
          BAIRROS_MOCK[index].nome = nomeLimpo;
          BAIRROS_MOCK[index].pontos = pontosNomes.map((pNome, idx) => ({
            id: Date.now() + idx + 1,
            nome: pNome.trim(),
            ativo: true,
          }));
          return JSON.parse(JSON.stringify(BAIRROS_MOCK[index]));
        }
      }

      throw error;
    }
  },

  async inativarBairro(id: number): Promise<void> {
    const bairroLocal = BAIRROS_MOCK.find((b) => b.id === id);
    if (bairroLocal && bairroLocal.vinculado_rota_ativa) {
      throw new Error('Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.');
    }

    try {
      await api.patch(`/bairros/${id}/inativar`);
      if (bairroLocal) bairroLocal.ativo = false;
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('rota ativa')) {
        throw new Error('Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.');
      }

      if (!error.response) {
        if (bairroLocal) {
          bairroLocal.ativo = false;
          bairroLocal.pontos.forEach((p) => { p.ativo = false; });
          return;
        }
      }

      throw error;
    }
  },

  async reativarBairro(id: number): Promise<void> {
    const bairroLocal = BAIRROS_MOCK.find((b) => b.id === id);
    try {
      await api.patch(`/bairros/${id}/ativar`);
      if (bairroLocal) bairroLocal.ativo = true;
    } catch (error: any) {
      if (!error.response) {
        if (bairroLocal) {
          bairroLocal.ativo = true;
          bairroLocal.pontos.forEach((p) => { p.ativo = true; });
          return;
        }
      }

      throw error;
    }
  },
};
