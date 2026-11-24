import { api } from '@/api/api';

export type TurnoRodizio = 'ida' | 'volta';

export interface RotaRodizio {
  id: number;
  nome: string;
  horario_saida: string | null;
  horario_retorno: string | null;
}

export interface OnibusRodizio {
  placa: string;
  apelido: string;
  assentos: number;
  capacidade_em_pe: number;
}

export interface ItemConfiguracaoRodizio {
  rota_id: number;
  onibus_id: string;
  turno: TurnoRodizio;
}

export interface ConfiguracaoRodizio {
  id: number;
  data_inicio: string;
  semanas: number;
  itens: ItemConfiguracaoRodizio[];
}

export interface ContextoRodizio {
  ativa: boolean;
  configuracao: ConfiguracaoRodizio | null;
  rotas: RotaRodizio[];
  onibus: OnibusRodizio[];
}

export interface ItemRodizioPayload {
  rota_id: number;
  onibus_id: string;
  turno: TurnoRodizio;
}

export interface RodizioPayload {
  data_inicio: string;
  semanas: number;
  itens: ItemRodizioPayload[];
}

export interface ItemEscalaRodizio {
  rota_id: number;
  rota_nome: string;
  onibus_id: string;
  turno: TurnoRodizio;
  demanda_prevista: number;
  capacidade_assentos: number;
  capacidade_em_pe: number;
  alerta_capacidade: string | null;
}

export interface EscalaRodizio {
  semana: number;
  data_inicio: string;
  data_fim: string;
  itens: ItemEscalaRodizio[];
}

export interface AlertaRodizio {
  semana: number;
  rota_id: number;
  onibus_id: string;
  mensagem: string;
}

export interface PreviaRodizio {
  ativa: boolean;
  data_inicio: string;
  semanas: number;
  escalas: EscalaRodizio[];
  alertas: AlertaRodizio[];
}

export interface ConfirmacaoRodizio {
  mensagem: string;
  configuracao: ConfiguracaoRodizio | null;
}

export const rodizioService = {
  async obterContexto(): Promise<ContextoRodizio> {
    const response = await api.get<ContextoRodizio>('/rodizio-frota');
    return response.data;
  },

  async gerarPrevia(payload: RodizioPayload): Promise<PreviaRodizio> {
    const response = await api.post<PreviaRodizio>('/rodizio-frota/preview', payload);
    return response.data;
  },

  async confirmar(payload: RodizioPayload): Promise<ConfirmacaoRodizio> {
    const response = await api.post<ConfirmacaoRodizio>('/rodizio-frota/confirmar', payload);
    return response.data;
  },
};
