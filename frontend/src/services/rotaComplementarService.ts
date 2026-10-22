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
  { id: 3, nome: 'Linha 03 - Inativa', ativo: false }, // Inativa (Não deve aparecer no dropdown)
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
    agendamentos_pendentes: true, // Para testar bloqueio de inativação
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
  async listarRotasComplementares(busca = ''): Promise<RotaComplementarItem[]> {
    const q = busca.toLowerCase().trim();
    if (!q) return JSON.parse(JSON.stringify(ROTAS_COMPLEMENTARES_MOCK));

    return JSON.parse(JSON.stringify(ROTAS_COMPLEMENTARES_MOCK)).filter(
      (rc: RotaComplementarItem) =>
        rc.nome.toLowerCase().includes(q) ||
        rc.rota_principal_nome.toLowerCase().includes(q) ||
        rc.ponto_conexao.toLowerCase().includes(q)
    );
  },

  async listarRotasPrincipaisAtivas(): Promise<RotaPrincipalSimples[]> {
    // Regra de Negócio: Exibe APENAS rotas principais ATIVAS
    return ROTAS_PRINCIPAIS_MOCK.filter((rp) => rp.ativo);
  },

  async obterRotaComplementarPorId(id: number): Promise<RotaComplementarItem | undefined> {
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

    // Valida se a Rota Principal vinculada existe e está ativa
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
    const index = ROTAS_COMPLEMENTARES_MOCK.findIndex((rc) => rc.id === id);
    if (index === -1) {
      throw new Error('Rota complementar não encontrada.');
    }

    const rotaPrincipal = ROTAS_PRINCIPAIS_MOCK.find(
      (rp) => rp.id === dados.rotaPrincipalId && rp.ativo
    );
    if (!rotaPrincipal) {
      throw new Error('A rota principal selecionada é inválida ou está inativa.');
    }

    ROTAS_COMPLEMENTARES_MOCK[index].nome = dados.nome.trim();
    ROTAS_COMPLEMENTARES_MOCK[index].rota_principal_id = rotaPrincipal.id;
    ROTAS_COMPLEMENTARES_MOCK[index].rota_principal_nome = rotaPrincipal.nome;
    ROTAS_COMPLEMENTARES_MOCK[index].horario_saida = dados.horarioSaida.trim();
    ROTAS_COMPLEMENTARES_MOCK[index].ponto_conexao = dados.pontoConexao.trim();

    return JSON.parse(JSON.stringify(ROTAS_COMPLEMENTARES_MOCK[index]));
  },

  async inativarRotaComplementar(id: number): Promise<void> {
    const rc = ROTAS_COMPLEMENTARES_MOCK.find((item) => item.id === id);
    if (!rc) {
      throw new Error('Rota complementar não encontrada.');
    }

    // Bloqueio de Inativação se possuir agendamentos futuros de alunos
    if (rc.agendamentos_pendentes) {
      throw new Error('Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.');
    }

    rc.ativo = false;
  },

  async reativarRotaComplementar(id: number): Promise<void> {
    const rc = ROTAS_COMPLEMENTARES_MOCK.find((item) => item.id === id);
    if (rc) {
      rc.ativo = true;
    }
  },
};
