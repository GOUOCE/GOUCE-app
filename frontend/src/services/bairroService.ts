import { api } from '../api/api';

export interface PontoParadaItem {
  id?: number;
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

export const bairroService = {
  async listarBairros(busca = ''): Promise<BairroItem[]> {
    const response = await api.get<any[]>('/bairros');
    const lista = response.data || [];

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
  },

  async obterBairroPorId(id: number): Promise<BairroItem | undefined> {
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
    return undefined;
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
      throw error;
    }
  },

  async atualizarBairro(
    id: number,
    nome: string,
    pontosObjetos: PontoParadaItem[]
  ): Promise<BairroItem> {
    const nomeLimpo = nome.trim();
    const pontosAtivosNomes = pontosObjetos.filter((p) => p.ativo).map((p) => p.nome.trim());

    try {
      const response = await api.patch<any>(`/bairros/${id}`, {
        nome_bairro: nomeLimpo,
        pontos_de_parada: pontosAtivosNomes,
      });
      const b = response.data?.data || response.data;
      const pontosMapeados: PontoParadaItem[] = Array.isArray(b.pontos_de_parada)
        ? b.pontos_de_parada.map((p: any) => ({
            id: p.ponto_id || p.id,
            nome: p.nome_ponto || p.nome || '',
            ativo: p.ativo ?? true,
          }))
        : pontosObjetos;

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
      throw error;
    }
  },

  async inativarBairro(id: number): Promise<void> {
    try {
      await api.patch(`/bairros/${id}/inativar`);
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('rota ativa')) {
        throw new Error('Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.');
      }
      throw error;
    }
  },

  async reativarBairro(id: number): Promise<void> {
    await api.patch(`/bairros/${id}/ativar`);
  },
};
