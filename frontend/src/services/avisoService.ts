import { api } from '../api/api';

export interface AvisoItem {
  id: number;
  titulo: string;
  descricao: string;
  conteudo?: string;
  autor_id?: number;
  data_criacao: string;
}

export const avisoService = {
  async listarAvisos(busca = ''): Promise<AvisoItem[]> {
    const params: Record<string, string> = {};
    const termoLimpo = busca.trim();
    if (termoLimpo) {
      params.titulo = termoLimpo;
    }

    const response = await api.get<any[]>('/avisos', { params });
    const lista = Array.isArray(response.data) ? response.data : [];

    const mapeados: AvisoItem[] = lista.map((item) => {
      const textoDescricao = item.descricao ?? item.conteudo ?? '';
      return {
        id: Number(item.id),
        titulo: String(item.titulo ?? ''),
        descricao: String(textoDescricao),
        conteudo: String(textoDescricao),
        autor_id: item.autor_id !== undefined ? Number(item.autor_id) : undefined,
        data_criacao: String(item.data_criacao ?? new Date().toISOString()),
      };
    });

    const q = termoLimpo.toLowerCase();
    if (!q) return mapeados;

    return mapeados.filter((item) => item.titulo.toLowerCase().includes(q));
  },

  async criarAviso(titulo: string, descricao: string): Promise<AvisoItem> {
    const tituloLimpo = titulo.trim().replace(/\s+/g, ' ');
    const descricaoLimpa = descricao.trim();

    const response = await api.post<any>('/avisos', {
      titulo: tituloLimpo,
      descricao: descricaoLimpa,
    });

    const payload = response.data?.data || response.data || {};
    const textoDescricao = payload.descricao ?? payload.conteudo ?? descricaoLimpa;

    return {
      id: Number(payload.id || Date.now()),
      titulo: String(payload.titulo || tituloLimpo),
      descricao: String(textoDescricao),
      conteudo: String(textoDescricao),
      autor_id: payload.autor_id !== undefined ? Number(payload.autor_id) : undefined,
      data_criacao: String(payload.data_criacao || new Date().toISOString()),
    };
  },
};
