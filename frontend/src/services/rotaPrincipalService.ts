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
  { id: 5, nome: 'Uniateneu Inativa', sigla: 'Uniateneu', ativo: false }, // Inativa (Filtro obriga ignorar)
];

let BAIRROS_MOCK: BairroOpcao[] = [
  { id: 1, nome: 'Centro', ativo: true },
  { id: 2, nome: 'Bairro Novo', ativo: true },
  { id: 3, nome: 'Vila Antiga Inativa', ativo: false }, // Inativo (Filtro obriga ignorar)
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
    agendamentos_pendentes: true, // Para testar bloqueio de inativação
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
  async listarRotasPrincipais(busca = ''): Promise<RotaPrincipalItem[]> {
    const q = busca.toLowerCase().trim();
    if (!q) return JSON.parse(JSON.stringify(ROTAS_PRINCIPAIS_MOCK));

    return JSON.parse(JSON.stringify(ROTAS_PRINCIPAIS_MOCK)).filter(
      (r: RotaPrincipalItem) =>
        r.nome.toLowerCase().includes(q) ||
        r.horario_saida.includes(q) ||
        r.horario_retorno.includes(q)
    );
  },

  async listarFaculdadesAtivas(): Promise<FaculdadeOpcao[]> {
    // Regra de Negócio: Exibe APENAS faculdades ATIVAS no seletor de vínculo
    return FACULDADES_MOCK.filter((f) => f.ativo);
  },

  async listarBairrosAtivos(): Promise<BairroOpcao[]> {
    // Regra de Negócio: Exibe APENAS bairros ATIVOS no seletor de vínculo
    return BAIRROS_MOCK.filter((b) => b.ativo);
  },

  async obterRotaPrincipalPorId(id: number): Promise<RotaPrincipalItem | undefined> {
    const r = ROTAS_PRINCIPAIS_MOCK.find((item) => item.id === id);
    return r ? JSON.parse(JSON.stringify(r)) : undefined;
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

    // Validação de Nome Único
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

    const index = ROTAS_PRINCIPAIS_MOCK.findIndex((r) => r.id === id);
    if (index === -1) {
      throw new Error('Rota não encontrada.');
    }

    // Validação de Duplicidade ao Editar
    const duplicado = ROTAS_PRINCIPAIS_MOCK.some(
      (r) => r.id !== id && r.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );

    if (duplicado) {
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

    ROTAS_PRINCIPAIS_MOCK[index].nome = nomeLimpo;
    ROTAS_PRINCIPAIS_MOCK[index].horario_saida = dados.horarioSaida.trim();
    ROTAS_PRINCIPAIS_MOCK[index].horario_retorno = dados.horarioRetorno.trim();
    ROTAS_PRINCIPAIS_MOCK[index].faculdades_ida = facsIda;
    ROTAS_PRINCIPAIS_MOCK[index].faculdades_volta = facsVolta;
    ROTAS_PRINCIPAIS_MOCK[index].bairros = bairrosVinculados;

    return JSON.parse(JSON.stringify(ROTAS_PRINCIPAIS_MOCK[index]));
  },

  async inativarRotaPrincipal(id: number): Promise<void> {
    const rota = ROTAS_PRINCIPAIS_MOCK.find((r) => r.id === id);
    if (!rota) {
      throw new Error('Rota não encontrada.');
    }

    // Bloqueio de Inativação se possuir agendamentos futuros de alunos
    if (rota.agendamentos_pendentes) {
      throw new Error('Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.');
    }

    rota.ativo = false;
  },

  async reativarRotaPrincipal(id: number): Promise<void> {
    const rota = ROTAS_PRINCIPAIS_MOCK.find((r) => r.id === id);
    if (rota) {
      rota.ativo = true;
    }
  },
};
