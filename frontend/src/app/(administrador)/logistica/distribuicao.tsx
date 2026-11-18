import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  ClipboardList,
  Users,
  User,
  Bus,
  CheckCircle2,
} from 'lucide-react-native';

import { logisticaService, LinhaDistribuicao } from '@/services/logisticaService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { getErrorMessage } from '@/utils/errorUtils';

const SIGLAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const NOMES_DIAS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
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

const inicioDoDia = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate());

const adicionarDias = (data: Date, dias: number) => {
  const resultado = inicioDoDia(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
};

const inicioDaSemana = (data: Date) => {
  const resultado = inicioDoDia(data);
  const diasDesdeSegunda = (resultado.getDay() + 6) % 7;
  resultado.setDate(resultado.getDate() - diasDesdeSegunda);
  return resultado;
};

const paraIso = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const paraDataLocal = (iso: string) => new Date(`${iso}T12:00:00`);

const formatarIntervaloSemana = (inicio: Date, fim: Date) => {
  const mesmoMes = inicio.getMonth() === fim.getMonth() && inicio.getFullYear() === fim.getFullYear();
  if (mesmoMes) {
    return `${inicio.getDate()} - ${fim.getDate()} de ${MESES[inicio.getMonth()]} de ${inicio.getFullYear()}`;
  }
  return `${inicio.getDate()} de ${MESES[inicio.getMonth()]} - ${fim.getDate()} de ${MESES[fim.getMonth()]} de ${fim.getFullYear()}`;
};

const formatarDataLonga = (iso: string) => {
  const data = paraDataLocal(iso);
  return `${NOMES_DIAS[data.getDay()]}, ${data.getDate()} de ${MESES[data.getMonth()]} de ${data.getFullYear()}`;
};

export default function DistribicaoLogisticaScreen() {
  const router = useRouter();

  const hoje = useMemo(() => inicioDoDia(new Date()), []);
  const [tipoTab, setTipoTab] = useState<'proximos' | 'historico'>('proximos');
  const [offsetSemanas, setOffsetSemanas] = useState(0);
  const [dataIsoSelecionada, setDataIsoSelecionada] = useState<string>(() => paraIso(hoje));
  const [linhas, setLinhas] = useState<LinhaDistribuicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [popupConfirmarVisible, setPopupConfirmarVisible] = useState(false);
  const [popupResultado, setPopupResultado] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });
  const [statusLogistico, setStatusLogistico] = useState('');
  const [distribuicaoPersistida, setDistribuicaoPersistida] = useState(false);

  const semanaInicio = useMemo(
    () => adicionarDias(inicioDaSemana(hoje), offsetSemanas * 7),
    [hoje, offsetSemanas],
  );
  const semanaFim = useMemo(() => adicionarDias(semanaInicio, 6), [semanaInicio]);
  const diasSemana = useMemo(
    () =>
      Array.from({ length: 7 }, (_, indice) => {
        const data = adicionarDias(semanaInicio, indice);
        return {
          sigla: SIGLAS[data.getDay()],
          diaNum: data.getDate(),
          dataIso: paraIso(data),
        };
      }),
    [semanaInicio],
  );

  const carregarLinhas = useCallback(async (dataIso: string) => {
    setLoading(true);
    setErro('');
    setStatusLogistico('');
    setDistribuicaoPersistida(false);
    try {
      const res = await logisticaService.obterPainelDistribuicao(dataIso);
      setLinhas(res.linhas);
      const persistida =
        Boolean(res.preview.distribuicao_persistida) ||
        res.preview.status_logistico === 'DISTRIBUIDO';
      setDistribuicaoPersistida(persistida);
      setStatusLogistico(persistida ? res.preview.status_logistico ?? 'DISTRIBUIDO' : '');
    } catch (error) {
      setLinhas([]);
      setErro(getErrorMessage(error, 'Não foi possível carregar a distribuição logística.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarLinhas(dataIsoSelecionada);
    }, [carregarLinhas, dataIsoSelecionada]),
  );

  const selecionarTab = (tab: 'proximos' | 'historico') => {
    setTipoTab(tab);
    setOffsetSemanas(tab === 'historico' ? -1 : 0);
    setDataIsoSelecionada(paraIso(tab === 'historico' ? adicionarDias(hoje, -7) : hoje));
  };

  const handleNavegarSemana = (delta: number) => {
    const novaData = adicionarDias(paraDataLocal(dataIsoSelecionada), delta * 7);
    const novoOffset = offsetSemanas + delta;
    setOffsetSemanas(novoOffset);
    setDataIsoSelecionada(paraIso(novaData));
    setTipoTab(novoOffset < 0 ? 'historico' : 'proximos');
  };

  const totalAlunos = useMemo(
    () => linhas.reduce((total, linha) => total + linha.alunosAgendados, 0),
    [linhas],
  );

  const somenteLeitura = tipoTab === 'historico' || dataIsoSelecionada < paraIso(hoje);

  const abrirConfirmacao = () => {
    if (linhas.length === 0) {
      setPopupResultado({
        visible: true,
        type: 'warning',
        title: 'Sem demanda',
        message: 'Não há alunos agendados para este dia.',
      });
      return;
    }
    setPopupConfirmarVisible(true);
  };

  const confirmarDistribuicao = async () => {
    setPopupConfirmarVisible(false);
    setConfirmando(true);
    try {
      const resposta = await logisticaService.confirmarDistribuicao({
        data: dataIsoSelecionada,
        modo: 'automatico',
        alocacoes: [],
      });
      setStatusLogistico(resposta.status_logistico);
      setDistribuicaoPersistida(true);
      setPopupResultado({
        visible: true,
        type: 'success',
        title: 'Distribuição confirmada',
        message: resposta.mensagem || 'Distribuição realizada com sucesso',
      });
      await carregarLinhas(dataIsoSelecionada);
    } catch (error) {
      setPopupResultado({
        visible: true,
        type: 'error',
        title: 'Erro na distribuição',
        message: getErrorMessage(error, 'Não foi possível confirmar a distribuição.'),
      });
    } finally {
      setConfirmando(false);
    }
  };

  const renderBadgeStatus = (status: LinhaDistribuicao['status']) => {
    if (status === 'alocada') {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#C2E7FF' }]}>
          <Text style={[styles.badgeText, { color: '#001D36' }]}>Alocada</Text>
        </View>
      );
    }
    if (status === 'superlotada') {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#FFDAD6' }]}>
          <Text style={[styles.badgeText, { color: '#410002' }]}>Superlotada</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badgeContainer, { backgroundColor: '#FFDCC2' }]}>
        <Text style={[styles.badgeText, { color: '#2E1500' }]}>Pendente</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <AppPopup
        visible={popupConfirmarVisible}
        type="warning"
        title="Confirmar distribuição?"
        message={`A distribuição automática de ${totalAlunos} aluno(s) será salva para ${formatarDataLonga(dataIsoSelecionada)}.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={confirmarDistribuicao}
        onDismiss={() => setPopupConfirmarVisible(false)}
      />

      <AppPopup
        visible={popupResultado.visible}
        type={popupResultado.type}
        title={popupResultado.title}
        message={popupResultado.message}
        confirmText="Entendido"
        onConfirm={() => setPopupResultado((prev) => ({ ...prev, visible: false }))}
        onDismiss={() => setPopupResultado((prev) => ({ ...prev, visible: false }))}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Distribuição Logística
        </Text>
      </View>

      <View style={styles.topTabsContainer}>
        <TouchableOpacity
          style={[styles.topTabBtn, tipoTab === 'proximos' && styles.topTabBtnActive]}
          onPress={() => selecionarTab('proximos')}
        >
          <Text style={[styles.topTabText, tipoTab === 'proximos' && styles.topTabTextActive]}>
            Próximos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTabBtn, tipoTab === 'historico' && styles.topTabBtnActive]}
          onPress={() => selecionarTab('historico')}
        >
          <Text style={[styles.topTabText, tipoTab === 'historico' && styles.topTabTextActive]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.weekHeaderRow}>
          <Text style={styles.weekRangeText}>
            {formatarIntervaloSemana(semanaInicio, semanaFim)}
          </Text>
          <View style={styles.arrowsRow}>
            <TouchableOpacity onPress={() => handleNavegarSemana(-1)} style={styles.arrowPad}>
              <ChevronLeft size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavegarSemana(1)} style={styles.arrowPad}>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.daysPillRow}>
          {diasSemana.map((dia) => {
            const isSelected = dia.dataIso === dataIsoSelecionada;
            return (
              <TouchableOpacity
                key={dia.dataIso}
                onPress={() => setDataIsoSelecionada(dia.dataIso)}
                style={[styles.dayPill, isSelected && styles.dayPillSelected]}
              >
                <Text style={[styles.pillSigla, isSelected && styles.pillTextSelected]}>
                  {dia.sigla}
                </Text>
                <Text style={[styles.pillNum, isSelected && styles.pillTextSelected]}>
                  {dia.diaNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text variant="titleMedium" style={styles.dateSubTitle}>
          {formatarDataLonga(dataIsoSelecionada)}
        </Text>

        {statusLogistico ? (
          <View style={styles.statusLogisticoBox}>
            <CheckCircle2 size={18} color="#00639A" />
            <Text style={styles.statusLogisticoText}>Status logístico: {statusLogistico}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3E5F90" />
          </View>
        ) : erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erro}</Text>
            <Button mode="outlined" onPress={() => carregarLinhas(dataIsoSelecionada)}>
              Tentar novamente
            </Button>
          </View>
        ) : linhas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Nenhum aluno agendado para este dia.</Text>
          </View>
        ) : (
          <View style={styles.linhasList}>
            {linhas.map((linha) => (
              <Surface key={linha.id} style={styles.linhaCard} elevation={1}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.linhaInfoCol}>
                    <Text variant="titleMedium" style={styles.linhaTitle}>
                      {linha.nomeLinha}
                    </Text>
                    <Text variant="bodySmall" style={styles.linhaFaculdades}>
                      {linha.faculdades.join(', ') || 'Sem faculdades vinculadas'}
                    </Text>
                  </View>

                  <View style={styles.headerRightCol}>
                    <Text style={styles.horariosText}>{linha.horarioSaida}</Text>
                    <Text style={styles.horariosText}>{linha.horarioVolta}</Text>
                    {renderBadgeStatus(linha.status)}
                  </View>
                </View>

                <View style={styles.cardBodyRow}>
                  <View style={styles.detailsCol}>
                    <View style={styles.detailRow}>
                      <Users size={18} color="#191C20" />
                      <Text style={styles.detailText}>
                        {linha.alunosAgendados} alunos agendados
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <User size={18} color={linha.motoristaNome ? '#191C20' : '#BA1A1A'} />
                      <Text style={[styles.detailText, !linha.motoristaNome && styles.alertText]}>
                        {linha.motoristaNome || 'Sem motorista alocado'}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Bus size={18} color={linha.onibusApelido ? '#191C20' : '#BA1A1A'} />
                      <Text style={[styles.detailText, !linha.onibusApelido && styles.alertText]}>
                        {linha.onibusApelido || 'Sem ônibus alocado'}
                      </Text>
                    </View>

                    {linha.excedentes > 0 ? (
                      <Text style={styles.excedentesText}>
                        {linha.excedentes} aluno(s) excedente(s)
                      </Text>
                    ) : null}
                  </View>

                  {!somenteLeitura || linha.excedentes > 0 ? (
                    <View style={styles.actionsCol}>
                      {!somenteLeitura ? (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/(administrador)/logistica/alocar',
                              params: { linhaId: String(linha.id), dataIso: dataIsoSelecionada },
                            } as any)
                          }
                        >
                          <Pencil size={20} color="#191C20" />
                        </TouchableOpacity>
                      ) : null}

                      {linha.excedentes > 0 ? (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() =>
                            router.push({
                              pathname: '/(administrador)/logistica/excedentes',
                              params: { linhaId: String(linha.id), dataIso: dataIsoSelecionada },
                            } as any)
                          }
                        >
                          <ClipboardList size={20} color="#B00020" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </Surface>
            ))}
          </View>
        )}

        {!somenteLeitura && !distribuicaoPersistida && !loading && !erro && linhas.length > 0 ? (
          <Button
            mode="contained"
            onPress={abrirConfirmacao}
            loading={confirmando}
            disabled={confirmando}
            style={styles.confirmarButton}
            contentStyle={styles.confirmarButtonContent}
            buttonColor="#3E5F90"
          >
            Confirmar distribuição
          </Button>
        ) : null}
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
  topTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  topTabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  topTabBtnActive: {
    borderBottomColor: '#00639A',
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#74777F',
  },
  topTabTextActive: {
    color: '#00639A',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#43474E',
  },
  arrowsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  arrowPad: {
    padding: 4,
  },
  daysPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayPill: {
    width: 44,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E0E2EC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayPillSelected: {
    backgroundColor: '#C2E7FF',
    borderWidth: 1.5,
    borderColor: '#00639A',
  },
  pillSigla: {
    fontSize: 12,
    fontWeight: '500',
    color: '#43474E',
  },
  pillNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#191C20',
  },
  pillTextSelected: {
    color: '#001D36',
  },
  dateSubTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 20,
    fontSize: 18,
  },
  statusLogisticoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  statusLogisticoText: {
    color: '#00639A',
    fontWeight: '600',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#74777F',
    textAlign: 'center',
  },
  linhasList: {
    gap: 16,
  },
  linhaCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  linhaInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  linhaTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginBottom: 4,
  },
  linhaFaculdades: {
    color: '#74777F',
    fontSize: 13,
  },
  headerRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  horariosText: {
    fontSize: 12,
    color: '#43474E',
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#191C20',
  },
  alertText: {
    color: '#BA1A1A',
  },
  excedentesText: {
    color: '#B00020',
    fontSize: 13,
    fontWeight: '600',
  },
  actionsCol: {
    gap: 16,
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 8,
  },
  confirmarButton: {
    marginTop: 28,
    borderRadius: 24,
  },
  confirmarButtonContent: {
    height: 52,
  },
});
