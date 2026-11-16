import { Platform, Share } from 'react-native';
import type { ListaEmbarqueRota, PerfilListaEmbarque } from '../services/listaEmbarqueService';

export const REGISTROS_POR_PAGINA_A4 = 30;

export const TITULO_IMPRESSAO_A4 = 'Lista de Embarque';
export const SUBTITULO_IMPRESSAO_A4 = 'Relação de alunos alocados por rota';
export const RODAPE_INSTITUCIONAL_A4 =
  'GOUOCE • Documento oficial de conferência de embarque.';

export interface LinhaImpressaoA4 {
  numero: string;
  nome: string;
  trajeto: string;
  preenchido: boolean;
}

export interface PaginaImpressaoA4 {
  numeroPagina: number;
  totalPaginas: number;
  registroInicial: string;
  registroFinal: string;
  tituloSecao: string;
  rodapePagina: string;
  linhas: LinhaImpressaoA4[];
}

export interface DocumentoImpressaoA4 {
  titulo: string;
  subtitulo: string;
  emitidoPorLabel: string;
  dataViagem: string;
  rotaNome: string;
  totalAlunos: number;
  rodapeInstitucional: string;
  paginas: PaginaImpressaoA4[];
}

export interface OpcoesImpressaoListaEmbarque {
  perfil?: PerfilListaEmbarque;
  nomeEmissor?: string;
  emitidoPor?: string;
}

export interface ResultadoImpressaoListaEmbarque {
  metodo: 'web-print' | 'native-share';
  html: string;
  documento: DocumentoImpressaoA4;
}

function formatarNumeroRegistro(indice: number): string {
  return String(indice).padStart(2, '0');
}

function resolverEmitidoPor(opcoes?: OpcoesImpressaoListaEmbarque): string {
  const rotuloPerfil = opcoes?.perfil === 'MOTORISTA' ? 'Representante' : 'Administrador';
  const nome = opcoes?.nomeEmissor?.trim();
  if (nome) {
    return `${nome} (${rotuloPerfil})`;
  }

  const customizado = opcoes?.emitidoPor?.trim();
  if (customizado) {
    return customizado.includes('(') ? customizado : `${customizado} (${rotuloPerfil})`;
  }

  return opcoes?.perfil === 'MOTORISTA'
    ? 'Representante da Rota (Representante)'
    : 'Administrador Geral (Administrador)';
}

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Estrutura a lista de embarque em páginas A4 com até 30 registros reais por folha,
 * gerando apenas as linhas correspondentes aos alunos efetivamente alocados.
 */
export function gerarPaginasImpressaoA4(
  lista: ListaEmbarqueRota,
  opcoes?: OpcoesImpressaoListaEmbarque
): DocumentoImpressaoA4 {
  if (lista.alunos.length === 0) {
    throw new Error('Não é possível imprimir uma lista de embarque sem alunos alocados.');
  }

  const emitidoPorLabel = resolverEmitidoPor(opcoes);
  const totalPaginas = Math.ceil(lista.alunos.length / REGISTROS_POR_PAGINA_A4);
  const paginas: PaginaImpressaoA4[] = [];

  for (let paginaAtual = 1; paginaAtual <= totalPaginas; paginaAtual += 1) {
    const inicioIndice = (paginaAtual - 1) * REGISTROS_POR_PAGINA_A4;
    const fatiaAlunos = lista.alunos.slice(inicioIndice, inicioIndice + REGISTROS_POR_PAGINA_A4);
    const registroInicial = formatarNumeroRegistro(inicioIndice + 1);
    const registroFinal = formatarNumeroRegistro(inicioIndice + fatiaAlunos.length);

    const linhas: LinhaImpressaoA4[] = fatiaAlunos.map((aluno, deslocamento) => ({
      numero: formatarNumeroRegistro(inicioIndice + deslocamento + 1),
      nome: aluno.nome,
      trajeto: aluno.trajetoFormatado,
      preenchido: true,
    }));

    paginas.push({
      numeroPagina: paginaAtual,
      totalPaginas,
      registroInicial,
      registroFinal,
      tituloSecao: `Relação de passageiros • registros ${registroInicial} a ${registroFinal}`,
      rodapePagina: `Página ${paginaAtual} de ${totalPaginas}`,
      linhas,
    });
  }

  return {
    titulo: TITULO_IMPRESSAO_A4,
    subtitulo: SUBTITULO_IMPRESSAO_A4,
    emitidoPorLabel,
    dataViagem: lista.dataOperacao,
    rotaNome: lista.rotaNome,
    totalAlunos: lista.alunos.length,
    rodapeInstitucional: RODAPE_INSTITUCIONAL_A4,
    paginas,
  };
}

function renderizarLogoSvg(): string {
  return `
    <div class="logo-box" aria-hidden="true">
      <svg width="44" height="44" viewBox="52 4 92 91.3569" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M118.24 4H77.76C63.5331 4 52 15.4525 52 29.5799V69.777C52 83.9044 63.5331 95.3569 77.76 95.3569H118.24C132.467 95.3569 144 83.9044 144 69.777V29.5799C144 15.4525 132.467 4 118.24 4Z" fill="#1D4E89"/>
        <path d="M111.558 34.8164H84.4458C79.2631 34.8164 75.0618 38.9885 75.0618 44.1349V53.4532C75.0618 58.5997 79.2631 62.7716 84.4458 62.7716H111.558C116.741 62.7716 120.942 58.5997 120.942 53.4532V44.1349C120.942 38.9885 116.741 34.8164 111.558 34.8164Z" fill="#F3F5F7"/>
        <path d="M86.6299 39.9937H82.7751C81.3931 39.9937 80.2727 41.1062 80.2727 42.4785V46.8271C80.2727 48.1995 81.3931 49.312 82.7751 49.312H86.6299C88.0119 49.312 89.1323 48.1995 89.1323 46.8271V42.4785C89.1323 41.1062 88.0119 39.9937 86.6299 39.9937Z" fill="#1D4E89"/>
        <path d="M99.354 39.9937H95.4992C94.1172 39.9937 92.9968 41.1062 92.9968 42.4785V46.8271C92.9968 48.1995 94.1172 49.312 95.4992 49.312H99.354C100.736 49.312 101.856 48.1995 101.856 46.8271V42.4785C101.856 41.1062 100.736 39.9937 99.354 39.9937Z" fill="#1D4E89"/>
        <path d="M112.078 39.9937H108.223C106.841 39.9937 105.721 41.1062 105.721 42.4785V46.8271C105.721 48.1995 106.841 49.312 108.223 49.312H112.078C113.46 49.312 114.581 48.1995 114.581 46.8271V42.4785C114.581 41.1062 113.46 39.9937 112.078 39.9937Z" fill="#1D4E89"/>
        <path d="M85.4894 68.1515C88.4821 68.1515 90.9081 65.7424 90.9081 62.7706C90.9081 59.7988 88.4821 57.3896 85.4894 57.3896C82.4966 57.3896 80.0706 59.7988 80.0706 62.7706C80.0706 65.7424 82.4966 68.1515 85.4894 68.1515Z" fill="#1D4E89"/>
        <path d="M110.511 68.1515C113.504 68.1515 115.93 65.7424 115.93 62.7706C115.93 59.7988 113.504 57.3896 110.511 57.3896C107.518 57.3896 105.092 59.7988 105.092 62.7706C105.092 65.7424 107.518 68.1515 110.511 68.1515Z" fill="#1D4E89"/>
        <path d="M129.741 27.7514C134.06 27.7514 137.561 24.2747 137.561 19.986C137.561 15.6974 134.06 12.2207 129.741 12.2207C125.422 12.2207 121.921 15.6974 121.921 19.986C121.921 24.2747 125.422 27.7514 129.741 27.7514Z" fill="#E8912D"/>
      </svg>
    </div>
  `;
}

function renderizarPaginaHtml(documento: DocumentoImpressaoA4, pagina: PaginaImpressaoA4): string {
  const linhasHtml = pagina.linhas
    .map(
      (linha) => `
        <tr class="${linha.preenchido ? 'linha-preenchida' : 'linha-vazia'}">
          <td class="col-numero">${escaparHtml(linha.numero)}</td>
          <td class="col-aluno">${escaparHtml(linha.nome)}</td>
          <td class="col-trajeto">${escaparHtml(linha.trajeto)}</td>
        </tr>
      `
    )
    .join('');

  return `
    <section class="pagina-a4">
      <header class="cabecalho">
        <div class="cabecalho-esquerda">
          ${renderizarLogoSvg()}
          <div>
            <h1 class="titulo-doc">${escaparHtml(documento.titulo)}</h1>
            <p class="subtitulo-doc">${escaparHtml(documento.subtitulo)}</p>
          </div>
        </div>
        <div class="cabecalho-direita">
          <p>Emitido por: <strong>${escaparHtml(documento.emitidoPorLabel)}</strong></p>
          <p>Data da viagem: ${escaparHtml(documento.dataViagem)}</p>
        </div>
      </header>

      <div class="divisor"></div>

      <div class="resumo-rota">
        <div>
          <span class="rotulo-meta">Rota</span>
          <strong class="valor-meta">${escaparHtml(documento.rotaNome)}</strong>
        </div>
        <div class="resumo-direita">
          <span class="rotulo-meta">Alunos alocados</span>
          <strong class="valor-meta">${escaparHtml(String(documento.totalAlunos))}</strong>
        </div>
      </div>

      <h2 class="titulo-secao">${escaparHtml(pagina.tituloSecao)}</h2>

      <div class="tabela-wrapper">
        <table class="tabela-passageiros">
          <thead>
            <tr>
              <th class="col-numero">Nº</th>
              <th class="col-aluno">Aluno</th>
              <th class="col-trajeto">Trajeto programado</th>
            </tr>
          </thead>
          <tbody>
            ${linhasHtml}
          </tbody>
        </table>
      </div>

      <footer class="rodape">
        <span>${escaparHtml(documento.rodapeInstitucional)}</span>
        <span>${escaparHtml(pagina.rodapePagina)}</span>
      </footer>
    </section>
  `;
}

/**
 * Gera o documento HTML completo pronto para impressão em formato A4 (retrato).
 */
export function gerarHtmlImpressaoA4(
  lista: ListaEmbarqueRota,
  opcoes?: OpcoesImpressaoListaEmbarque
): string {
  const documento = gerarPaginasImpressaoA4(lista, opcoes);
  const paginasHtml = documento.paginas
    .map((pagina) => renderizarPaginaHtml(documento, pagina))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>${escaparHtml(documento.titulo)} - ${escaparHtml(documento.rotaNome)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #1E293B;
      background-color: #FFFFFF;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .pagina-a4 {
      width: 100%;
      min-height: 268mm;
      display: flex;
      flex-direction: column;
      page-break-after: always;
      break-after: page;
    }

    .pagina-a4:last-child {
      page-break-after: auto;
      break-after: auto;
    }

    .cabecalho {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    .cabecalho-esquerda {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-box {
      line-height: 0;
    }

    .titulo-doc {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #3E5F90;
    }

    .subtitulo-doc {
      margin: 2px 0 0;
      font-size: 10.5px;
      color: #64748B;
    }

    .cabecalho-direita {
      text-align: right;
      font-size: 10px;
      color: #64748B;
      line-height: 1.5;
    }

    .cabecalho-direita p {
      margin: 0;
    }

    .cabecalho-direita strong {
      color: #334155;
    }

    .divisor {
      border-top: 1px solid #CBD5E1;
      margin: 10px 0 12px;
    }

    .resumo-rota {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 14px;
    }

    .resumo-direita {
      text-align: right;
    }

    .rotulo-meta {
      display: block;
      font-size: 10px;
      color: #64748B;
      margin-bottom: 3px;
    }

    .valor-meta {
      font-size: 12.5px;
      font-weight: 700;
      color: #3E5F90;
    }

    .titulo-secao {
      margin: 0 0 8px;
      font-size: 12px;
      font-weight: 700;
      color: #3E5F90;
    }

    .tabela-wrapper {
      border: 1px solid #CBD5E1;
      border-radius: 6px;
      overflow: hidden;
    }

    .tabela-passageiros {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5px;
    }

    .tabela-passageiros th {
      background-color: #F4F7FC;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid #CBD5E1;
    }

    .tabela-passageiros td {
      padding: 4.5px 8px;
      border-bottom: 1px solid #E2E8F0;
      height: 20px;
      color: #0F172A;
    }

    .tabela-passageiros tbody tr:last-child td {
      border-bottom: none;
    }

    .col-numero {
      width: 38px;
      color: #475569;
    }

    .col-aluno {
      width: 34%;
    }

    .col-trajeto {
      width: auto;
    }

    .rodape {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid #CBD5E1;
      display: flex;
      justify-content: space-between;
      font-size: 9.5px;
      color: #64748B;
    }
  </style>
</head>
<body>
  ${paginasHtml}
</body>
</html>`;
}

/**
 * Gera resumo textual estruturado para compartilhamento rápido em dispositivos móveis.
 */
export function gerarResumoTextoImpressao(
  lista: ListaEmbarqueRota,
  opcoes?: OpcoesImpressaoListaEmbarque
): string {
  const documento = gerarPaginasImpressaoA4(lista, opcoes);

  const linhasAlunos = lista.alunos.map(
    (aluno, indice) =>
      `${formatarNumeroRegistro(indice + 1)}. ${aluno.nome} — ${aluno.trajetoFormatado}`
  );

  return [
    `${documento.titulo} — GOUOCE`,
    `Rota: ${documento.rotaNome}`,
    `Data da viagem: ${documento.dataViagem}`,
    `Emitido por: ${documento.emitidoPorLabel}`,
    `Alunos alocados: ${documento.totalAlunos}`,
    '',
    ...linhasAlunos,
  ].join('\n');
}

const IFRAME_IMPRESSAO_ID = 'gouoce-print-frame';

function imprimirViaIframeOculto(html: string): boolean {
  if (
    typeof document === 'undefined' ||
    !document.body ||
    typeof document.createElement !== 'function'
  ) {
    return false;
  }

  const iframeAnterior =
    typeof document.getElementById === 'function'
      ? document.getElementById(IFRAME_IMPRESSAO_ID)
      : null;
  iframeAnterior?.parentNode?.removeChild(iframeAnterior);

  const iframe = document.createElement('iframe');
  iframe.id = IFRAME_IMPRESSAO_ID;
  iframe.setAttribute?.('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const iframeWindow = iframe.contentWindow;
  const iframeDoc = iframeWindow?.document ?? iframe.contentDocument;

  if (!iframeWindow || !iframeDoc) {
    iframe.parentNode?.removeChild(iframe);
    return false;
  }

  let removido = false;
  const removerIframe = () => {
    if (removido) return;
    removido = true;
    window.removeEventListener?.('afterprint', removerIframe);
    iframeWindow.removeEventListener?.('afterprint', removerIframe);
    iframe.parentNode?.removeChild(iframe);
  };

  iframeWindow.onafterprint = removerIframe;
  iframeWindow.addEventListener?.('afterprint', removerIframe);
  window.addEventListener?.('afterprint', removerIframe);

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();
  iframeWindow.focus?.();
  iframeWindow.print?.();

  return true;
}

/**
 * Aciona a impressão em formato A4 (na Web) ou o compartilhamento da relação (no Mobile).
 */
export async function imprimirListaEmbarque(
  lista: ListaEmbarqueRota,
  opcoes?: OpcoesImpressaoListaEmbarque
): Promise<ResultadoImpressaoListaEmbarque> {
  const documento = gerarPaginasImpressaoA4(lista, opcoes);
  const html = gerarHtmlImpressaoA4(lista, opcoes);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const imprimiuViaIframe = imprimirViaIframeOculto(html);

    if (!imprimiuViaIframe) {
      const janela =
        typeof window.open === 'function'
          ? window.open('', '_blank', 'width=900,height=1100')
          : null;

      if (janela?.document) {
        const fecharJanela = () => janela.close?.();
        janela.onafterprint = fecharJanela;
        janela.addEventListener?.('afterprint', fecharJanela);
        janela.document.open();
        janela.document.write(html);
        janela.document.close();
        janela.focus?.();
        janela.print?.();
      } else if (typeof window.print === 'function') {
        window.print();
      }
    }

    return {
      metodo: 'web-print',
      html,
      documento,
    };
  }

  const message = gerarResumoTextoImpressao(lista, opcoes);
  await Share.share({
    title: `${documento.titulo} - ${documento.rotaNome}`,
    message,
  });

  return {
    metodo: 'native-share',
    html,
    documento,
  };
}
