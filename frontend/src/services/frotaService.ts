export interface OnibusItem {
  id: number;
  identificacao: string;
  placa: string;
  assentos: number;
  capacidade_em_pe: number;
  ativo: boolean;
  alocacoes_pendentes?: boolean;
}

// Mocks iniciais de ônibus do protótipo
let ONIBUS_MOCK: OnibusItem[] = [
  {
    id: 1,
    identificacao: 'Ônibus 04',
    placa: 'OCR-1234',
    assentos: 42,
    capacidade_em_pe: 10,
    ativo: true,
    alocacoes_pendentes: true, // Para testar bloqueio de inativação
  },
  {
    id: 2,
    identificacao: 'Ônibus 07',
    placa: 'OCR-5521',
    assentos: 32,
    capacidade_em_pe: 6,
    ativo: true,
    alocacoes_pendentes: false,
  },
  {
    id: 3,
    identificacao: 'Ônibus 12',
    placa: 'OCR-8890',
    assentos: 42,
    capacidade_em_pe: 10,
    ativo: false,
    alocacoes_pendentes: false,
  },
];

export const frotaService = {
  async listarOnibus(busca = ''): Promise<OnibusItem[]> {
    const q = busca.toLowerCase().trim();
    if (!q) return JSON.parse(JSON.stringify(ONIBUS_MOCK));

    return JSON.parse(JSON.stringify(ONIBUS_MOCK)).filter(
      (o: OnibusItem) =>
        o.identificacao.toLowerCase().includes(q) ||
        o.placa.toLowerCase().includes(q)
    );
  },

  async obterOnibusPorId(id: number): Promise<OnibusItem | undefined> {
    const o = ONIBUS_MOCK.find((item) => item.id === id);
    return o ? JSON.parse(JSON.stringify(o)) : undefined;
  },

  async criarOnibus(
    placa: string,
    assentos: number,
    capacidadeEmPe: number,
    identificacao?: string
  ): Promise<OnibusItem> {
    const placaLimpa = placa.trim().toUpperCase();

    // Validação de Placa Única (Ativa ou Inativa)
    const jaExiste = ONIBUS_MOCK.some(
      (o) => o.placa.replace(/[^A-Z0-9]/g, '') === placaLimpa.replace(/[^A-Z0-9]/g, '')
    );

    if (jaExiste) {
      throw new Error('Este veículo já está registrado.');
    }

    const proximoNumero = ONIBUS_MOCK.length + 1;
    const nomeIdentificacao = identificacao?.trim() || `Ônibus ${proximoNumero < 10 ? `0${proximoNumero}` : proximoNumero}`;

    const novoOnibus: OnibusItem = {
      id: Date.now(),
      identificacao: nomeIdentificacao,
      placa: placaLimpa,
      assentos,
      capacidade_em_pe: capacidadeEmPe,
      ativo: true,
      alocacoes_pendentes: false,
    };

    ONIBUS_MOCK.unshift(novoOnibus);
    return JSON.parse(JSON.stringify(novoOnibus));
  },

  async atualizarOnibus(
    id: number,
    placa: string,
    assentos: number,
    capacidadeEmPe: number,
    identificacao?: string
  ): Promise<OnibusItem> {
    const placaLimpa = placa.trim().toUpperCase();

    const index = ONIBUS_MOCK.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error('Ônibus não encontrado.');
    }

    // Validação de Duplicidade ao Editar
    const duplicado = ONIBUS_MOCK.some(
      (o) => o.id !== id && o.placa.replace(/[^A-Z0-9]/g, '') === placaLimpa.replace(/[^A-Z0-9]/g, '')
    );

    if (duplicado) {
      throw new Error('Este veículo já está registrado.');
    }

    ONIBUS_MOCK[index].placa = placaLimpa;
    ONIBUS_MOCK[index].assentos = assentos;
    ONIBUS_MOCK[index].capacidade_em_pe = capacidadeEmPe;
    if (identificacao) ONIBUS_MOCK[index].identificacao = identificacao.trim();

    return JSON.parse(JSON.stringify(ONIBUS_MOCK[index]));
  },

  async inativarOnibus(id: number): Promise<void> {
    const onibus = ONIBUS_MOCK.find((o) => o.id === id);
    if (!onibus) {
      throw new Error('Ônibus não encontrado.');
    }

    // Bloqueio de Inativação se possuir alocações pendentes para datas futuras
    if (onibus.alocacoes_pendentes) {
      throw new Error('Este veículo possui alocações pendentes e não pode ser inativado no momento.');
    }

    onibus.ativo = false;
  },

  async reativarOnibus(id: number): Promise<void> {
    const onibus = ONIBUS_MOCK.find((o) => o.id === id);
    if (onibus) {
      onibus.ativo = true;
    }
  },
};
