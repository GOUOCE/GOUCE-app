import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Platform, Share } from 'react-native';
import {
  formatarTrajetoEmbarque,
  type AlunoEmbarqueItem,
  type ListaEmbarqueRota,
} from '../../services/listaEmbarqueService';
import {
  REGISTROS_POR_PAGINA_A4,
  RODAPE_INSTITUCIONAL_A4,
  SUBTITULO_IMPRESSAO_A4,
  gerarHtmlImpressaoA4,
  gerarPaginasImpressaoA4,
  gerarResumoTextoImpressao,
  imprimirListaEmbarque,
} from '../impressaoListaEmbarque';

jest.mock('@/api/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

function criarAlunoFixture(
  id: number,
  nome: string,
  pontoEmbarque: string,
  iesIda?: string,
  iesVolta?: string,
): AlunoEmbarqueItem {
  const sentidoViagem =
    iesIda && iesVolta
      ? iesIda === iesVolta
        ? 'IDA_E_VOLTA_MESMA_IES'
        : 'IES_DISTINTAS'
      : iesIda
        ? 'SOMENTE_IDA'
        : 'SOMENTE_VOLTA';

  return {
    id,
    nome,
    pontoEmbarque,
    iesIda,
    iesVolta,
    sentidoViagem,
    trajetoFormatado: formatarTrajetoEmbarque({ pontoEmbarque, iesIda, iesVolta }),
  };
}

function criarListaLinha01Com38Alunos(): ListaEmbarqueRota {
  const base: AlunoEmbarqueItem[] = [
    criarAlunoFixture(1, 'Ana Paula Lima', 'Pça. Matriz', 'UFC', 'UFC'),
    criarAlunoFixture(2, 'Bruno Costa', 'Pça. Matriz', 'Católica'),
    criarAlunoFixture(3, 'Carla Dias', 'Trevo Bairro Novo', undefined, 'UECE'),
  ];

  for (let i = 4; i <= 37; i += 1) {
    base.push(
      criarAlunoFixture(
        i,
        `Estudante ${String(i).padStart(2, '0')}`,
        'Pça. Matriz',
        i % 2 === 0 ? 'UFC' : 'Católica',
        i % 2 === 0 ? 'UFC' : 'Católica',
      ),
    );
  }

  base.push(criarAlunoFixture(38, 'Wesley Pontes', 'Pça. Matriz', 'UFC', 'Católica'));

  return {
    rotaId: 1,
    rotaNome: 'Linha 01 - Centro',
    dataOperacao: '20/11/2026',
    totalAlunos: 38,
    ultimaSincronizacaoISO: '2026-11-20T09:29:00.000Z',
    alunos: base,
  };
}

function criarListaLinha03Com6Alunos(): ListaEmbarqueRota {
  const alunos: AlunoEmbarqueItem[] = [
    criarAlunoFixture(101, 'Beatriz Sampaio', 'Rotatória da Serrinha', 'UFC', 'UFC'),
    criarAlunoFixture(102, 'Caio Albuquerque', 'Posto São José', 'UECE'),
    criarAlunoFixture(103, 'Débora Vasconcelos', 'Igreja Matriz', undefined, 'IFCE'),
    criarAlunoFixture(104, 'Eduardo Bezerra', 'Rotatória da Serrinha', 'UFC', 'Católica'),
    criarAlunoFixture(105, 'Flávia Queiroz', 'Posto São José', 'Católica', 'Católica'),
    criarAlunoFixture(106, 'Gustavo Farias', 'Igreja Matriz', 'UFC', 'UFC'),
  ];

  return {
    rotaId: 3,
    rotaNome: 'Linha 03 - Serrinha',
    dataOperacao: '20/11/2026',
    totalAlunos: 6,
    ultimaSincronizacaoISO: '2026-11-20T09:29:00.000Z',
    alunos,
  };
}

describe('impressaoListaEmbarque (HU-018)', () => {
  const osOriginal = Platform.OS;

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => osOriginal,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => osOriginal,
    });
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { document?: unknown }).document;
  });

  it('pagina 38 alunos da Linha 01 em 2 folhas A4 de até 30 registros sem linhas em branco', () => {
    const lista = criarListaLinha01Com38Alunos();

    const documento = gerarPaginasImpressaoA4(lista, {
      perfil: 'ADMINISTRADOR',
      nomeEmissor: 'Administrador Padrão',
    });

    expect(REGISTROS_POR_PAGINA_A4).toBe(30);
    expect(documento.titulo).toBe('Lista de Embarque');
    expect(documento.subtitulo).toBe('Relação de alunos alocados por rota');
    expect(documento.emitidoPorLabel).toBe('Administrador Padrão (Administrador)');
    expect(documento.rotaNome).toBe('Linha 01 - Centro');
    expect(documento.totalAlunos).toBe(38);
    expect(documento.rodapeInstitucional).toBe(RODAPE_INSTITUCIONAL_A4);
    expect(documento.paginas).toHaveLength(2);

    const [pagina1, pagina2] = documento.paginas;

    expect(pagina1.numeroPagina).toBe(1);
    expect(pagina1.totalPaginas).toBe(2);
    expect(pagina1.tituloSecao).toBe('Relação de passageiros • registros 01 a 30');
    expect(pagina1.rodapePagina).toBe('Página 1 de 2');
    expect(pagina1.linhas).toHaveLength(30);
    expect(pagina1.linhas.every((linha) => linha.preenchido)).toBe(true);
    expect(pagina1.linhas[0]).toEqual({
      numero: '01',
      nome: 'Ana Paula Lima',
      trajeto: 'Pça. Matriz ↔ UFC',
      preenchido: true,
    });
    expect(pagina1.linhas[1]).toEqual({
      numero: '02',
      nome: 'Bruno Costa',
      trajeto: 'Pça. Matriz → Católica',
      preenchido: true,
    });
    expect(pagina1.linhas[2]).toEqual({
      numero: '03',
      nome: 'Carla Dias',
      trajeto: 'Trevo Bairro Novo ← UECE',
      preenchido: true,
    });

    expect(pagina2.numeroPagina).toBe(2);
    expect(pagina2.totalPaginas).toBe(2);
    expect(pagina2.tituloSecao).toBe('Relação de passageiros • registros 31 a 38');
    expect(pagina2.rodapePagina).toBe('Página 2 de 2');
    expect(pagina2.linhas).toHaveLength(8);
    expect(pagina2.linhas.every((linha) => linha.preenchido)).toBe(true);
    expect(pagina2.linhas[0].numero).toBe('31');
    expect(pagina2.linhas[7]).toEqual({
      numero: '38',
      nome: 'Wesley Pontes',
      trajeto: 'Ida: Pça. Matriz → UFC | Volta: ← Católica',
      preenchido: true,
    });
  });

  it('pagina 6 alunos da Linha 03 em 1 página apenas com os 6 registros reais', () => {
    const lista = criarListaLinha03Com6Alunos();
    const documento = gerarPaginasImpressaoA4(lista);

    expect(documento.paginas).toHaveLength(1);
    const [pagina] = documento.paginas;
    expect(pagina.tituloSecao).toBe('Relação de passageiros • registros 01 a 06');
    expect(pagina.rodapePagina).toBe('Página 1 de 1');
    expect(pagina.linhas).toHaveLength(6);
    expect(pagina.linhas.every((l) => l.preenchido)).toBe(true);
  });

  it('impede geração e impressão para rota sem alunos alocados (FA-002)', async () => {
    const listaVazia: ListaEmbarqueRota = {
      rotaId: 2,
      rotaNome: 'Linha 02 - Bairro Novo',
      dataOperacao: '20/11/2026',
      totalAlunos: 0,
      ultimaSincronizacaoISO: '2026-11-20T09:29:00.000Z',
      alunos: [],
    };

    expect(() => gerarPaginasImpressaoA4(listaVazia)).toThrow(
      'Não é possível imprimir uma lista de embarque sem alunos alocados.',
    );
    expect(() => gerarHtmlImpressaoA4(listaVazia)).toThrow(
      'Não é possível imprimir uma lista de embarque sem alunos alocados.',
    );
    await expect(imprimirListaEmbarque(listaVazia)).rejects.toThrow(
      'Não é possível imprimir uma lista de embarque sem alunos alocados.',
    );
  });

  it('exibe nome e perfil de acesso do emissor em Administrador e Representante', () => {
    const lista = criarListaLinha03Com6Alunos();

    const docAdminNome = gerarPaginasImpressaoA4(lista, {
      perfil: 'ADMINISTRADOR',
      nomeEmissor: 'Felipe Silva',
    });
    expect(docAdminNome.emitidoPorLabel).toBe('Felipe Silva (Administrador)');

    const docRepNome = gerarPaginasImpressaoA4(lista, {
      perfil: 'MOTORISTA',
      nomeEmissor: 'Juliana Mendes',
    });
    expect(docRepNome.emitidoPorLabel).toBe('Juliana Mendes (Representante)');

    const docFallbackAdmin = gerarPaginasImpressaoA4(lista, { perfil: 'ADMINISTRADOR' });
    expect(docFallbackAdmin.emitidoPorLabel).toBe('Administrador Geral (Administrador)');

    const docFallbackRep = gerarPaginasImpressaoA4(lista, { perfil: 'MOTORISTA' });
    expect(docFallbackRep.emitidoPorLabel).toBe('Representante da Rota (Representante)');

    const docCustom = gerarPaginasImpressaoA4(lista, {
      perfil: 'MOTORISTA',
      emitidoPor: 'Juliana Mendes (Representante UFC)',
    });
    expect(docCustom.emitidoPorLabel).toBe('Juliana Mendes (Representante UFC)');
  });

  it('gera HTML A4 de documento oficial sem referências a modelo e escapa caracteres perigosos', () => {
    const lista = criarListaLinha01Com38Alunos();
    const html = gerarHtmlImpressaoA4(lista, {
      perfil: 'ADMINISTRADOR',
      nomeEmissor: 'Administrador Padrão',
    });

    expect(html).not.toContain('Modelo');
    expect(html).not.toContain('Campos em branco');
    expect(html).toContain('M118.24 4H77.76C63.5331 4');
    expect(html).toContain('Lista de Embarque');
    expect(html).toContain(SUBTITULO_IMPRESSAO_A4);
    expect(html).toContain('Emitido por: <strong>Administrador Padrão (Administrador)</strong>');
    expect(html).toContain('Relação de passageiros • registros 01 a 30');
    expect(html).toContain('Relação de passageiros • registros 31 a 38');
    expect(html).toContain(RODAPE_INSTITUCIONAL_A4);
    expect(html).toContain('Página 1 de 2');
    expect(html).toContain('Página 2 de 2');

    const listaComXss: ListaEmbarqueRota = {
      rotaId: 99,
      rotaNome: 'Linha <script>alert(1)</script>',
      dataOperacao: '01/09/2026',
      totalAlunos: 1,
      ultimaSincronizacaoISO: new Date().toISOString(),
      alunos: [
        {
          id: 999,
          nome: 'Ana "Teste" & <img src=x>',
          pontoEmbarque: "Pça. 'Matriz'",
          iesIda: 'UFC',
          iesVolta: 'UFC',
          sentidoViagem: 'IDA_E_VOLTA_MESMA_IES',
          trajetoFormatado: "Pça. 'Matriz' ↔ UFC",
        },
      ],
    };

    const htmlEscapado = gerarHtmlImpressaoA4(listaComXss, {
      perfil: 'ADMINISTRADOR',
      nomeEmissor: 'Admin <Script>',
    });
    expect(htmlEscapado).not.toContain('<script>');
    expect(htmlEscapado).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(htmlEscapado).toContain('Ana &quot;Teste&quot; &amp; &lt;img src=x&gt;');
    expect(htmlEscapado).toContain('Pça. &#39;Matriz&#39; ↔ UFC');
    expect(htmlEscapado).toContain('Admin &lt;Script&gt; (Administrador)');
  });

  it('aciona Share.share no mobile e imprime na web via iframe oculto (ou fallback window.open) fechando apos afterprint', async () => {
    const lista = criarListaLinha03Com6Alunos();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'android',
    });
    const shareSpy = jest
      .spyOn(Share, 'share')
      .mockResolvedValue({ action: 'sharedAction' });

    const resultadoMobile = await imprimirListaEmbarque(lista, {
      perfil: 'ADMINISTRADOR',
      nomeEmissor: 'Administrador Geral',
    });
    expect(resultadoMobile.metodo).toBe('native-share');
    expect(shareSpy).toHaveBeenCalledTimes(1);
    expect(shareSpy).toHaveBeenCalledWith({
      title: 'Lista de Embarque - Linha 03 - Serrinha',
      message: gerarResumoTextoImpressao(lista, {
        perfil: 'ADMINISTRADOR',
        nomeEmissor: 'Administrador Geral',
      }),
    });

    // 1. Fluxo principal na Web via iframe oculto (sem abrir janela residual)
    const iframeDocMock = {
      open: jest.fn(),
      write: jest.fn(),
      close: jest.fn(),
    };
    const removeChildMock = jest.fn();
    const iframeWindowMock: {
      document: typeof iframeDocMock;
      focus: jest.Mock;
      print: jest.Mock;
      onafterprint: (() => void) | null;
      addEventListener: jest.Mock;
      removeEventListener: jest.Mock;
    } = {
      document: iframeDocMock,
      focus: jest.fn(),
      print: jest.fn(),
      onafterprint: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    const iframeElementMock = {
      id: '',
      style: {} as Record<string, string>,
      setAttribute: jest.fn(),
      contentWindow: iframeWindowMock,
      contentDocument: iframeDocMock,
      parentNode: { removeChild: removeChildMock },
    };
    const appendChildMock = jest.fn();
    const openMockNaoChamado = jest.fn();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
    (globalThis as { window?: unknown }).window = {
      open: openMockNaoChamado,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
    (globalThis as { document?: unknown }).document = {
      body: { appendChild: appendChildMock },
      getElementById: jest.fn().mockReturnValue(null),
      createElement: jest.fn().mockReturnValue(iframeElementMock),
    };

    const resultadoIframe = await imprimirListaEmbarque(lista, {
      perfil: 'MOTORISTA',
      nomeEmissor: 'Juliana Mendes',
    });

    expect(resultadoIframe.metodo).toBe('web-print');
    expect(openMockNaoChamado).not.toHaveBeenCalled();
    expect(appendChildMock).toHaveBeenCalledWith(iframeElementMock);
    expect(iframeDocMock.open).toHaveBeenCalledTimes(1);
    expect(iframeDocMock.write).toHaveBeenCalledWith(
      expect.stringContaining('Emitido por: <strong>Juliana Mendes (Representante)</strong>'),
    );
    expect(iframeDocMock.close).toHaveBeenCalledTimes(1);
    expect(iframeWindowMock.focus).toHaveBeenCalledTimes(1);
    expect(iframeWindowMock.print).toHaveBeenCalledTimes(1);

    iframeWindowMock.onafterprint?.();
    expect(removeChildMock).toHaveBeenCalledWith(iframeElementMock);

    // 2. Fallback via window.open quando document.body não estiver disponível
    delete (globalThis as { document?: unknown }).document;
    const docMock = {
      open: jest.fn(),
      write: jest.fn(),
      close: jest.fn(),
    };
    const popupMock: {
      document: typeof docMock;
      focus: jest.Mock;
      print: jest.Mock;
      close: jest.Mock;
      onafterprint: (() => void) | null;
      addEventListener: jest.Mock;
    } = {
      document: docMock,
      focus: jest.fn(),
      print: jest.fn(),
      close: jest.fn(),
      onafterprint: null,
      addEventListener: jest.fn(),
    };
    const openMock = jest.fn().mockReturnValue(popupMock);
    const windowPrintFallbackMock = jest.fn();

    (globalThis as { window?: unknown }).window = {
      open: openMock,
      print: windowPrintFallbackMock,
    };

    const resultadoWeb = await imprimirListaEmbarque(lista, {
      perfil: 'MOTORISTA',
      nomeEmissor: 'Juliana Mendes',
    });
    expect(resultadoWeb.metodo).toBe('web-print');
    expect(openMock).toHaveBeenCalledWith('', '_blank', 'width=900,height=1100');
    expect(docMock.open).toHaveBeenCalledTimes(1);
    expect(docMock.write).toHaveBeenCalledWith(
      expect.stringContaining('Emitido por: <strong>Juliana Mendes (Representante)</strong>'),
    );
    expect(docMock.close).toHaveBeenCalledTimes(1);
    expect(popupMock.focus).toHaveBeenCalledTimes(1);
    expect(popupMock.print).toHaveBeenCalledTimes(1);
    popupMock.onafterprint?.();
    expect(popupMock.close).toHaveBeenCalledTimes(1);
    expect(windowPrintFallbackMock).not.toHaveBeenCalled();

    // 3. Fallback caso o navegador bloqueie o popup
    openMock.mockReturnValueOnce(null);
    await imprimirListaEmbarque(lista);
    expect(windowPrintFallbackMock).toHaveBeenCalledTimes(1);
  });
});
