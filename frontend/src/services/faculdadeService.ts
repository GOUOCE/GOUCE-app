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
    const q = busca.toLowerCase().trim();
    if (!q) return JSON.parse(JSON.stringify(FACULDADES_MOCK));

    return JSON.parse(JSON.stringify(FACULDADES_MOCK)).filter(
      (f: FaculdadeItem) =>
        f.nome.toLowerCase().includes(q) ||
        f.sigla.toLowerCase().includes(q) ||
        f.campus.toLowerCase().includes(q)
    );
  },

  async obterFaculdadePorId(id: number): Promise<FaculdadeItem | undefined> {
    const faculdade = FACULDADES_MOCK.find((f) => f.id === id);
    return faculdade ? JSON.parse(JSON.stringify(faculdade)) : undefined;
  },

  async criarFaculdade(nome: string, sigla: string, campus: string): Promise<FaculdadeItem> {
    const nomeLimpo = nome.trim();
    const siglaLimpa = sigla.trim();
    const campusLimpo = campus.trim();

    // Validação da Combinação Única (nome + campus) ou (sigla + campus) (Ativa ou Inativa)
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
  },

  async atualizarFaculdade(id: number, nome: string, sigla: string, campus: string): Promise<FaculdadeItem> {
    const nomeLimpo = nome.trim();
    const siglaLimpa = sigla.trim();
    const campusLimpo = campus.trim();

    const index = FACULDADES_MOCK.findIndex((f) => f.id === id);
    if (index === -1) {
      throw new Error('Faculdade não encontrada.');
    }

    // Validação de Duplicidade ao Editar
    const duplicado = FACULDADES_MOCK.some(
      (f) =>
        f.id !== id &&
        ((f.nome.toLowerCase() === nomeLimpo.toLowerCase() &&
          f.campus.toLowerCase() === campusLimpo.toLowerCase()) ||
         (f.sigla.toLowerCase() === siglaLimpa.toLowerCase() &&
          f.campus.toLowerCase() === campusLimpo.toLowerCase()))
    );

    if (duplicado) {
      throw new Error('Esta faculdade já está cadastrada.');
    }

    FACULDADES_MOCK[index].nome = nomeLimpo;
    FACULDADES_MOCK[index].sigla = siglaLimpa;
    FACULDADES_MOCK[index].campus = campusLimpo;

    return JSON.parse(JSON.stringify(FACULDADES_MOCK[index]));
  },

  async inativarFaculdade(id: number): Promise<void> {
    const faculdade = FACULDADES_MOCK.find((f) => f.id === id);
    if (!faculdade) {
      throw new Error('Faculdade não encontrada.');
    }

    // Bloqueio de Inativação se possuir viagens programadas pendentes
    if (faculdade.viagens_programadas_pendentes) {
      throw new Error('Esta instituição possui viagens programadas pendentes. Não é possível inativar no momento.');
    }

    faculdade.ativo = false;
  },

  async reativarFaculdade(id: number): Promise<void> {
    const faculdade = FACULDADES_MOCK.find((f) => f.id === id);
    if (faculdade) {
      faculdade.ativo = true;
    }
  },
};
