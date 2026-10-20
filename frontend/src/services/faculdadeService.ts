import { api } from '../api/api';

export interface FaculdadeItem {
  id: number;
  nome: string;
  sigla: string;
  campus: string;
  ativo: boolean;
  viagens_programadas_pendentes?: boolean;
}

// Mocks iniciais de faculdades do protótipo
let FACULDADES_MOCK: FaculdadeItem[] = [
  {
    id: 1,
    nome: 'Universidade Federal do Ceará',
    sigla: 'UFC',
    campus: 'Campus Quixadá',
    ativo: true,
    viagens_programadas_pendentes: true, // Para testar bloqueio de inativação
  },
  {
    id: 2,
    nome: 'Instituto Federal de Ciências e Tecnologia...',
    sigla: 'IFCE',
    campus: 'Campus Quixadá',
    ativo: true,
    viagens_programadas_pendentes: false,
  },
  {
    id: 3,
    nome: 'Uniateneu',
    sigla: 'Uniateneu',
    campus: 'Ocara',
    ativo: false,
    viagens_programadas_pendentes: false,
  },
];

export const faculdadeService = {
  async listarFaculdades(busca = ''): Promise<FaculdadeItem[]> {
    try {
      const response = await api.get<any[]>('/faculdades');
      const lista = response.data || [];
      const mapeados: FaculdadeItem[] = lista.map((f) => {
        const nomeCompleto = f.nome_faculdade || f.nome || '';
        const siglaExtraida = f.sigla || (nomeCompleto.length <= 10 ? nomeCompleto : nomeCompleto.split(' ')[0]);

        return {
          id: f.id_faculdade || f.id,
          nome: nomeCompleto,
          sigla: siglaExtraida,
          campus: f.campus_faculdade || f.campus,
          ativo: f.ativo ?? true,
          viagens_programadas_pendentes: Boolean(f.viagens_programadas_pendentes),
        };
      });

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (f) =>
          f.nome.toLowerCase().includes(q) ||
          f.sigla.toLowerCase().includes(q) ||
          f.campus.toLowerCase().includes(q)
      );
    } catch (error) {
      console.warn('Backend /faculdades indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      if (!q) return JSON.parse(JSON.stringify(FACULDADES_MOCK));

      return JSON.parse(JSON.stringify(FACULDADES_MOCK)).filter(
        (f: FaculdadeItem) =>
          f.nome.toLowerCase().includes(q) ||
          f.sigla.toLowerCase().includes(q) ||
          f.campus.toLowerCase().includes(q)
      );
    }
  },

  async obterFaculdadePorId(id: number): Promise<FaculdadeItem | undefined> {
    try {
      const response = await api.get<any>(`/faculdades/${id}`);
      const f = response.data;
      if (f) {
        const nomeCompleto = f.nome_faculdade || f.nome || '';
        const siglaExtraida = f.sigla || (nomeCompleto.length <= 10 ? nomeCompleto : nomeCompleto.split(' ')[0]);

        return {
          id: f.id_faculdade || f.id,
          nome: nomeCompleto,
          sigla: siglaExtraida,
          campus: f.campus_faculdade || f.campus,
          ativo: f.ativo ?? true,
          viagens_programadas_pendentes: Boolean(f.viagens_programadas_pendentes),
        };
      }
    } catch (err) {
      console.warn('Erro ao obter faculdade por ID no backend, usando mock:', err);
    }

    const fac = FACULDADES_MOCK.find((f) => f.id === id);
    return fac ? JSON.parse(JSON.stringify(fac)) : undefined;
  },

  async criarFaculdade(nome: string, sigla: string, campus: string): Promise<FaculdadeItem> {
    try {
      const response = await api.post<any>('/faculdades', {
        nome_faculdade: nome,
        campus_faculdade: campus,
      });
      const f = response.data?.data || response.data;
      return {
        id: f.id_faculdade || f.id || Date.now(),
        nome: f.nome_faculdade || nome,
        sigla: sigla || f.nome_faculdade || 'UNI',
        campus: f.campus_faculdade || campus,
        ativo: true,
      };
    } catch (error: any) {
      // Fallback local se backend não estiver respondendo
      if (!error.response) {
        const nomeLimpo = nome.trim();
        const siglaLimpa = sigla.trim();
        const campusLimpo = campus.trim();

        const jaExiste = FACULDADES_MOCK.some(
          (f) =>
            (f.nome.toLowerCase() === nomeLimpo.toLowerCase() &&
             f.campus.toLowerCase() === campusLimpo.toLowerCase()) ||
            (f.sigla.toLowerCase() === siglaLimpa.toLowerCase() &&
             f.campus.toLowerCase() === campusLimpo.toLowerCase())
        );

        if (jaExiste) {
          throw new Error('Esta faculdade já está cadastrada.');
        }

        const novaFaculdade: FaculdadeItem = {
          id: Date.now(),
          nome: nomeLimpo,
          sigla: siglaLimpa,
          campus: campusLimpo,
          ativo: true,
          viagens_programadas_pendentes: false,
        };

        FACULDADES_MOCK.unshift(novaFaculdade);
        return JSON.parse(JSON.stringify(novaFaculdade));
      }

      throw error;
    }
  },

  async atualizarFaculdade(id: number, nome: string, sigla: string, campus: string): Promise<FaculdadeItem> {
    try {
      const response = await api.patch<any>(`/faculdades/${id}`, {
        nome_faculdade: nome,
        campus_faculdade: campus,
      });
      const f = response.data?.data || response.data;
      return {
        id: f.id_faculdade || id,
        nome: f.nome_faculdade || nome,
        sigla: sigla || f.nome_faculdade || 'UNI',
        campus: f.campus_faculdade || campus,
        ativo: true,
      };
    } catch (error: any) {
      if (!error.response) {
        const index = FACULDADES_MOCK.findIndex((f) => f.id === id);
        if (index !== -1) {
          FACULDADES_MOCK[index].nome = nome.trim();
          FACULDADES_MOCK[index].sigla = sigla.trim();
          FACULDADES_MOCK[index].campus = campus.trim();
          return JSON.parse(JSON.stringify(FACULDADES_MOCK[index]));
        }
      }
      throw error;
    }
  },

  async inativarFaculdade(id: number): Promise<void> {
    try {
      await api.patch(`/faculdades/${id}/inativar`);
    } catch (error: any) {
      if (!error.response) {
        const faculdade = FACULDADES_MOCK.find((f) => f.id === id);
        if (faculdade) {
          if (faculdade.viagens_programadas_pendentes) {
            throw new Error('Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento.');
          }
          faculdade.ativo = false;
          return;
        }
      }
      throw error;
    }
  },

  async reativarFaculdade(id: number): Promise<void> {
    try {
      await api.patch(`/faculdades/${id}/ativar`);
    } catch (error: any) {
      if (!error.response) {
        const faculdade = FACULDADES_MOCK.find((f) => f.id === id);
        if (faculdade) {
          faculdade.ativo = true;
          return;
        }
      }
      throw error;
    }
  },
};
