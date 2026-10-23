import { api } from '../api/api';

export interface MotoristaItem {
  id: number;
  nome: string;
  telefone: string;
  ativo: boolean;
  alocacoes_pendentes?: boolean;
}

// Mocks iniciais de motoristas do protótipo
let MOTORISTAS_MOCK: MotoristaItem[] = [
  {
    id: 1,
    nome: 'José Almeida',
    telefone: '(88) 9 9999-9999',
    ativo: true,
    alocacoes_pendentes: true, // Para testar bloqueio de inativação
  },
  {
    id: 2,
    nome: 'Ana Souza',
    telefone: '(88) 9 9999-9999',
    ativo: true,
    alocacoes_pendentes: false,
  },
  {
    id: 3,
    nome: 'Paulo Ferreira',
    telefone: '(88) 9 9999-9999',
    ativo: false,
    alocacoes_pendentes: false,
  },
];

export const motoristaService = {
  async listarMotoristas(busca = ''): Promise<MotoristaItem[]> {
    try {
      const response = await api.get<any[]>('/motoristas');
      const lista = response.data || [];
      const mapeados: MotoristaItem[] = lista.map((m) => ({
        id: m.id,
        nome: m.nome,
        telefone: m.telefone,
        ativo: m.ativo ?? true,
        alocacoes_pendentes: Boolean(m.alocacoes_pendentes),
      }));

      const q = busca.toLowerCase().trim();
      if (!q) return mapeados;

      return mapeados.filter(
        (m) =>
          m.nome.toLowerCase().includes(q) ||
          m.telefone.toLowerCase().includes(q)
      );
    } catch (error) {
      console.warn('Backend /motoristas indisponível, utilizando MOCK:', error);
      const q = busca.toLowerCase().trim();
      if (!q) return JSON.parse(JSON.stringify(MOTORISTAS_MOCK));

      return JSON.parse(JSON.stringify(MOTORISTAS_MOCK)).filter(
        (m: MotoristaItem) =>
          m.nome.toLowerCase().includes(q) ||
          m.telefone.toLowerCase().includes(q)
      );
    }
  },

  async obterMotoristaPorId(id: number): Promise<MotoristaItem | undefined> {
    try {
      const response = await api.get<any>(`/motoristas/${id}`);
      const m = response.data;
      if (m) {
        return {
          id: m.id,
          nome: m.nome,
          telefone: m.telefone,
          ativo: m.ativo ?? true,
          alocacoes_pendentes: Boolean(m.alocacoes_pendentes),
        };
      }
    } catch (err) {
      console.warn('Erro ao obter motorista por ID no backend, usando mock:', err);
    }

    const m = MOTORISTAS_MOCK.find((item) => item.id === id);
    return m ? JSON.parse(JSON.stringify(m)) : undefined;
  },

  async criarMotorista(nome: string, telefone: string): Promise<MotoristaItem> {
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();

    // Validação de Telefone Único (Ativo ou Inativo)
    const jaExiste = MOTORISTAS_MOCK.some(
      (m) => m.telefone.replace(/\D/g, '') === telefoneLimpo.replace(/\D/g, '')
    );

    if (jaExiste) {
      throw new Error('Este profissional já está registrado.');
    }

    try {
      const response = await api.post<any>('/motoristas', {
        nome: nomeLimpo,
        telefone: telefoneLimpo,
      });
      const m = response.data?.data || response.data;
      return {
        id: m.id || Date.now(),
        nome: m.nome || nomeLimpo,
        telefone: m.telefone || telefoneLimpo,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Este profissional já está registrado.');
      }

      if (!error.response) {
        const novoMotorista: MotoristaItem = {
          id: Date.now(),
          nome: nomeLimpo,
          telefone: telefoneLimpo,
          ativo: true,
          alocacoes_pendentes: false,
        };

        MOTORISTAS_MOCK.unshift(novoMotorista);
        return JSON.parse(JSON.stringify(novoMotorista));
      }

      throw error;
    }
  },

  async atualizarMotorista(id: number, nome: string, telefone: string): Promise<MotoristaItem> {
    const nomeLimpo = nome.trim();
    const telefoneLimpo = telefone.trim();

    const duplicado = MOTORISTAS_MOCK.some(
      (m) => m.id !== id && m.telefone.replace(/\D/g, '') === telefoneLimpo.replace(/\D/g, '')
    );

    if (duplicado) {
      throw new Error('Este profissional já está registrado.');
    }

    try {
      const response = await api.patch<any>(`/motoristas/${id}`, {
        nome: nomeLimpo,
        telefone: telefoneLimpo,
      });
      const m = response.data?.data || response.data;
      return {
        id: m.id || id,
        nome: m.nome || nomeLimpo,
        telefone: m.telefone || telefoneLimpo,
        ativo: true,
      };
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('Este profissional já está registrado.');
      }

      if (!error.response) {
        const index = MOTORISTAS_MOCK.findIndex((m) => m.id === id);
        if (index !== -1) {
          MOTORISTAS_MOCK[index].nome = nomeLimpo;
          MOTORISTAS_MOCK[index].telefone = telefoneLimpo;
          return JSON.parse(JSON.stringify(MOTORISTAS_MOCK[index]));
        }
      }

      throw error;
    }
  },

  async inativarMotorista(id: number): Promise<void> {
    const motLocal = MOTORISTAS_MOCK.find((m) => m.id === id);
    if (motLocal && motLocal.alocacoes_pendentes) {
      throw new Error('Este profissional possui alocações pendentes e não pode ser inativado no momento.');
    }

    try {
      await api.patch(`/motoristas/${id}/inativar`);
      if (motLocal) motLocal.ativo = false;
    } catch (error: any) {
      if (!error.response) {
        if (motLocal) {
          motLocal.ativo = false;
          return;
        }
      }
      throw error;
    }
  },

  async reativarMotorista(id: number): Promise<void> {
    const motLocal = MOTORISTAS_MOCK.find((m) => m.id === id);
    try {
      await api.patch(`/motoristas/${id}/ativar`);
      if (motLocal) motLocal.ativo = true;
    } catch (error: any) {
      if (!error.response) {
        if (motLocal) {
          motLocal.ativo = true;
          return;
        }
      }
      throw error;
    }
  },
};
