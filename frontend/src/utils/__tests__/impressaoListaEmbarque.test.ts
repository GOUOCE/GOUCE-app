import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Platform, Share } from 'react-native';
import {
  listaEmbarqueService,
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

describe('impressaoListaEmbarque (HU-018)', () => {
  const osOriginal = Platform.OS;

  beforeEach(() => {
    listaEmbarqueService.resetarMocks();
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
  });

  it('pagina 38 alunos reais da Linha 01 em 2 folhas A4 de até 30 registros sem linhas em branco', async () => {
    const lista = await listaEmbarqueService.obterListaEmbarque({
      rotaId: 1,
      perfil: 'ADMINISTRADOR',
    });

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

  it('pagina 6 alunos da Linha 03 em 1 página apenas com os 6 registros reais', async () => {
    const lista = await listaEmbarqueService.obterListaEmbarque({ rotaId: 3 });
    const documento = gerarPaginasImpressaoA4(lista);

    expect(documento.paginas).toHaveLength(1);
    const [pagina] = documento.paginas;
    expect(pagina.tituloSecao).toBe('Relação de passageiros • registros 01 a 06');
    expect(pagina.rodapePagina).toBe('Página 1 de 1');
    expect(pagina.linhas).toHaveLength(6);
    expect(pagina.linhas.every((l) => l.preenchido)).toBe(true);
  });

  it('impede geração e impressão para rota sem alunos alocados (FA-002)', async () => {
    const listaVazia = await listaEmbarqueService.obterListaEmbarque({ rotaId: 2 });

    expect(() => gerarPaginasImpressaoA4(listaVazia)).toThrow(
      'Não é possível imprimir uma lista de embarque sem alunos alocados.'
    );
    expect(() => gerarHtmlImpressaoA4(listaVazia)).toThrow(
      'Não é possível imprimir uma lista de embarque sem alunos alocados.'
    );
    await expect(imprimirListaEmbarque(listaVazia)).rejects.toThrow(
      'Não é possível imprimir uma lista de embarque sem alunos alocados.'
    );
  });

  it('exibe nome e perfil de acesso do emissor em Administrador e Representante', async () => {
    const lista = await listaEmbarqueService.obterListaEmbarque({
      rotaId: 1,
      perfil: 'MOTORISTA',
      iesResponsavel: 'UFC',
    });

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

  it('gera HTML A4 de documento oficial sem referências a modelo e escapa caracteres perigosos', async () => {
    const lista = await listaEmbarqueService.obterListaEmbarque({ rotaId: 1 });
    const html = gerarHtmlImpressaoA4(lista, {
      perfil: 'ADMINISTRADOR',
      nomeEmissor: 'Administrador Padrão',
    });

    expect(html).not.toContain('Modelo');
    expect(html).not.toContain('Campos em branco');
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

  it('aciona Share.share no ambiente nativo e window.open/print no ambiente web', async () => {
    const lista = await listaEmbarqueService.obterListaEmbarque({ rotaId: 3 });

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

    const docMock = {
      open: jest.fn(),
      write: jest.fn(),
      close: jest.fn(),
    };
    const popupMock = {
      document: docMock,
      focus: jest.fn(),
      print: jest.fn(),
    };
    const openMock = jest.fn().mockReturnValue(popupMock);
    const windowPrintFallbackMock = jest.fn();

    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => 'web',
    });
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
      expect.stringContaining('Emitido por: <strong>Juliana Mendes (Representante)</strong>')
    );
    expect(docMock.close).toHaveBeenCalledTimes(1);
    expect(popupMock.focus).toHaveBeenCalledTimes(1);
    expect(popupMock.print).toHaveBeenCalledTimes(1);
    expect(windowPrintFallbackMock).not.toHaveBeenCalled();

    // Testa fallback caso o navegador bloqueie o popup
    openMock.mockReturnValueOnce(null);
    await imprimirListaEmbarque(lista);
    expect(windowPrintFallbackMock).toHaveBeenCalledTimes(1);
  });
});
