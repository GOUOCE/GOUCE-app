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
    const q = busca.toLowerCase().trim();
    if (!q) return JSON.parse(JSON.stringify(BAIRROS_MOCK));

    return JSON.parse(JSON.stringify(BAIRROS_MOCK)).filter(
      (b: BairroItem) =>
        b.nome.toLowerCase().includes(q) ||
        b.pontos.some((p) => p.nome.toLowerCase().includes(q))
    );
  },

  async obterBairroPorId(id: number): Promise<BairroItem | undefined> {
    const bairro = BAIRROS_MOCK.find((b) => b.id === id);
    return bairro ? JSON.parse(JSON.stringify(bairro)) : undefined;
  },

  async criarBairro(nome: string, pontosNomes: string[]): Promise<BairroItem> {
    const nomeLimpo = nome.trim();

    // Validação de Nome Único (Ativo ou Inativo)
    const jaExiste = BAIRROS_MOCK.some(
      (b) => b.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (jaExiste) {
      throw new Error('Esta localidade já está cadastrada.');
    }

    if (!pontosNomes || pontosNomes.length === 0) {
      throw new Error('Adicione ao menos um ponto de parada para o bairro.');
    }

    // Validação de Ponto Único
    for (const pNome of pontosNomes) {
      const pontoJaExiste = BAIRROS_MOCK.some((b) =>
        b.pontos.some((p) => p.nome.toLowerCase() === pNome.trim().toLowerCase())
      );
      if (pontoJaExiste) {
        throw new Error(`Esta localidade já está cadastrada: ponto "${pNome}".`);
      }
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
  },

  async atualizarBairro(id: number, nome: string, pontosNomes: string[]): Promise<BairroItem> {
    const nomeLimpo = nome.trim();
    const index = BAIRROS_MOCK.findIndex((b) => b.id === id);

    if (index === -1) {
      throw new Error('Bairro não encontrado.');
    }

    // Validação de Duplicidade ao Editar
    const duplicado = BAIRROS_MOCK.some(
      (b) => b.id !== id && b.nome.toLowerCase() === nomeLimpo.toLowerCase()
    );
    if (duplicado) {
      throw new Error('Esta localidade já está cadastrada.');
    }

    if (!pontosNomes || pontosNomes.length === 0) {
      throw new Error('Adicione ao menos um ponto de parada para o bairro.');
    }

    BAIRROS_MOCK[index].nome = nomeLimpo;
    BAIRROS_MOCK[index].pontos = pontosNomes.map((pNome, idx) => ({
      id: Date.now() + idx + 1,
      nome: pNome.trim(),
      ativo: true,
    }));

    return JSON.parse(JSON.stringify(BAIRROS_MOCK[index]));
  },

  async inativarBairro(id: number): Promise<void> {
    const bairro = BAIRROS_MOCK.find((b) => b.id === id);
    if (!bairro) {
      throw new Error('Bairro não encontrado.');
    }

    // Bloqueio de Inativação se vinculado a uma Rota Ativa
    if (bairro.vinculado_rota_ativa) {
      throw new Error(
        'Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.'
      );
    }

    bairro.ativo = false;
    bairro.pontos.forEach((p) => {
      p.ativo = false;
    });
  },

  async reativarBairro(id: number): Promise<void> {
    const bairro = BAIRROS_MOCK.find((b) => b.id === id);
    if (bairro) {
      bairro.ativo = true;
      bairro.pontos.forEach((p) => {
        p.ativo = true;
      });
    }
  },
};
