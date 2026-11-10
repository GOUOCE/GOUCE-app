import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, ChevronDown, Pencil, Trash2 } from 'lucide-react-native';

import { agendamentoService, CalendarioDiaResponse, CalendarioResponse } from '@/services/agendamentoService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

const OPCOES_MESES = [
  { label: 'Setembro 2026', value: '2026-09' },
  { label: 'Outubro 2026', value: '2026-10' },
  { label: 'Novembro 2026', value: '2026-11' },
  { label: 'Dezembro 2026', value: '2026-12' },
  { label: 'Janeiro 2027', value: '2027-01' },
];

export default function MeusAgendamentosScreen() {
  const router = useRouter();

  // Mês selecionado no formato YYYY-MM
  const [mesIso, setMesIso] = useState<string>('2026-09');
  const [calendario, setCalendario] = useState<CalendarioResponse | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState<CalendarioDiaResponse | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  // Modais de Ação, Mês e Confirmação
  const [modalMesesVisible, setModalMesesVisible] = useState(false);
  const [menuOpcoesVisible, setMenuOpcoesVisible] = useState(false);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);

  // Estado do Pop-up de Resultado (Sucesso ou Erro - Issue #413)
  const [popupResultado, setPopupResultado] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showResultadoPopup = (type: PopupType, title: string, message: string) => {
    setPopupResultado({
      visible: true,
      type,
      title,
      message,
      confirmText: 'Entendido',
    });
  };

  const carregarCalendario = useCallback(async (mes: string) => {
    setErroCarregamento(false);
    try {
      const res = await agendamentoService.listarCalendarioMes(mes);
      setCalendario(res);
    } catch {
      setErroCarregamento(true);
      setCalendario(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      carregarCalendario(mesIso).then(() => {
        if (cancelado) return;
      });
      return () => {
        cancelado = true;
      };
    }, [carregarCalendario, mesIso])
  );

  const handleNavegarMes = (delta: number) => {
    const [anoStr, mesStr] = mesIso.split('-');
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10) + delta;

    if (mes > 12) {
      mes = 1;
      ano += 1;
    } else if (mes < 1) {
      mes = 12;
      ano -= 1;
    }

    const novoMesIso = `${ano}-${String(mes).padStart(2, '0')}`;
    setMesIso(novoMesIso);
    carregarCalendario(novoMesIso);
  };

  const handleSelecionarMesOption = (novoMesIso: string) => {
    setModalMesesVisible(false);
    setMesIso(novoMesIso);
    carregarCalendario(novoMesIso);
  };

  const formatarTituloMes = (iso: string) => {
    const [anoStr, mesStr] = iso.split('-');
    const mesNum = parseInt(mesStr, 10);
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${meses[mesNum - 1] || 'Setembro'} ${anoStr}`;
  };

  const handleSelecionarDia = (dia: CalendarioDiaResponse) => {
    if (dia.estado === 'AGENDADO') {
      setDiaSelecionado(dia);
      setMenuOpcoesVisible(true);
    }
  };

  const handleVerDetalhes = () => {
    setMenuOpcoesVisible(false);
    if (diaSelecionado && diaSelecionado.agendamento_id) {
      router.push({
        pathname: '/(aluno)/agendamento-detalhes',
        params: {
          dataIso: diaSelecionado.data,
          idAgendamento: String(diaSelecionado.agendamento_id),
        },
      } as any);
    }
  };

  const handleEditar = () => {
    setMenuOpcoesVisible(false);
    if (diaSelecionado) {
      router.push({
        pathname: '/(aluno)/agendar-transporte/configurar',
        params: { datasIso: diaSelecionado.data, modoEdicao: 'true' },
      } as any);
    }
  };

  const handleIniciarRemocao = () => {
    setMenuOpcoesVisible(false);
    setModalCancelarVisible(true);
  };

  const handleConfirmarCancelamento = async () => {
    setModalCancelarVisible(false);
    if (!diaSelecionado || !diaSelecionado.agendamento_id) return;

    try {
      await agendamentoService.cancelarAgendamento(diaSelecionado.agendamento_id);
      showResultadoPopup(
        'success',
        'Sucesso!',
        'Agendamento cancelado com sucesso.'
      );
      carregarCalendario(mesIso);
    } catch {
      showResultadoPopup(
        'error',
        'Falha no Cancelamento',
        'Não foi possível processar o cancelamento. Verifique sua conexão e tente novamente.'
      );
    }
  };

  const ativosCount = calendario?.ativos ?? 0;
  const limiteMax = calendario?.limite ?? 22;

  const hojeIso = new Date().toISOString().split('T')[0];
  const podeRemoverDia = diaSelecionado
    ? Boolean(diaSelecionado.pode_remover !== false && diaSelecionado.data >= hojeIso)
    : false;

  // Calculo de deslocamento de dias da semana para o 1º dia do mes
  const calcularOffsetPrimeiroDia = (iso: string) => {
    const [ano, mes] = iso.split('-').map(Number);
    const primeiroDia = new Date(ano, mes - 1, 1);
    return primeiroDia.getDay(); // 0 = Domingo, 1 = Segunda...
  };

  const offsetBranco = calcularOffsetPrimeiroDia(mesIso);
  const listaDias = calendario?.dias || [];
  const semAgendamentosFuturos = !erroCarregamento && calendario !== null && ativosCount === 0;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Título Principal */}
        <Text variant="headlineMedium" style={styles.mainTitle}>Meus agendamentos</Text>

        {erroCarregamento ? (
          /* FA-004 (AC-08 / Issue #412): Erro de Conexão na Leitura */
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={[styles.emptyText, { color: '#B00020' }]}>
              Não foi possível carregar seus agendamentos. Verifique sua conexão e tente novamente.
            </Text>
            <Button
              mode="contained"
              onPress={() => carregarCalendario(mesIso)}
              style={styles.retryBtn}
              buttonColor="#3E5F90"
            >
              Tentar novamente
            </Button>
          </View>
        ) : semAgendamentosFuturos ? (
          /* FA-001 (AC-02): Estado Vazio Confirmado pela API */
          <View style={styles.emptyContainer}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              Você ainda não possui agendamentos futuros.
            </Text>
          </View>
        ) : (
          /* Conteúdo do Calendário Mensal Dinâmico */
          <View style={styles.calendarSection}>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Selecione um dia no calendário para gerenciar suas viagens. É possível realizar novos agendamentos com até 30 dias de antecedência.
            </Text>

            {/* Contador de Agendamentos Ativos */}
            <Text variant="bodyMedium" style={styles.counterText}>
              {ativosCount} de {limiteMax} agendamentos ativos
            </Text>

            {/* Seletor de Mês Interativo (Issue #407) */}
            <View style={styles.monthSelectorRow}>
              <TouchableOpacity style={styles.monthDropdown} onPress={() => setModalMesesVisible(true)}>
                <Text style={styles.monthText}>{formatarTituloMes(mesIso)}</Text>
                <ChevronDown size={18} color="#333" />
              </TouchableOpacity>

              <View style={styles.navArrows}>
                <TouchableOpacity style={styles.arrowBtn} onPress={() => handleNavegarMes(-1)}>
                  <ChevronLeft size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowBtn} onPress={() => handleNavegarMes(1)}>
                  <ChevronRight size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Grade do Calendário Dinâmico */}
            <Surface style={styles.calendarSurface} elevation={0}>
              {/* Dias da Semana */}
              <View style={styles.weekHeadersRow}>
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((sigla, idx) => (
                  <Text key={idx} style={styles.weekHeaderCell}>{sigla}</Text>
                ))}
              </View>

              {/* Dias do Mês */}
              <View style={styles.daysGrid}>
                {/* Espaços em branco antes do 1º dia do mês */}
                {Array.from({ length: offsetBranco }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.dayCell} />
                ))}

                {listaDias.map((dia) => {
                  const [anoVal, mesVal, diaNum] = dia.data.split('-').map(Number);
                  const dataObj = new Date(anoVal, mesVal - 1, diaNum);
                  const diaDaSemana = dataObj.getDay(); // 0 = Domingo, 6 = Sábado
                  const ehFimDeSemana = diaDaSemana === 0 || diaDaSemana === 6;

                  const isAgendado = dia.estado === 'AGENDADO';
                  const isIndisponivel = dia.estado === 'INDISPONIVEL' || (ehFimDeSemana && !isAgendado);
                  const isFeriadoOuRecesso = dia.estado === 'FERIADO' || dia.estado === 'RECESSO';

                  return (
                    <TouchableOpacity
                      key={dia.data}
                      onPress={() => handleSelecionarDia(dia)}
                      style={styles.dayCell}
                      activeOpacity={isAgendado ? 0.7 : 1}
                      disabled={!isAgendado}
                    >
                      {isAgendado ? (
                        <View style={styles.agendadoCircle}>
                          <Text style={styles.agendadoText}>{diaNum}</Text>
                        </View>
                      ) : (
                        <Text style={[
                          styles.dayNumText,
                          isIndisponivel && styles.indisponivelText,
                          isFeriadoOuRecesso && styles.feriadoText,
                        ]}>
                          {diaNum}
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
                <Text style={styles.legendText}>Feriado / Recesso</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal Seletor de Meses (Issue #407) */}
      <Modal visible={modalMesesVisible} transparent animationType="fade" onRequestClose={() => setModalMesesVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalMesesVisible(false)}>
          <Surface style={styles.menuContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>Selecionar Mês</Text>
            {OPCOES_MESES.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => handleSelecionarMesOption(opt.value)}
              >
                <Text style={[styles.optionText, opt.value === mesIso && styles.optionTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

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

            {/* Oculta remoção para agendamentos passados (RN-005 / AC-07 / Issue #410) */}
            {podeRemoverDia && (
              <TouchableOpacity style={styles.menuRow} onPress={handleIniciarRemocao}>
                <Text style={[styles.menuText, { color: '#8B261D' }]}>Cancelar agendamento</Text>
                <Trash2 size={18} color="#8B261D" />
              </TouchableOpacity>
            )}
          </Surface>
        </TouchableOpacity>
      </Modal>

      {/* Popup Modal de Confirmação de Cancelamento (HU-014 / AC-04) */}
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

      {/* Pop-up de Resultado do Cancelamento (Sucesso ou Erro - Issue #413) */}
      <AppPopup
        visible={popupResultado.visible}
        type={popupResultado.type}
        title={popupResultado.title}
        message={popupResultado.message}
        confirmText={popupResultado.confirmText}
        onConfirm={() => setPopupResultado((prev) => ({ ...prev, visible: false }))}
        onDismiss={() => setPopupResultado((prev) => ({ ...prev, visible: false }))}
      />
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
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#191C20',
    fontWeight: 'bold',
    fontSize: 18,
    lineHeight: 26,
  },
  retryBtn: {
    marginTop: 12,
    borderRadius: 8,
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
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#191C20',
    marginBottom: 8,
  },
  optionRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
  },
  optionText: {
    fontSize: 16,
    color: '#191C20',
  },
  optionTextActive: {
    fontWeight: 'bold',
    color: '#00639A',
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
});
