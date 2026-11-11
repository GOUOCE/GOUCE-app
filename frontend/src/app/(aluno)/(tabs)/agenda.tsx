import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Surface, Snackbar, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Trash2, X, WifiOff } from 'lucide-react-native';

import {
  agendamentoService,
  AgendamentoDetalhe,
  CalendarioDia,
  extrairMensagemErro,
  formatarData,
} from '@/services/agendamentoService';
import { AppPopup } from '@/components/ui/AppPopup';

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function mesAtual(): string {
  const agora = new Date();
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
}

function mesSeguinte(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  const proximo = new Date(ano, m, 1);
  return `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, '0')}`;
}

function mesAnterior(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  const anterior = new Date(ano, m - 2, 1);
  return `${anterior.getFullYear()}-${String(anterior.getMonth() + 1).padStart(2, '0')}`;
}

function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${ano}`;
}

function CardRotaComplementar({ agendamento }: { agendamento: AgendamentoDetalhe }) {
  const ida = agendamento.rota_complementar_ida;
  const volta = agendamento.rota_complementar_volta;

  return (
    <View style={styles.complementarBox}>
      <Text style={styles.complementarLabel}>
        Rota complementar (obrigatória p/ transferência)
      </Text>

      {/* Cada trecho usa o nome, horário e conexão da própria rota (HU-015 / #429). */}
      {ida && (
        <View style={styles.complementarTrechoBox}>
          <Text style={styles.complementarNome}>Ida: {ida.nome}</Text>
          <Text style={styles.complementarInfo}>
            Saída {ida.horario_saida} • Conexão: {ida.ponto_conexao}
          </Text>
        </View>
      )}

      {volta && (
        <View style={styles.complementarTrechoBox}>
          <Text style={styles.complementarNome}>Volta: {volta.nome}</Text>
          <Text style={styles.complementarInfo}>
            Retorno {volta.horario_retorno} • Conexão: {volta.ponto_conexao}
          </Text>
        </View>
      )}
    </View>
  );
}

function CardAgendamento({
  agendamento,
  onPress,
}: {
  agendamento: AgendamentoDetalhe;
  onPress: () => void;
}) {
  const { diaSemana, dataFormatada } = formatarData(agendamento.data);
  const trechos: string[] = [];
  if (agendamento.usa_ida) trechos.push('Ida');
  if (agendamento.usa_volta) trechos.push('Volta');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Surface style={styles.agendamentoCard} elevation={1}>
        <View style={styles.agendamentoHeader}>
          <Text style={styles.agendamentoData}>{dataFormatada}</Text>
          <View style={styles.trechosRow}>
            {trechos.map((trecho) => (
              <View key={trecho} style={styles.trechoChip}>
                <Text style={styles.trechoChipText}>{trecho}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.agendamentoDiaSemana}>{diaSemana}</Text>

        {agendamento.usa_ida && (
          <Text style={styles.agendamentoTrecho} numberOfLines={1}>
            Ida: {agendamento.ponto_embarque_nome} → {agendamento.ies_destino_nome}
          </Text>
        )}
        {agendamento.usa_volta && (
          <Text style={styles.agendamentoTrecho} numberOfLines={1}>
            Volta: {agendamento.ies_origem_nome} → {agendamento.ponto_desembarque_nome}
          </Text>
        )}

        {/* HU-015 / AC-01: dados destacados da rota complementar */}
        {(agendamento.rota_complementar_ida || agendamento.rota_complementar_volta) && (
          <CardRotaComplementar agendamento={agendamento} />
        )}
      </Surface>
    </TouchableOpacity>
  );
}

export default function MeusAgendamentosScreen() {
  const router = useRouter();

  const [mes, setMes] = useState(mesAtual());
  const [diasCalendario, setDiasCalendario] = useState<CalendarioDia[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoDetalhe[]>([]);
  const [ativos, setAtivos] = useState(0);
  const [limite, setLimite] = useState(22);
  const [semConexao, setSemConexao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [jaCarregou, setJaCarregou] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<CalendarioDia | null>(null);

  // Modais de Ação e Confirmação
  const [menuOpcoesVisible, setMenuOpcoesVisible] = useState(false);
  const [modalCancelarVisible, setModalCancelarVisible] = useState(false);

  // Snackbar Toast
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const carregarDados = useCallback(async (mesAlvo: string) => {
    setCarregando(true);
    try {
      const [meus, calendario] = await Promise.all([
        agendamentoService.listarAgendamentosAtivos(),
        agendamentoService.obterCalendario(mesAlvo),
      ]);
      setAgendamentos(meus.agendamentos);
      setAtivos(meus.ativos);
      setLimite(meus.limite);
      setDiasCalendario(calendario.dias);
      setSemConexao(false);
    } catch {
      // Sem internet: usa a última sincronização guardada no dispositivo (RNF-015)
      const meusCache = await agendamentoService.listarAgendamentosCache();
      const calendarioCache = await agendamentoService.obterCalendarioCache(mesAlvo);
      if (meusCache) {
        setAgendamentos(meusCache.agendamentos);
        setAtivos(meusCache.ativos);
        setLimite(meusCache.limite);
        setSemConexao(true);
      }
      if (calendarioCache) {
        setDiasCalendario(calendarioCache.dias);
      }
      if (!meusCache && !calendarioCache) {
        setSemConexao(true);
      }
    } finally {
      setCarregando(false);
      setJaCarregou(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDados(mes);
    }, [carregarDados, mes])
  );

  const diasMap = useMemo(() => {
    const map = new Map<string, CalendarioDia>();
    diasCalendario.forEach((dia) => map.set(dia.data, dia));
    return map;
  }, [diasCalendario]);

  const celulasCalendario = useMemo(() => {
    const [ano, m] = mes.split('-').map(Number);
    const primeiroDiaSemana = new Date(ano, m - 1, 1).getDay();
    const totalDias = new Date(ano, m, 0).getDate();
    const celulas: (
      | { vazio: true }
      | { vazio: false; diaNum: number; dataIso: string; dia: CalendarioDia | null }
    )[] = [];
    for (let i = 0; i < primeiroDiaSemana; i += 1) {
      celulas.push({ vazio: true });
    }
    for (let diaNum = 1; diaNum <= totalDias; diaNum += 1) {
      const dataIso = `${mes}-${String(diaNum).padStart(2, '0')}`;
      celulas.push({ vazio: false, diaNum, dataIso, dia: diasMap.get(dataIso) ?? null });
    }
    return celulas;
  }, [mes, diasMap]);

  const mudarMes = (direcao: 1 | -1) => {
    const atual = mesAtual();
    const proximo = direcao === 1 ? mesSeguinte(mes) : mesAnterior(mes);
    // Janela de agendamento: mês atual e próximo
    if (proximo < atual || proximo > mesSeguinte(atual)) return;
    setMes(proximo);
  };

  const handleSelecionarDia = (dia: CalendarioDia) => {
    if (dia.estado !== 'AGENDADO') return;
    setDiaSelecionado(dia);
    setMenuOpcoesVisible(true);
  };

  const handleVerDetalhes = () => {
    setMenuOpcoesVisible(false);
    if (diaSelecionado) {
      router.push({
        pathname: '/(aluno)/agendamento-detalhes',
        params: { dataIso: diaSelecionado.data },
      } as any);
    }
  };

  const handleIniciarRemocao = () => {
    setMenuOpcoesVisible(false);
    setModalCancelarVisible(true);
  };

  const handleConfirmarCancelamento = async () => {
    setModalCancelarVisible(false);
    if (!diaSelecionado?.agendamento_id) return;

    try {
      await agendamentoService.cancelarAgendamento(
        diaSelecionado.agendamento_id,
        diaSelecionado.data
      );
      setSnackbarMessage('Agendamento cancelado com sucesso');
      setSnackbarVisivel(true);
      carregarDados(mes);
    } catch (erro: any) {
      const status = erro?.response?.status;
      if (status === 404) {
        // O servidor recusou porque a reserva já não está ativa (cancelada em outra sessão): não é falha de rede.
        setSnackbarMessage('Este agendamento já não está ativo. A agenda foi atualizada.');
        carregarDados(mes);
      } else if (status) {
        // Recusa do servidor com outro motivo: mostra a mensagem dele e mantém o agendamento ativo.
        setSnackbarMessage(extrairMensagemErro(erro));
      } else {
        // FA-004: Falha de comunicação mantém o agendamento ativo
        setSnackbarMessage(
          'Não foi possível processar o cancelamento. Verifique sua conexão e tente novamente'
        );
      }
      setSnackbarVisivel(true);
    }
  };

  const semAgendamentosFuturos = jaCarregou && agendamentos.length === 0;
  const carregandoInicial = carregando && !jaCarregou;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Título Principal */}
        <Text variant="headlineMedium" style={styles.mainTitle}>Meus agendamentos</Text>

        {/* Aviso de Consulta Offline (RNF-015) */}
        {semConexao && (
          <Surface style={styles.offlineBanner} elevation={0}>
            <WifiOff size={16} color="#00639A" />
            <Text style={styles.offlineText}>
              Visualização Offline (Dados salvos no dispositivo)
            </Text>
          </Surface>
        )}

        {carregandoInicial ? (
          /* Primeira carga: evita exibir o calendário vazio antes dos dados */
          <View style={styles.emptyContainer}>
            <ActivityIndicator animating color="#00639A" />
          </View>
        ) : semAgendamentosFuturos ? (
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
              {ativos} de {limite} agendamentos ativos
            </Text>

            {/* Seletor de Mês */}
            <View style={styles.monthSelectorRow}>
              <TouchableOpacity style={styles.monthDropdown}>
                <Text style={styles.monthText}>{rotuloMes(mes)}</Text>
              </TouchableOpacity>
              <View style={styles.navArrows}>
                <TouchableOpacity style={styles.arrowBtn} onPress={() => mudarMes(-1)}>
                  <ChevronLeft size={20} color="#666" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowBtn} onPress={() => mudarMes(1)}>
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
                {celulasCalendario.map((celula, idx) => {
                  if (celula.vazio) {
                    return <View key={`vazio-${idx}`} style={styles.dayCell} />;
                  }
                  const { diaNum, dataIso, dia } = celula;
                  const isAgendado = dia?.estado === 'AGENDADO';
                  const isFeriado =
                    !!dia &&
                    dia.estado !== 'AGENDADO' &&
                    dia.estado !== 'DISPONIVEL' &&
                    dia.estado !== 'INDISPONIVEL';
                  // Dia ausente da resposta: passado sem agendamento ou fora da janela
                  const isIndisponivel = !dia || dia.estado === 'INDISPONIVEL';

                  return (
                    <TouchableOpacity
                      key={dataIso}
                      onPress={() => dia && handleSelecionarDia(dia)}
                      style={styles.dayCell}
                      activeOpacity={isAgendado ? 0.7 : 1}
                    >
                      {isAgendado ? (
                        <View style={styles.agendadoCircle}>
                          <Text style={styles.agendadoText}>{diaNum}</Text>
                        </View>
                      ) : (
                        <Text style={[
                          styles.dayNumText,
                          isIndisponivel && styles.indisponivelText,
                          isFeriado && styles.feriadoText,
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
                <Text style={styles.legendText}>Feriado</Text>
              </View>
            </View>

            {/* Agendamentos Ativos (HU-015 / AC-01: rota complementar destacada) */}
            <Text variant="titleMedium" style={styles.listaTitle}>
              Próximas viagens
            </Text>
            {agendamentos.map((agendamento) => (
              <CardAgendamento
                key={agendamento.id}
                agendamento={agendamento}
                onPress={() =>
                  router.push({
                    pathname: '/(aluno)/agendamento-detalhes',
                    params: { dataIso: agendamento.data },
                  } as any)
                }
              />
            ))}
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

            {/* Regra de Negócio: Não exibir remoção para datas passadas (FA-003 / Critério 7) */}
            {(diaSelecionado?.pode_remover ?? false) && (
              <TouchableOpacity style={styles.menuRow} onPress={handleIniciarRemocao}>
                <Text style={[styles.menuText, { color: '#8B261D' }]}>Cancelar agendamento</Text>
                <Trash2 size={18} color="#8B261D" />
              </TouchableOpacity>
            )}
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
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C2E7FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 16,
  },
  offlineText: {
    color: '#001D36',
    fontSize: 12,
    fontWeight: '600',
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
  listaTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginTop: 24,
    marginBottom: 12,
  },
  agendamentoCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 6,
  },
  agendamentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agendamentoData: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 16,
  },
  trechosRow: {
    flexDirection: 'row',
    gap: 6,
  },
  trechoChip: {
    backgroundColor: '#00639A',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  trechoChipText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  agendamentoDiaSemana: {
    color: '#74777F',
    fontSize: 13,
  },
  agendamentoTrecho: {
    color: '#43474E',
    fontSize: 14,
  },
  complementarBox: {
    backgroundColor: '#C2E7FF',
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    gap: 4,
  },
  complementarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#001D36',
  },
  complementarTrechoBox: {
    gap: 2,
  },
  complementarNome: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#03537D',
  },
  complementarInfo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#001D36',
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
  snackbar: {
    backgroundColor: '#322F35',
  },
});
