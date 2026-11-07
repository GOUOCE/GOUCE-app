import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Surface, Snackbar, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, ChevronDown, Pencil, Trash2, X } from 'lucide-react-native';

import { agendamentoService, AgendamentoDia } from '@/services/agendamentoService';
import { AppPopup } from '@/components/ui/AppPopup';

interface DiaCalendario {
  diaNum: number;
  dataIso: string; // YYYY-MM-DD
  status: 'agendado' | 'indisponivel' | 'feriado' | 'normal';
  idAgendamento?: string | number;
  ehPassado?: boolean;
}

const AGENDAMENTOS_DEMO: AgendamentoDia[] = [
  { dataIso: '2026-08-31', usaIda: true, horarioIda: '05:30:00', usaVolta: true, horarioVolta: '17:00:00', idAgendamento: '1' },
  { dataIso: '2026-09-01', usaIda: true, horarioIda: '05:30:00', usaVolta: true, horarioVolta: '17:00:00', idAgendamento: '2' },
  { dataIso: '2026-09-02', usaIda: true, horarioIda: '05:30:00', usaVolta: true, horarioVolta: '17:00:00', idAgendamento: '3' },
  { dataIso: '2026-09-03', usaIda: true, horarioIda: '05:30:00', usaVolta: true, horarioVolta: '17:00:00', idAgendamento: '4' },
  { dataIso: '2026-09-04', usaIda: true, horarioIda: '05:30:00', usaVolta: true, horarioVolta: '17:00:00', idAgendamento: '5' },
];

const DIAS_DO_MES: DiaCalendario[] = [
  // Semana 1 (31/08 a 05/09)
  { diaNum: 31, dataIso: '2026-08-31', status: 'agendado', idAgendamento: '1' },
  { diaNum: 1, dataIso: '2026-09-01', status: 'agendado', idAgendamento: '2' },
  { diaNum: 2, dataIso: '2026-09-02', status: 'agendado', idAgendamento: '3' },
  { diaNum: 3, dataIso: '2026-09-03', status: 'agendado', idAgendamento: '4' },
  { diaNum: 4, dataIso: '2026-09-04', status: 'agendado', idAgendamento: '5' },
  { diaNum: 5, dataIso: '2026-09-05', status: 'indisponivel' },
  // Semana 2
  { diaNum: 6, dataIso: '2026-09-06', status: 'indisponivel' },
  { diaNum: 7, dataIso: '2026-09-07', status: 'feriado' },
  { diaNum: 8, dataIso: '2026-09-08', status: 'normal' },
  { diaNum: 9, dataIso: '2026-09-09', status: 'normal' },
  { diaNum: 10, dataIso: '2026-09-10', status: 'normal' },
  { diaNum: 11, dataIso: '2026-09-11', status: 'normal' },
  { diaNum: 12, dataIso: '2026-09-12', status: 'indisponivel' },
  // Semana 3
  { diaNum: 13, dataIso: '2026-09-13', status: 'indisponivel' },
  { diaNum: 14, dataIso: '2026-09-14', status: 'normal' },
  { diaNum: 15, dataIso: '2026-09-15', status: 'normal' },
  { diaNum: 16, dataIso: '2026-09-16', status: 'normal' },
  { diaNum: 17, dataIso: '2026-09-17', status: 'normal' },
  { diaNum: 18, dataIso: '2026-09-18', status: 'normal' },
  { diaNum: 19, dataIso: '2026-09-19', status: 'indisponivel' },
  // Semana 4
  { diaNum: 20, dataIso: '2026-09-20', status: 'indisponivel' },
  { diaNum: 21, dataIso: '2026-09-21', status: 'normal' },
  { diaNum: 22, dataIso: '2026-09-22', status: 'normal' },
  { diaNum: 23, dataIso: '2026-09-23', status: 'normal' },
  { diaNum: 24, dataIso: '2026-09-24', status: 'normal' },
  { diaNum: 25, dataIso: '2026-09-25', status: 'normal' },
  { diaNum: 26, dataIso: '2026-09-26', status: 'indisponivel' },
  // Semana 5
  { diaNum: 27, dataIso: '2026-09-27', status: 'indisponivel' },
  { diaNum: 28, dataIso: '2026-09-28', status: 'normal' },
  { diaNum: 29, dataIso: '2026-09-29', status: 'normal' },
  { diaNum: 30, dataIso: '2026-09-30', status: 'normal' },
  { diaNum: 31, dataIso: '2026-09-31', status: 'normal' },
];

export default function MeusAgendamentosScreen() {
  const router = useRouter();

  const [agendamentos, setAgendamentos] = useState<AgendamentoDia[]>([]);
  const [diaSelecionado, setDiaSelecionado] = useState<DiaCalendario | null>(null);

  // Modais de Ação e Confirmação
  const [menuOpcoesVisible, setMenuOpcoesVisible] = useState(false);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);

  // Snackbar Toast
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const carregarAgendamentos = useCallback(async () => {
    try {
      const lista = await agendamentoService.listarAgendamentosAtivos();
      setAgendamentos(lista || []);
    } catch {
      // Mantem lista inicial sem quebrar UI
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      carregarAgendamentos().then(() => {
        if (cancelado) return;
      });
      return () => {
        cancelado = true;
      };
    }, [carregarAgendamentos])
  );

  const datasAgendadasSet = new Set(agendamentos.map(a => a.dataIso));

  const handleSelecionarDia = (dia: DiaCalendario) => {
    if (datasAgendadasSet.has(dia.dataIso) || dia.status === 'agendado') {
      setDiaSelecionado(dia);
      setMenuOpcoesVisible(true);
    }
  };

  const handleVerDetalhes = () => {
    setMenuOpcoesVisible(false);
    setModalDetalhesVisible(true);
  };

  const handleEditar = () => {
    setMenuOpcoesVisible(false);
    if (diaSelecionado) {
      router.push({
        pathname: '/(aluno)/agendar-transporte/configurar',
        params: { datasIso: diaSelecionado.dataIso, modoEdicao: 'true' },
      } as any);
    }
  };

  const handleIniciarRemocao = () => {
    setMenuOpcoesVisible(false);
    setModalCancelarVisible(true);
  };

  const handleConfirmarCancelamento = async () => {
    setModalCancelarVisible(false);
    if (!diaSelecionado) return;

    try {
      await agendamentoService.cancelarAgendamento(diaSelecionado.idAgendamento || diaSelecionado.dataIso);
      setAgendamentos(agendamentos.filter(a => a.dataIso !== diaSelecionado.dataIso));
      setSnackbarMessage('Agendamento cancelado com sucesso');
      setSnackbarVisivel(true);
    } catch {
      // FA-004: Falha de comunicação mantém o agendamento ativo
      setSnackbarMessage('Não foi possível processar o cancelamento. Verifique sua conexão e tente novamente');
      setSnackbarVisivel(true);
    }
  };

  const semAgendamentosFuturos = agendamentos.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Título Principal */}
        <Text variant="headlineMedium" style={styles.mainTitle}>Meus agendamentos</Text>

        {semAgendamentosFuturos ? (
          /* FA-001: Estado Vazio */
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Você ainda não possui agendamentos futuros.
            </Text>
          </View>
        ) : (
          /* Conteúdo com Calendário e Agendamentos Ativos */
          <View style={styles.calendarSection}>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Selecione um dia no calendário para gerenciar suas viagens. É possível realizar novos agendamentos com até 30 dias de antecedência.
            </Text>

            {/* Contador de Agendamentos Ativos */}
            <Text variant="bodyMedium" style={styles.counterText}>
              {agendamentos.length} de 22 agendamentos ativos
            </Text>

            {/* Seletor de Mês */}
            <View style={styles.monthSelectorRow}>
              <TouchableOpacity style={styles.monthDropdown}>
                <Text style={styles.monthText}>Setembro 2026</Text>
                <ChevronDown size={18} color="#333" />
              </TouchableOpacity>
              <View style={styles.navArrows}>
                <TouchableOpacity style={styles.arrowBtn}>
                  <ChevronLeft size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowBtn}>
                  <ChevronRight size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Grade do Calendário */}
            <Surface style={styles.calendarSurface} elevation={0}>
              {/* Dias da Semana */}
              <View style={styles.weekHeadersRow}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((sigla, idx) => (
                  <Text key={idx} style={styles.weekHeaderCell}>{sigla}</Text>
                ))}
              </View>

              {/* Dias do Mês */}
              <View style={styles.daysGrid}>
                {/* Espaço em branco antes do dia 31 (Domingo inicial) */}
                <View style={styles.dayCell} />

                {DIAS_DO_MES.map((dia) => {
                  const isAgendado = datasAgendadasSet.has(dia.dataIso);
                  const isIndisponivel = dia.status === 'indisponivel';
                  const isFeriado = dia.status === 'feriado';

                  return (
                    <TouchableOpacity
                      key={dia.dataIso}
                      onPress={() => handleSelecionarDia(dia)}
                      style={styles.dayCell}
                      activeOpacity={isAgendado ? 0.7 : 1}
                    >
                      {isAgendado ? (
                        <View style={styles.agendadoCircle}>
                          <Text style={styles.agendadoText}>{dia.diaNum}</Text>
                        </View>
                      ) : (
                        <Text style={[
                          styles.dayNumText,
                          isIndisponivel && styles.indisponivelText,
                          isFeriado && styles.feriadoText,
                        ]}>
                          {dia.diaNum}
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Surface>

            {/* Legenda */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#00639A' }]} />
                <Text style={styles.legendText}>Agendado</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#C4C6CF' }]} />
                <Text style={styles.legendText}>Indisponível para agendamento</Text>
              </View>

              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#8B4513' }]} />
                <Text style={styles.legendText}>Feriado</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Menu de Opções ao Selecionar Dia Agendado */}
      <Modal visible={menuOpcoesVisible} transparent animationType="fade" onRequestClose={() => setMenuOpcoesVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuOpcoesVisible(false)}>
          <Surface style={styles.menuContent} elevation={4}>
            <TouchableOpacity style={styles.menuRow} onPress={handleVerDetalhes}>
              <Text style={styles.menuText}>Ver detalhes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuRow} onPress={handleEditar}>
              <Text style={styles.menuText}>Editar agendamento</Text>
              <Pencil size={18} color="#333" />
            </TouchableOpacity>

            {/* Regra de Negócio: Não exibir remoção para datas passadas (FA-003 / Critério 7) */}
            {!(diaSelecionado?.ehPassado) && (
              <TouchableOpacity style={styles.menuRow} onPress={handleIniciarRemocao}>
                <Text style={[styles.menuText, { color: '#8B261D' }]}>Cancelar agendamento</Text>
                <Trash2 size={18} color="#8B261D" />
              </TouchableOpacity>
            )}
          </Surface>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Detalhes da Viagem */}
      <Modal visible={modalDetalhesVisible} transparent animationType="fade" onRequestClose={() => setModalDetalhesVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalDetalhesVisible(false)}>
          <Surface style={styles.detalhesContent} elevation={4}>
            <Text variant="titleLarge" style={styles.detalhesTitle}>Detalhes da Viagem</Text>

            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Data:</Text>
              <Text style={styles.detalheVal}>{diaSelecionado?.dataIso}</Text>
            </View>

            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Trajeto:</Text>
              <Text style={styles.detalheVal}>Ida (05:30) e Volta (17:00)</Text>
            </View>

            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Embarque:</Text>
              <Text style={styles.detalheVal}>Igreja Matriz de Quixadá</Text>
            </View>

            <View style={styles.detalheItem}>
              <Text style={styles.detalheLabel}>Destino:</Text>
              <Text style={styles.detalheVal}>UFC - Campus Quixadá</Text>
            </View>

            <Button mode="contained" onPress={() => setModalDetalhesVisible(false)} style={styles.fecharBtn}>
              Fechar
            </Button>
          </Surface>
        </TouchableOpacity>
      </Modal>

      {/* Popup Modal de Confirmação de Cancelamento (HU-014 / FA-002) */}
      <AppPopup
        visible={modalCancelarVisible}
        type="warning"
        title="Cancelar agendamento?"
        message="Esta ação não poderá ser desfeita."
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarCancelamento}
        onDismiss={() => setModalCancelarVisible(false)}
      />

      {/* Snackbar Toast */}
      <Snackbar
        visible={snackbarVisivel}
        onDismiss={() => setSnackbarVisivel(false)}
        action={{
          label: '',
          icon: () => <X size={20} color="#fff" />,
          onPress: () => setSnackbarVisivel(false),
        }}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  mainTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 20,
    fontSize: 28,
  },
  emptyContainer: {
    flex: 1,
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#191C20',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 26,
  },
  calendarSection: {
    width: '100%',
  },
  subtitle: {
    color: '#43474E',
    marginBottom: 20,
    lineHeight: 20,
  },
  counterText: {
    color: '#43474E',
    fontWeight: '500',
    marginBottom: 20,
  },
  monthSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  monthDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#191C20',
  },
  navArrows: {
    flexDirection: 'row',
    gap: 16,
  },
  arrowBtn: {
    padding: 4,
  },
  calendarSurface: {
    backgroundColor: '#F8F9FF',
    marginBottom: 24,
  },
  weekHeadersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  weekHeaderCell: {
    width: '14%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#43474E',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agendadoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00639A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  agendadoText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dayNumText: {
    fontSize: 15,
    color: '#191C20',
  },
  indisponivelText: {
    color: '#C4C6CF',
  },
  feriadoText: {
    color: '#8B4513',
    fontWeight: '600',
  },
  legendRow: {
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: '#43474E',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  menuContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#191C20',
  },
  detalhesContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  detalhesTitle: {
    fontWeight: 'bold',
    color: '#191C20',
  },
  detalheItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detalheLabel: {
    fontWeight: '600',
    color: '#666',
  },
  detalheVal: {
    color: '#333',
  },
  fecharBtn: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  snackbar: {
    backgroundColor: '#322F35',
  },
});
