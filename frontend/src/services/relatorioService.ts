import { api } from '@/api/api';

export interface OpcaoSelect {
  label: string;
  value: string;
}

export interface FiltrosRelatorioPayload {
  tipo: 'agendamentos' | 'motoristas';
  dataInicial: string;
  dataFinal: string;
  faculdadeId?: string;
  bairroId?: string;
}

export interface DetalheTabelaRelatorio {
  data: string;
  linhaNome: string;
  faculdadeDestino: string;
  localidade: string;
  turno: string;
  agendados: number;
  embarquesEfetivos: number;
  faltas: number;
  taxaPresenca: string;
  porcentagemFaltas: string;
}

export interface EscalaMotoristaRelatorio {
  data: string;
  rota: string;
  turno: string;
}

export interface MotoristaRelatorioItem {
  nome: string;
  diasTrabalhados: number;
  rotasAlocadas: string;
  escalaResumo: string;
  ativo: boolean;
  escalas: EscalaMotoristaRelatorio[];
}

export interface RelatorioResultado {
  tipo: string;
  mensagem: string | null;
  filtrosResumo: {
    tipoLabel: string;
    periodoLabel: string;
    faculdadeLabel: string;
    bairroLabel: string;
  };
  consolidado: {
    totalAgendamentos: number;
    totalEmbarques: number;
    taxaComparecimento: string;
    totalFaltas: number;
    porcentagemFaltas: string;
    rotaMaiorDemanda: string;
  };
  motoristas: MotoristaRelatorioItem[];
  detalhamento: DetalheTabelaRelatorio[];
}

export interface ResultadoExportacaoRelatorio {
  blob: Blob;
  nomeArquivo: string;
  mensagem: string;
}

function texto(valor: unknown, padrao = '-'): string {
  if (valor === null || valor === undefined || valor === '') return padrao;
  return String(valor);
}

function numero(valor: unknown): number {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : 0;
}

function mapearRelatorio(dados: any): RelatorioResultado {
  const filtros = dados?.filtrosResumo ?? dados?.filtros_resumo ?? {};
  const consolidado = dados?.consolidado ?? {};
  const detalhamento = Array.isArray(dados?.detalhamento) ? dados.detalhamento : [];
  const motoristas = Array.isArray(dados?.motoristas) ? dados.motoristas : [];

  return {
    tipo: texto(dados?.tipo, 'agendamentos'),
    mensagem: dados?.mensagem ?? null,
    filtrosResumo: {
      tipoLabel: texto(filtros.tipoLabel ?? filtros.tipo_label, 'Relatório'),
      periodoLabel: texto(filtros.periodoLabel ?? filtros.periodo_label),
      faculdadeLabel: texto(
        filtros.faculdadeLabel ?? filtros.faculdade_label,
        'Todas as faculdades',
      ),
      bairroLabel: texto(filtros.bairroLabel ?? filtros.bairro_label, 'Todos os bairros'),
    },
    consolidado: {
      totalAgendamentos: numero(
        consolidado.totalAgendamentos ?? consolidado.total_agendamentos,
      ),
      totalEmbarques: numero(consolidado.totalEmbarques ?? consolidado.total_embarques),
      taxaComparecimento: texto(
        consolidado.comparecimento ?? consolidado.taxaComparecimento,
        '0,0%',
      ),
      totalFaltas: numero(consolidado.totalFaltas ?? consolidado.total_faltas),
      porcentagemFaltas: texto(
        consolidado.porcentagemFaltas ?? consolidado.porcentagem_faltas,
        '0,0%',
      ),
      rotaMaiorDemanda: texto(
        consolidado.rotaMaiorDemanda ?? consolidado.rota_maior_demanda,
      ),
    },
    detalhamento: detalhamento.map((item: any) => ({
      data: texto(item?.data),
      linhaNome: texto(item?.rota ?? item?.linhaNome),
      faculdadeDestino: texto(item?.faculdade ?? item?.faculdadeDestino),
      localidade: texto(item?.bairro ?? item?.localidade),
      turno: texto(item?.turno),
      agendados: numero(item?.agendados),
      embarquesEfetivos: numero(item?.embarques ?? item?.embarquesEfetivos),
      faltas: numero(item?.faltas),
      taxaPresenca: texto(item?.comparecimento ?? item?.taxaPresenca, '0,0%'),
      porcentagemFaltas: texto(item?.porcentagemFaltas, '0,0%'),
    })),
    motoristas: motoristas.map((item: any) => {
      const escalas = Array.isArray(item?.escalas)
        ? item.escalas.map((escala: any) => ({
            data: texto(escala?.data),
            rota: texto(escala?.rota),
            turno: texto(escala?.turno),
          }))
        : [];

      return {
        nome: texto(item?.nome),
        diasTrabalhados: numero(item?.diasTrabalhados ?? item?.dias_trabalhados),
        rotasAlocadas: Array.isArray(item?.rotas)
          ? item.rotas.join(', ') || '-'
          : texto(item?.rotasAlocadas),
        escalaResumo:
          escalas
            .map((escala: EscalaMotoristaRelatorio) =>
              `${escala.data} - ${escala.rota} (${escala.turno})`,
            )
            .join(' • ') || texto(item?.escalaResumo),
        ativo: item?.ativo ?? true,
        escalas,
      };
    }),
  };
}

export const relatorioService = {
  async gerarRelatorio(payload: FiltrosRelatorioPayload): Promise<RelatorioResultado> {
    const queryParams = new URLSearchParams({
      tipo: payload.tipo,
      data_inicio: payload.dataInicial,
      data_fim: payload.dataFinal,
      ...(payload.faculdadeId && payload.faculdadeId !== 'todas'
        ? { faculdade_id: payload.faculdadeId }
        : {}),
      ...(payload.bairroId && payload.bairroId !== 'todos'
        ? { bairro_id: payload.bairroId }
        : {}),
    }).toString();

    const response = await api.get(`/transporte/relatorios?${queryParams}`);
    return mapearRelatorio(response.data);
  },

  async exportarRelatorio(
    formato: 'pdf' | 'csv',
    relatorio: RelatorioResultado,
  ): Promise<ResultadoExportacaoRelatorio> {
    const response = await api.post(
      `/transporte/relatorios/exportar?formato=${formato}`,
      relatorio,
      { responseType: 'arraybuffer' },
    );

    const cabecalho = String(
      response.headers?.['content-disposition'] ?? '',
    );
    const nomeArquivo =
      cabecalho.match(/filename="?([^";]+)"?/i)?.[1] ?? `relatorio.${formato}`;
    const tipoMidia =
      formato === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8';

    return {
      blob: new Blob([response.data], { type: tipoMidia }),
      nomeArquivo,
      mensagem:
        response.headers?.['x-mensagem-relatorio'] ??
        `Relatório exportado em ${formato.toUpperCase()} com sucesso!`,
    };
  },
};

export function baixarBlob(blob: Blob, nomeArquivo: string): void {
  if (typeof document === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
