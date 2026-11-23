import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Text, Button, Surface, RadioButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Printer } from 'lucide-react-native';

import { relatorioService, RelatorioResultado } from '@/services/relatorioService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function ResultadoRelatorioScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tipo?: string;
    dataInicial?: string;
    dataFinal?: string;
    faculdadeId?: string;
    bairroId?: string;
  }>();

  const [relatorio, setRelatorio] = useState<RelatorioResultado | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal de Exportação
  const [modalExportarVisible, setModalExportarVisible] = useState(false);
  const [formatoExportacao, setFormatoExportacao] = useState<'pdf' | 'csv'>('pdf');

  // AppPopup de Feedback
  const [popupFeedback, setPopupFeedback] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      setLoading(true);
      try {
        const res = await relatorioService.gerarRelatorio({
          tipo: params.tipo || 'geral',
          dataInicial: params.dataInicial || '2026-09-01',
          dataFinal: params.dataFinal || '2026-10-20',
          faculdadeId: params.faculdadeId,
          bairroId: params.bairroId,
        });
        if (ativo) {
          setRelatorio(res);
        }
      } catch {
        if (ativo) {
          setRelatorio(null);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [params.tipo, params.dataInicial, params.dataFinal, params.faculdadeId, params.bairroId]);

  const semResultados = !relatorio || (relatorio.detalhamento.length === 0 && relatorio.consolidado.totalAgendamentos === 0);

  const handleConfirmarExportacao = async () => {
    setModalExportarVisible(false);
    if (!relatorio) return;

    try {
      const res = await relatorioService.exportarRelatorio(formatoExportacao, relatorio);
      setPopupFeedback({
        visible: true,
        type: 'success',
        title: 'Exportação Concluída',
        message: res.mensagem || `Relatório exportado em ${formatoExportacao.toUpperCase()} com sucesso!`,
      });
    } catch {
      setPopupFeedback({
        visible: true,
        type: 'error',
        title: 'Erro na Exportação',
        message: 'Não foi possível exportar o relatório. Tente novamente.',
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Resultados</Text>
      </View>

      {/* Pop-up de Exportação */}
      <Modal visible={modalExportarVisible} transparent animationType="fade" onRequestClose={() => setModalExportarVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalExportarVisible(false)}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleLarge" style={styles.modalExportTitle}>Exportar Relatório</Text>
            <Text variant="bodyMedium" style={styles.modalExportSub}>
              Selecione o formato de exportação do relatório
            </Text>

            <RadioButton.Group
              onValueChange={(value) => setFormatoExportacao(value as 'pdf' | 'csv')}
              value={formatoExportacao}
            >
              <TouchableOpacity style={styles.radioRow} onPress={() => setFormatoExportacao('pdf')}>
                <RadioButton value="pdf" color="#3E5F90" />
                <Text style={styles.radioLabel}>PDF</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.radioRow} onPress={() => setFormatoExportacao('csv')}>
                <RadioButton value="csv" color="#3E5F90" />
                <Text style={styles.radioLabel}>Planilha (.csv)</Text>
              </TouchableOpacity>
            </RadioButton.Group>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={() => setModalExportarVisible(false)}>
                <Text style={styles.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmarExportacao}>
                <Text style={styles.btnConfirmText}>Exportar</Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </TouchableOpacity>
      </Modal>

      {/* Pop-up de Feedback */}
      <AppPopup
        visible={popupFeedback.visible}
        type={popupFeedback.type}
        title={popupFeedback.title}
        message={popupFeedback.message}
        confirmText="Entendido"
        onConfirm={() => setPopupFeedback(prev => ({ ...prev, visible: false }))}
        onDismiss={() => setPopupFeedback(prev => ({ ...prev, visible: false }))}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Chips dos Filtros Selecionados */}
        <View style={styles.chipsRow}>
          <Surface style={styles.chip} elevation={0}>
            <Text style={styles.chipText}>{relatorio?.filtrosResumo.tipoLabel || 'Geral'}</Text>
          </Surface>
          <Surface style={styles.chip} elevation={0}>
            <Text style={styles.chipText}>{relatorio?.filtrosResumo.periodoLabel || '01/09/2026 a 20/10/2026'}</Text>
          </Surface>
          <Surface style={styles.chip} elevation={0}>
            <Text style={styles.chipText}>{relatorio?.filtrosResumo.faculdadeLabel || 'Todas as faculdades'}</Text>
          </Surface>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3E5F90" />
          </View>
        ) : semResultados ? (
          /* FA-001 (AC-04): Filtro sem Resultados */
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Nenhum dado encontrado para os filtros informados.
            </Text>
          </View>
        ) : (
          <View style={styles.resultsContent}>
            {/* Seção Resultado Geral */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Resultado geral</Text>
            <Surface style={styles.consolidadoCard} elevation={0}>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.cardLabel}>Agendamentos</Text>
                  <Text style={styles.cardValue}>{relatorio?.consolidado.totalAgendamentos}</Text>
                </View>

                <View style={styles.gridCol}>
                  <Text style={styles.cardLabel}>Embarques</Text>
                  <Text style={styles.cardValue}>
                    {relatorio?.consolidado.totalEmbarques} ({relatorio?.consolidado.taxaComparecimento})
                  </Text>
                </View>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.cardLabel}>Faltas registradas</Text>
                  <Text style={[styles.cardValue, { color: '#B00020' }]}>
                    {relatorio?.consolidado.totalFaltas} ({relatorio?.consolidado.porcentagemFaltas})
                  </Text>
                </View>

                <View style={styles.gridCol}>
                  <Text style={styles.cardLabel}>Rota com maior demanda</Text>
                  <Text style={styles.cardValue}>{relatorio?.consolidado.rotaMaiorDemanda}</Text>
                </View>
              </View>
            </Surface>

            {/* Seção Dias Trabalhados por Motorista (AC-07 / AC-08) */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Dias trabalhados por motorista</Text>
            <Surface style={styles.motoristasCard} elevation={0}>
              {relatorio?.motoristas.map((mot, idx) => (
                <View key={idx} style={[styles.motoristaRow, idx > 0 && styles.rowBorder]}>
                  <Text style={styles.motNome}>{mot.nome}</Text>
                  <Text style={styles.motSub}>
                    {mot.diasTrabalhados} dias • {mot.rotasAlocadas}
                  </Text>
                </View>
              ))}
            </Surface>

            {/* Tabela de Detalhamento por Dia */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Detalhamento por Dia, Rota e Localidade</Text>
            <Surface style={styles.tableCard} elevation={0}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.th, { flex: 1.2 }]}>Data</Text>
                <Text style={[styles.th, { flex: 2 }]}>Rota / Localidade</Text>
                <Text style={[styles.th, { flex: 1 }]}>Agend.</Text>
                <Text style={[styles.th, { flex: 1 }]}>Emb.</Text>
                <Text style={[styles.th, { flex: 1 }]}>Taxa</Text>
              </View>

              {relatorio?.detalhamento.map((item, idx) => (
                <View key={idx} style={styles.tableBodyRow}>
                  <Text style={[styles.td, { flex: 1.2 }]}>{item.data}</Text>
                  <Text style={[styles.tdBold, { flex: 2 }]} numberOfLines={1}>{item.linhaNome}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{item.agendados}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{item.embarquesEfetivos}</Text>
                  <Text style={[styles.tdBold, { flex: 1, color: '#00639A' }]}>{item.taxaPresenca}</Text>
                </View>
              ))}
            </Surface>

            {/* Botão Exportar */}
            <View style={styles.exportContainer}>
              <Button
                mode="outlined"
                onPress={() => setModalExportarVisible(true)}
                style={styles.btnExportar}
                contentStyle={styles.btnContent}
                textColor="#00639A"
                icon={() => <Printer size={20} color="#00639A" />}
              >
                Exportar
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: '#DCE3F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    color: '#191C20',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: '#43474E',
    fontWeight: '500',
    fontSize: 16,
  },
  resultsContent: {
    gap: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginTop: 8,
  },
  consolidadoCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48%',
  },
  cardLabel: {
    fontSize: 12,
    color: '#74777F',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#191C20',
  },
  motoristasCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E2EC',
  },
  motoristaRow: {
    paddingVertical: 10,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E0E2EC',
  },
  motNome: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 15,
    marginBottom: 2,
  },
  motSub: {
    color: '#74777F',
    fontSize: 13,
  },
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E2EC',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#E0E2EC',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  th: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#191C20',
  },
  tableBodyRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  td: {
    fontSize: 13,
    color: '#43474E',
  },
  tdBold: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#191C20',
  },
  exportContainer: {
    marginTop: 16,
  },
  btnExportar: {
    borderRadius: 24,
    borderColor: '#00639A',
  },
  btnContent: {
    height: 52,
    flexDirection: 'row',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalExportTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 4,
  },
  modalExportSub: {
    color: '#74777F',
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#191C20',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 24,
  },
  btnCancelText: {
    color: '#00639A',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnConfirmText: {
    color: '#00639A',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
