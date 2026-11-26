import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppPopup, type PopupType } from '@/components/ui/AppPopup';
import {
  baixarBlob,
  relatorioService,
  type RelatorioResultado,
} from '@/services/relatorioService';
import { lightColors } from '@/theme/colors';

const colors = {
  primary: lightColors.primary,
  primaryContainer: lightColors.primaryContainer,
  surface: lightColors.surface,
  background: lightColors.background,
  text: lightColors.onSurface,
  textMuted: lightColors.onSurfaceVariant,
  border: lightColors.outlineVariant,
  danger: lightColors.error,
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
const radii = { md: 12 };

function textoParam(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor;
}

export default function RelatorioResultadoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [relatorio, setRelatorio] = useState<RelatorioResultado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [exportando, setExportando] = useState<'pdf' | 'csv' | null>(null);
  const [popup, setPopup] = useState<{
    tipo: PopupType;
    titulo: string;
    mensagem: string;
  } | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const tipo = textoParam(params.tipo) === 'motoristas' ? 'motoristas' : 'agendamentos';
  const dataInicial = textoParam(params.dataInicial);
  const dataFinal = textoParam(params.dataFinal);
  const faculdadeId = textoParam(params.faculdadeId);
  const bairroId = textoParam(params.bairroId);

  useFocusEffect(
    useCallback(() => {
      void tentativa;
      let ativo = true;

      async function carregar() {
        if (!dataInicial || !dataFinal) {
          setErro('Período não informado. Volte e informe as datas do relatório.');
          setCarregando(false);
          return;
        }

        setCarregando(true);
        setErro(null);
        try {
          const resultado = await relatorioService.gerarRelatorio({
            tipo,
            dataInicial,
            dataFinal,
            faculdadeId,
            bairroId,
          });
          if (!ativo) return;
          setRelatorio(resultado);
        } catch (error: any) {
          if (!ativo) return;
          const detail = error?.response?.data?.detail;
          const mensagem = Array.isArray(detail)
            ? detail.map((item: any) => item?.msg ?? String(item)).join(' ')
            : detail ?? 'Não foi possível gerar o relatório.';
          setErro(String(mensagem));
        } finally {
          if (ativo) setCarregando(false);
        }
      }

      carregar();
      return () => {
        ativo = false;
      };
    }, [tipo, dataInicial, dataFinal, faculdadeId, bairroId, tentativa]),
  );

  async function exportar(formato: 'pdf' | 'csv') {
    if (!relatorio) return;
    setExportando(formato);
    try {
      const resultado = await relatorioService.exportarRelatorio(formato, relatorio);
      baixarBlob(resultado.blob, resultado.nomeArquivo);
      setPopup({
        tipo: 'success',
        titulo: 'Exportação concluída',
        mensagem: `${resultado.mensagem} Arquivo: ${resultado.nomeArquivo}.`,
      });
    } catch (error: any) {
      setPopup({
        tipo: 'error',
        titulo: 'Falha na exportação',
        mensagem: String(
          error?.response?.data?.detail ?? 'Não foi possível exportar o relatório.',
        ),
      });
    } finally {
      setExportando(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="voltar-filtros" accessibilityLabel="Voltar" onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTexto}>
          <Text style={styles.headerTitulo}>Resultado do relatório</Text>
          <Text style={styles.headerSubtitulo}>
            Consolidação oficial de agendamentos e presenças
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <View style={styles.carregando}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.carregandoTexto}>Gerando relatório...</Text>
          </View>
        ) : null}

        {erro ? (
          <View style={styles.card}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
            <Text style={styles.erroTitulo}>Não foi possível gerar o relatório</Text>
            <Text style={styles.erroTexto}>{erro}</Text>
            <Pressable testID="tentar-novamente" style={styles.botaoSecundario} onPress={() => setTentativa((valor) => valor + 1)}>
              <Text style={styles.botaoSecundarioTexto}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {relatorio && !carregando && !erro ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>{relatorio.filtrosResumo.tipoLabel}</Text>
              <Text style={styles.cardSubtitulo}>{relatorio.filtrosResumo.periodoLabel}</Text>
              <View style={styles.chips}>
                <Text style={styles.chip}>{relatorio.filtrosResumo.faculdadeLabel}</Text>
                <Text style={styles.chip}>{relatorio.filtrosResumo.bairroLabel}</Text>
              </View>
            </View>

            {relatorio.mensagem ? (
              <View style={styles.cardVazio}>
                <Ionicons name="document-outline" size={32} color={colors.textMuted} />
                <Text style={styles.mensagemVazia}>{relatorio.mensagem}</Text>
              </View>
            ) : (
              <>
                <View style={styles.grid}>
                  <View style={styles.metrica}>
                    <Text style={styles.metricaValor}>
                      {relatorio.consolidado.totalAgendamentos}
                    </Text>
                    <Text style={styles.metricaLabel}>Agendamentos</Text>
                  </View>
                  <View style={styles.metrica}>
                    <Text style={styles.metricaValor}>
                      {relatorio.consolidado.totalEmbarques}
                    </Text>
                    <Text style={styles.metricaLabel}>Embarques efetivos</Text>
                  </View>
                  <View style={styles.metrica}>
                    <Text style={styles.metricaValor}>
                      {relatorio.consolidado.taxaComparecimento}
                    </Text>
                    <Text style={styles.metricaLabel}>Comparecimento</Text>
                  </View>
                  <View style={styles.metrica}>
                    <Text style={styles.metricaValor}>
                      {relatorio.consolidado.totalFaltas}
                    </Text>
                    <Text style={styles.metricaLabel}>Faltas</Text>
                  </View>
                  <View style={styles.metrica}>
                    <Text style={styles.metricaValor}>
                      {relatorio.consolidado.porcentagemFaltas}
                    </Text>
                    <Text style={styles.metricaLabel}>% de faltas</Text>
                  </View>
                  <View style={styles.metrica}>
                    <Text style={styles.metricaValor}>
                      {relatorio.consolidado.rotaMaiorDemanda}
                    </Text>
                    <Text style={styles.metricaLabel}>Maior demanda</Text>
                  </View>
                </View>

                {relatorio.detalhamento.length > 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitulo}>Agendados × embarques por dia/rota</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View style={styles.tabela}>
                        <View style={[styles.linha, styles.linhaCabecalho]}>
                          {[
                            'Data',
                            'Rota',
                            'Turno',
                            'Faculdade',
                            'Localidade',
                            'Agend.',
                            'Embarq.',
                            'Faltas',
                            '% Pres.',
                            '% Faltas',
                          ].map((cabecalho) => (
                            <Text key={cabecalho} style={styles.celulaCabecalho}>
                              {cabecalho}
                            </Text>
                          ))}
                        </View>
                        {relatorio.detalhamento.map((item, indice) => (
                          <View key={`${item.data}-${item.linhaNome}-${indice}`} style={styles.linha}>
                            <Text style={styles.celula}>{item.data}</Text>
                            <Text style={[styles.celula, styles.celulaLarga]}>{item.linhaNome}</Text>
                            <Text style={styles.celula}>{item.turno || '-'}</Text>
                            <Text style={[styles.celula, styles.celulaLarga]}>{item.faculdadeDestino}</Text>
                            <Text style={styles.celula}>{item.localidade}</Text>
                            <Text style={styles.celula}>{item.agendados}</Text>
                            <Text style={styles.celula}>{item.embarquesEfetivos}</Text>
                            <Text style={styles.celula}>{item.faltas}</Text>
                            <Text style={styles.celula}>{item.taxaPresenca}</Text>
                            <Text style={styles.celula}>{item.porcentagemFaltas}</Text>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                ) : null}

                {relatorio.motoristas.length > 0 ? (
                  <View style={styles.card}>
                    <Text style={styles.cardTitulo}>Escalas dos motoristas</Text>
                    {relatorio.motoristas.map((motorista, indice) => (
                      <View key={`${motorista.nome}-${indice}`} style={styles.motorista}>
                        <Text style={styles.motoristaNome}>
                          {motorista.nome}
                          {motorista.ativo ? '' : ' (Inativo)'}
                        </Text>
                        <Text style={styles.motoristaLinha}>
                          Dias trabalhados: {motorista.diasTrabalhados}
                        </Text>
                        <Text style={styles.motoristaLinha}>
                          Rotas: {motorista.rotasAlocadas}
                        </Text>
                        <Text style={styles.motoristaLinha}>
                          Escalas: {motorista.escalaResumo}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={styles.exportacoes}>
                  <Text style={styles.exportacoesTitulo}>Exportar relatório</Text>
                  <Text style={styles.exportacoesTexto}>
                    O arquivo inclui os mesmos filtros, totais e detalhamentos exibidos acima.
                  </Text>
                  <View style={styles.exportacoesBotoes}>
                    <Pressable
                      testID="exportar-pdf"
                      accessibilityRole="button"
                      accessibilityLabel="Exportar PDF"
                      onPress={() => exportar('pdf')}
                      disabled={exportando !== null}
                      style={styles.botaoPrimario}
                    >
                      {exportando === 'pdf' ? (
                        <ActivityIndicator size="small" color={colors.surface} />
                      ) : (
                        <Ionicons name="document-text-outline" size={18} color={colors.surface} />
                      )}
                      <Text style={styles.botaoPrimarioTexto}>PDF</Text>
                    </Pressable>
                    <Pressable
                      testID="exportar-csv"
                      accessibilityRole="button"
                      accessibilityLabel="Exportar planilha CSV"
                      onPress={() => exportar('csv')}
                      disabled={exportando !== null}
                      style={styles.botaoSecundario}
                    >
                      {exportando === 'csv' ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Ionicons name="grid-outline" size={18} color={colors.primary} />
                      )}
                      <Text style={styles.botaoSecundarioTexto}>Planilha CSV</Text>
                    </Pressable>
                  </View>
                </View>
              </>
            )}
          </>
        ) : null}
      </ScrollView>

      {popup ? (
        <AppPopup
          visible
          type={popup.tipo}
          title={popup.titulo}
          message={popup.mensagem}
          onDismiss={() => setPopup(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTexto: { flex: 1 },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSubtitulo: { fontSize: 13, color: colors.textMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  carregando: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  carregandoTexto: { color: colors.textMuted, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardSubtitulo: { fontSize: 14, color: colors.textMuted },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    backgroundColor: colors.primaryContainer,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 12,
    color: colors.text,
  },
  cardVazio: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  mensagemVazia: { fontSize: 15, fontWeight: '600', color: colors.textMuted, textAlign: 'center' },
  erroTitulo: { fontSize: 16, fontWeight: '700', color: colors.danger, marginTop: spacing.xs },
  erroTexto: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metrica: {
    width: '30%',
    minWidth: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricaValor: { fontSize: 18, fontWeight: '700', color: colors.primary },
  metricaLabel: { fontSize: 12, color: colors.textMuted },
  tabela: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  linha: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  linhaCabecalho: { backgroundColor: colors.primaryContainer },
  celula: { minWidth: 80, padding: spacing.sm, fontSize: 12, color: colors.text },
  celulaLarga: { minWidth: 160 },
  celulaCabecalho: { minWidth: 80, padding: spacing.sm, fontSize: 12, fontWeight: '700', color: colors.text },
  motorista: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, gap: 2 },
  motoristaNome: { fontSize: 15, fontWeight: '700', color: colors.text },
  motoristaLinha: { fontSize: 13, color: colors.textMuted },
  exportacoes: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  exportacoesTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  exportacoesTexto: { fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  exportacoesBotoes: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  botaoPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  botaoPrimarioTexto: { color: colors.surface, fontWeight: '700', fontSize: 14 },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  botaoSecundarioTexto: { color: colors.primary, fontWeight: '700', fontSize: 14 },
});
