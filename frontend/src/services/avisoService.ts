import { api } from '../api/api';

export interface AvisoItem {
  id: number;
  titulo: string;
  descricao: string;
  conteudo?: string;
  autor_id?: number;
  data_criacao: string;
}

export interface NotificacaoAvisoItem {
  id: number;
  tipo: 'aviso' | 'realocacao' | string;
  app_nome: string;
  titulo: string;
  mensagem: string;
  aviso_id?: number | null;
  data_criacao: string;
}

const GOUOCE_ICON_PATHS: Array<[string, string]> = [
  [
    'M118.24 4H77.76C63.5331 4 52 15.4525 52 29.5799V69.777C52 83.9044 63.5331 95.3569 77.76 95.3569H118.24C132.467 95.3569 144 83.9044 144 69.777V29.5799C144 15.4525 132.467 4 118.24 4Z',
    '#1D4E89',
  ],
  [
    'M111.558 34.8164H84.4458C79.2631 34.8164 75.0618 38.9885 75.0618 44.1349V53.4532C75.0618 58.5997 79.2631 62.7716 84.4458 62.7716H111.558C116.741 62.7716 120.942 58.5997 120.942 53.4532V44.1349C120.942 38.9885 116.741 34.8164 111.558 34.8164Z',
    '#F3F5F7',
  ],
  [
    'M86.6299 39.9937H82.7751C81.3931 39.9937 80.2727 41.1062 80.2727 42.4785V46.8271C80.2727 48.1995 81.3931 49.312 82.7751 49.312H86.6299C88.0119 49.312 89.1323 48.1995 89.1323 46.8271V42.4785C89.1323 41.1062 88.0119 39.9937 86.6299 39.9937Z',
    '#1D4E89',
  ],
  [
    'M99.354 39.9937H95.4992C94.1172 39.9937 92.9968 41.1062 92.9968 42.4785V46.8271C92.9968 48.1995 94.1172 49.312 95.4992 49.312H99.354C100.736 49.312 101.856 48.1995 101.856 46.8271V42.4785C101.856 41.1062 100.736 39.9937 99.354 39.9937Z',
    '#1D4E89',
  ],
  [
    'M112.078 39.9937H108.223C106.841 39.9937 105.721 41.1062 105.721 42.4785V46.8271C105.721 48.1995 106.841 49.312 108.223 49.312H112.078C113.46 49.312 114.581 48.1995 114.581 46.8271V42.4785C114.581 41.1062 113.46 39.9937 112.078 39.9937Z',
    '#1D4E89',
  ],
  [
    'M85.4894 68.1515C88.4821 68.1515 90.9081 65.7424 90.9081 62.7706C90.9081 59.7988 88.4821 57.3896 85.4894 57.3896C82.4966 57.3896 80.0706 59.7988 80.0706 62.7706C80.0706 65.7424 82.4966 68.1515 85.4894 68.1515Z',
    '#1D4E89',
  ],
  [
    'M110.511 68.1515C113.504 68.1515 115.93 65.7424 115.93 62.7706C115.93 59.7988 113.504 57.3896 110.511 57.3896C107.518 57.3896 105.092 59.7988 105.092 62.7706C105.092 65.7424 107.518 68.1515 110.511 68.1515Z',
    '#1D4E89',
  ],
  [
    'M129.741 27.7514C134.06 27.7514 137.561 24.2747 137.561 19.986C137.561 15.6974 134.06 12.2207 129.741 12.2207C125.422 12.2207 121.921 15.6974 121.921 19.986C121.921 24.2747 125.422 27.7514 129.741 27.7514Z',
    '#E8912D',
  ],
];

const GOUOCE_ICON_SVG_DATA_URI =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="48 0 100 100">` +
      GOUOCE_ICON_PATHS.map(([d, fill]) => `<path d="${d}" fill="${fill}"/>`).join('') +
      `</svg>`
  );

let iconeNotificacaoCache: string | null = null;
type ListenerAtualizacaoMural = (novosAvisos?: AvisoItem[]) => void;
const ouvintesAtualizacaoMural = new Set<ListenerAtualizacaoMural>();

export function obterIconeNotificacaoGouoce(): string {
  if (iconeNotificacaoCache) {
    return iconeNotificacaoCache;
  }

  try {
    const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    const doc = globalObj?.document;
    const Path2DCtor = globalObj?.Path2D;
    if (doc?.createElement && typeof Path2DCtor === 'function') {
      const canvas = doc.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext?.('2d');
      if (ctx) {
        ctx.scale(1.28, 1.28);
        ctx.translate(-48, 0);
        for (const [d, fill] of GOUOCE_ICON_PATHS) {
          ctx.fillStyle = fill;
          ctx.fill(new Path2DCtor(d));
        }
        const dataUrl = canvas.toDataURL?.('image/png');
        if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/png')) {
          iconeNotificacaoCache = dataUrl;
          return dataUrl;
        }
      }
    }
  } catch {
    // Fallback para data URI SVG quando Canvas 2D não estiver disponível.
  }

  iconeNotificacaoCache = GOUOCE_ICON_SVG_DATA_URI;
  return GOUOCE_ICON_SVG_DATA_URI;
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

  async listarNotificacoes(
    aposId?: number,
    limite = 5
  ): Promise<NotificacaoAvisoItem[]> {
    const params: Record<string, string | number> = { limite };
    if (typeof aposId === 'number' && aposId >= 0) {
      params.apos_id = aposId;
    }

    const response = await api.get<any[]>('/avisos/notificacoes', { params });
    const lista = Array.isArray(response.data) ? response.data : [];

    return lista.map((item) => ({
      id: Number(item.id),
      tipo: String(item.tipo ?? 'aviso'),
      app_nome: 'GOUOCE',
      titulo: String(item.titulo ?? ''),
      mensagem: String(item.mensagem ?? item.descricao ?? ''),
      aviso_id:
        item.aviso_id !== undefined && item.aviso_id !== null
          ? Number(item.aviso_id)
          : null,
      data_criacao: String(item.data_criacao ?? new Date().toISOString()),
    }));
  },

  inscreverAtualizacaoMural(listener: ListenerAtualizacaoMural): () => void {
    ouvintesAtualizacaoMural.add(listener);
    return () => {
      ouvintesAtualizacaoMural.delete(listener);
    };
  },

  emitirAtualizacaoMural(novosAvisos?: AvisoItem[]): void {
    ouvintesAtualizacaoMural.forEach((listener) => {
      try {
        listener(novosAvisos);
      } catch {
        // Ignora erros isolados de listeners.
      }
    });
  },

  dispararNotificacaoSistema(
    notificacao: NotificacaoAvisoItem,
    aoClicar?: () => void
  ): boolean {
    try {
      const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
      const NotificationApi = globalObj?.Notification;
      if (!NotificationApi) {
        return false;
      }

      const iconeGouoce = obterIconeNotificacaoGouoce();
      const nomeApp = notificacao.app_nome?.trim() || 'GOUOCE';

      const criarNotificacao = () => {
        const instancia = new NotificationApi(
          `${nomeApp} • ${notificacao.titulo}`,
          {
            body: notificacao.mensagem,
            icon: iconeGouoce,
            badge: iconeGouoce,
            tag: `gouoce-notif-${notificacao.tipo}-${notificacao.id}`,
          }
        );
        if (aoClicar && instancia) {
          instancia.onclick = () => {
            try {
              globalObj?.window?.focus?.();
            } catch {}
            aoClicar();
          };
        }
      };

      if (NotificationApi.permission === 'granted') {
        criarNotificacao();
        return true;
      }

      if (
        NotificationApi.permission === 'default' &&
        typeof NotificationApi.requestPermission === 'function'
      ) {
        Promise.resolve(NotificationApi.requestPermission())
          .then((perm: string) => {
            if (perm === 'granted') {
              criarNotificacao();
            }
          })
          .catch(() => {});
        return true;
      }
    } catch {
      // Ambientes sem suporte à Web Notification API ignoram silenciosamente.
    }
    return false;
  },
};
