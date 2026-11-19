import React, { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronDown, Bus, User } from 'lucide-react-native';

import {
  logisticaService,
  manterSelecaoDisponivel,
  AlunoAlocacao,
  AlocacaoDistribuicao,
  OnibusOpcao,
  MotoristaOpcao,
  OpcaoSelect,
  PreviaDistribuicao,
  Turno,
} from '@/services/logisticaService';
import type { RotaPrincipalItem } from '@/services/rotaPrincipalService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { getErrorMessage } from '@/utils/errorUtils';

interface FormularioAlocacao {
  chave: string;
  origemIndex: number;
  turno: Turno;
  onibusId: string;
  motoristaId: string;
  alunos: AlunoAlocacao[];
}

interface CalculoCapacidade {
  veiculo?: OnibusOpcao;
  total: number;
  assentos: number;
  capacidadeEmPe: number;
  sentados: number;
  emPe: number;
  dentroDaCapacidade: boolean;
}

const paraIso = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const formatarDataCurta = (iso: string) => {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
};

export default function AlocarRotaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linhaId?: string; dataIso?: string }>();

  const linhaId = Number(params.linhaId);
  const dataIso = params.dataIso || paraIso(new Date());

  const [rota, setRota] = useState<RotaPrincipalItem | null>(null);
  const [preview, setPreview] = useState<PreviaDistribuicao | null>(null);
  const [formularios, setFormularios] = useState<FormularioAlocacao[]>([]);
  const [onibus, setOnibus] = useState<OnibusOpcao[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaOpcao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [modalPicker, setModalPicker] = useState<{
    visible: boolean;
    title: string;
    options: OpcaoSelect[];
    onSelect: (valor: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    onSelect: () => {},
  });

  const [modalConfirmarVisible, setModalConfirmarVisible] = useState(false);
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

  const carregar = useCallback(async () => {
    if (!Number.isFinite(linhaId) || linhaId <= 0) {
      setErro('Rota não informada para alocação.');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro('');
    try {
      const dados = await logisticaService.obterOpcoesAlocacao(linhaId, dataIso);
      setRota(dados.rota);
      setPreview(dados.preview);
      setOnibus(dados.onibus);
      setMotoristas(dados.motoristas);

      const formulariosDaRota = dados.preview.alocacoes
        .map((alocacao, origemIndex) => ({ alocacao, origemIndex }))
        .filter(({ alocacao }) => Number(alocacao.rota_id) === linhaId)
        .map(({ alocacao, origemIndex }) => ({
          chave: `${alocacao.turno}-${origemIndex}`,
          origemIndex,
          turno: alocacao.turno,
          onibusId: manterSelecaoDisponivel(alocacao.onibus_id ?? '', dados.onibus),
          motoristaId: manterSelecaoDisponivel(
            alocacao.motorista_id ? String(alocacao.motorista_id) : '',
            dados.motoristas,
          ),
          alunos: alocacao.alunos,
        }));

      setFormularios(formulariosDaRota);
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível carregar os dados da alocação.'));
    } finally {
      setCarregando(false);
    }
  }, [dataIso, linhaId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  const onibusPorPlaca = useMemo(
    () => new Map(onibus.map((item) => [item.value, item])),
    [onibus],
  );

  const calcular = useCallback(
    (formulario: FormularioAlocacao): CalculoCapacidade => {
      const veiculo = onibusPorPlaca.get(formulario.onibusId);
      const total = formulario.alunos.length;
      const assentos = veiculo?.assentos ?? 0;
      const capacidadeEmPe = veiculo?.capacidadeEmPe ?? 0;
      const sentados = Math.min(total, assentos);
      const emPe = total - sentados;

      return {
        veiculo,
        total,
        assentos,
        capacidadeEmPe,
        sentados,
        emPe,
        dentroDaCapacidade: Boolean(veiculo) && total <= assentos + capacidadeEmPe,
      };
    },
    [onibusPorPlaca],
  );

  const obterRecursosUsadosNoTurno = (formulario: FormularioAlocacao) => {
    const usadosOnibus = new Set<string>();
    const usadosMotoristas = new Set<string>();

    preview?.alocacoes.forEach((alocacao, origemIndex) => {
      if (alocacao.turno !== formulario.turno || origemIndex === formulario.origemIndex) return;
      usadosOnibus.add(alocacao.onibus_id);
      usadosMotoristas.add(String(alocacao.motorista_id));
    });

    formularios.forEach((item) => {
      if (item.turno !== formulario.turno || item.chave === formulario.chave) return;
      if (item.onibusId) usadosOnibus.add(item.onibusId);
      if (item.motoristaId) usadosMotoristas.add(item.motoristaId);
    });

    return { usadosOnibus, usadosMotoristas };
  };

  const obterOpcoesOnibus = (formulario: FormularioAlocacao) => {
    const { usadosOnibus } = obterRecursosUsadosNoTurno(formulario);
    return onibus.filter(
      (item) => !usadosOnibus.has(item.value) || item.value === formulario.onibusId,
    );
  };

  const obterOpcoesMotoristas = (formulario: FormularioAlocacao) => {
    const { usadosMotoristas } = obterRecursosUsadosNoTurno(formulario);
    return motoristas.filter(
      (item) => !usadosMotoristas.has(item.value) || item.value === formulario.motoristaId,
    );
  };

  const abrirPicker = (
    title: string,
    options: OpcaoSelect[],
    onSelect: (valor: string) => void,
  ) => {
    setModalPicker({ visible: true, title, options, onSelect });
  };

  const atualizarFormulario = (
    chave: string,
    campo: 'onibusId' | 'motoristaId',
    valor: string,
  ) => {
    setFormularios((prev) =>
      prev.map((item) => (item.chave === chave ? { ...item, [campo]: valor } : item)),
    );
  };

  const getLabelPorValor = (options: OpcaoSelect[], valor: string) => {
    if (!valor) return 'Selecionar';
    return options.find((option) => option.value === valor)?.label ?? 'Selecionar';
  };

  const faculdadesRota = useMemo(() => {
    if (!rota) return [] as string[];

    const faculdades = [...(rota.faculdades_ida ?? []), ...(rota.faculdades_volta ?? [])];
    const vistos = new Set<string>();
    const nomes: string[] = [];

    for (const faculdade of faculdades) {
      const nome = faculdade.sigla || faculdade.nome;
      if (nome && !vistos.has(nome)) {
        vistos.add(nome);
        nomes.push(nome);
      }
    }

    return nomes;
  }, [rota]);

  const excedentesRota = useMemo(
    () =>
      (preview?.excedentes_globais ?? []).filter(
        (item) => Number(item.rota_id) === linhaId,
      ).length,
    [linhaId, preview],
  );

  const montarAlocacoes = useCallback(() => {
    if (!preview) return { payload: [], enriquecidas: [] as AlocacaoDistribuicao[] };

    const enriquecidas: AlocacaoDistribuicao[] = preview.alocacoes.map(
      (alocacao, origemIndex) => {
        const formulario = formularios.find((item) => item.origemIndex === origemIndex);
        if (!formulario) return alocacao;

        const calculo = calcular(formulario);
        const alunos: AlunoAlocacao[] = formulario.alunos.map((aluno, indice) => ({
          ...aluno,
          tipo_lugar: indice < calculo.sentados ? 'sentado' : 'em_pe',
        }));

        return {
          ...alocacao,
          onibus_id: formulario.onibusId,
          motorista_id: Number(formulario.motoristaId),
          capacidade: { assentos: calculo.assentos, em_pe: calculo.capacidadeEmPe },
          sentados: calculo.sentados,
          em_pe: calculo.emPe,
          alunos,
        };
      },
    );

    const payload = enriquecidas.map((item) => ({
      rota_id: item.rota_id,
      onibus_id: item.onibus_id,
      motorista_id: item.motorista_id,
      turno: item.turno,
      alunos: item.alunos,
    }));

    return { payload, enriquecidas };
  }, [calcular, formularios, preview]);

  const handleIniciarAlocacao = () => {
    if (formularios.length === 0) {
      setPopupResultado({
        visible: true,
        type: 'warning',
        title: 'Sem veículos',
        message: 'Não há veículos alocados para esta rota nesta data.',
      });
      return;
    }

    if (formularios.some((item) => !item.onibusId || !item.motoristaId)) {
      setPopupResultado({
        visible: true,
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: 'Selecione um ônibus e um motorista para cada veículo da rota.',
      });
      return;
    }

    if (formularios.some((item) => !calcular(item).dentroDaCapacidade)) {
      setPopupResultado({
        visible: true,
        type: 'warning',
        title: 'Capacidade excedida',
        message:
          'O ônibus selecionado não comporta todos os alunos deste veículo. Escolha um veículo com capacidade suficiente.',
      });
      return;
    }

    setModalConfirmarVisible(true);
  };

  const handleConfirmarAlocacao = async () => {
    if (!preview) return;

    setModalConfirmarVisible(false);
    setSalvando(true);
    try {
      const { payload, enriquecidas } = montarAlocacoes();
      await logisticaService.confirmarDistribuicao(
        { data: dataIso, modo: 'manual', alocacoes: payload },
        enriquecidas,
      );

      setPopupResultado({
        visible: true,
        type: 'success',
        title: 'Escala confirmada',
        message: 'Escala de motoristas confirmada com sucesso.',
      });
    } catch (error) {
      setPopupResultado({
        visible: true,
        type: 'error',
        title: 'Erro na alocação',
        message: getErrorMessage(error, 'Não foi possível confirmar a alocação.'),
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <AppPopup
        visible={modalConfirmarVisible}
        type="warning"
        title="Confirmar alocação?"
        message={`O ônibus e o motorista selecionados serão associados à rota ${rota?.nome ?? ''} em ${formatarDataCurta(dataIso)}. As alocações de todas as rotas do dia também serão salvas.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarAlocacao}
        onDismiss={() => setModalConfirmarVisible(false)}
      />

      <AppPopup
        visible={popupResultado.visible}
        type={popupResultado.type}
        title={popupResultado.title}
        message={popupResultado.message}
        confirmText="Entendido"
        onConfirm={() => {
          setPopupResultado((prev) => ({ ...prev, visible: false }));
          if (popupResultado.type === 'success') {
            router.back();
          }
        }}
        onDismiss={() => setPopupResultado((prev) => ({ ...prev, visible: false }))}
      />

      <Modal
        visible={modalPicker.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalPicker((prev) => ({ ...prev, visible: false }))}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalPicker((prev) => ({ ...prev, visible: false }))}
        >
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>
              {modalPicker.title}
            </Text>
            {modalPicker.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  modalPicker.onSelect(opt.value);
                  setModalPicker((prev) => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
            {modalPicker.options.length === 0 ? (
              <Text style={styles.optionEmpty}>Nenhuma opção disponível.</Text>
            ) : null}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {rota?.nome ?? 'Alocação de Rota'}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {formatarDataCurta(dataIso)}
            {faculdadesRota.length > 0 ? ` • ${faculdadesRota.join(', ')}` : ''}
          </Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3E5F90" />
        </View>
      ) : erro ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erro}</Text>
          <Button mode="outlined" onPress={carregar}>
            Tentar novamente
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {formularios.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Não há veículos alocados para esta rota nesta data.
              </Text>
            </View>
          ) : (
            formularios.map((formulario, indice) => {
              const calculo = calcular(formulario);
              const opcoesOnibus = obterOpcoesOnibus(formulario);
              const opcoesMotoristas = obterOpcoesMotoristas(formulario);
              const tituloTurno = formulario.turno === 'ida' ? 'Ida' : 'Volta';

              return (
                <Surface key={formulario.chave} style={styles.veiculoCard} elevation={0}>
                  <View style={styles.veiculoHeader}>
                    <Text variant="titleMedium" style={styles.veiculoTitle}>
                      Veículo {indice + 1}
                    </Text>
                    <View style={styles.turnoBadge}>
                      <Text style={styles.turnoBadgeText}>{tituloTurno}</Text>
                    </View>
                  </View>

                  <View style={styles.inputBox}>
                    <Text variant="labelMedium" style={styles.inputLabel}>
                      Ônibus Vinculado *
                    </Text>
                    <TouchableOpacity
                      style={styles.selectBox}
                      onPress={() =>
                        abrirPicker('Selecione o Ônibus', opcoesOnibus, (valor) =>
                          atualizarFormulario(formulario.chave, 'onibusId', valor),
                        )
                      }
                    >
                      <View style={styles.selectLeftRow}>
                        <Bus size={20} color="#191C20" />
                        <Text style={styles.selectText}>
                          {getLabelPorValor(opcoesOnibus, formulario.onibusId)}
                        </Text>
                      </View>
                      <ChevronDown size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputBox}>
                    <Text variant="labelMedium" style={styles.inputLabel}>
                      Motorista *
                    </Text>
                    <TouchableOpacity
                      style={styles.selectBox}
                      onPress={() =>
                        abrirPicker('Selecione o Motorista', opcoesMotoristas, (valor) =>
                          atualizarFormulario(formulario.chave, 'motoristaId', valor),
                        )
                      }
                    >
                      <View style={styles.selectLeftRow}>
                        <User size={20} color="#191C20" />
                        <Text style={styles.selectText}>
                          {getLabelPorValor(opcoesMotoristas, formulario.motoristaId)}
                        </Text>
                      </View>
                      <ChevronDown size={20} color="#666" />
                    </TouchableOpacity>
                  </View>

                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Prévia da distribuição
                  </Text>
                  <Surface style={styles.previewCard} elevation={0}>
                    <Text
                      variant="titleMedium"
                      style={[
                        styles.previaQtdTitle,
                        !calculo.dentroDaCapacidade && styles.previaAlertText,
                      ]}
                    >
                      {calculo.total} alunos alocados
                    </Text>

                    <View style={styles.previewGridRow}>
                      <View style={styles.gridCol}>
                        <Text style={styles.gridLabel}>Quantidade Atual</Text>
                        <Text style={styles.gridValue}>
                          {calculo.sentados} sentados + {calculo.emPe} em pé
                        </Text>
                      </View>
                      <View style={styles.gridCol}>
                        <Text style={styles.gridLabel}>Capacidade Máxima</Text>
                        <Text style={styles.gridValue}>
                          {calculo.assentos} sentados + {calculo.capacidadeEmPe} em pé
                        </Text>
                      </View>
                    </View>

                    <View style={styles.previewHorarioRow}>
                      <View style={styles.gridColCentral}>
                        <Text style={styles.gridLabel}>
                          {formulario.turno === 'volta' ? 'Horário de Retorno' : 'Horário de Saída'}
                        </Text>
                        <Text style={styles.gridValue}>
                          {(formulario.turno === 'volta'
                            ? rota?.horario_retorno
                            : rota?.horario_saida) ?? '-'}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.capacityTag,
                        calculo.dentroDaCapacidade ? styles.capacityOk : styles.capacityOver,
                      ]}
                    >
                      {calculo.dentroDaCapacidade ? 'Dentro da Capacidade' : 'Fora da Capacidade'}
                    </Text>
                  </Surface>
                </Surface>
              );
            })
          )}

          <View style={styles.actionsContainer}>
            {excedentesRota > 0 ? (
              <Button
                mode="outlined"
                onPress={() =>
                  router.push({
                    pathname: '/(administrador)/logistica/excedentes',
                    params: { linhaId: String(linhaId), dataIso },
                  } as any)
                }
                style={styles.btnRealocar}
                contentStyle={styles.btnContent}
                textColor="#00639A"
              >
                Ver alunos excedentes
              </Button>
            ) : null}

            <Button
              mode="contained"
              onPress={handleIniciarAlocacao}
              loading={salvando}
              disabled={salvando || formularios.length === 0}
              style={styles.btnConfirmar}
              contentStyle={styles.btnContent}
              buttonColor="#3E5F90"
            >
              Confirmar alocação
            </Button>
          </View>
        </ScrollView>
      )}
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
    marginBottom: 20,
    gap: 12,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 20,
  },
  headerSubtitle: {
    color: '#74777F',
    fontSize: 13,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#74777F',
    textAlign: 'center',
  },
  veiculoCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  veiculoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  veiculoTitle: {
    fontWeight: 'bold',
    color: '#191C20',
  },
  turnoBadge: {
    backgroundColor: '#C2E7FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  turnoBadgeText: {
    color: '#001D36',
    fontWeight: 'bold',
    fontSize: 12,
  },
  inputBox: {
    marginBottom: 4,
  },
  inputLabel: {
    color: '#43474E',
    marginBottom: 6,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 8,
  },
  selectLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectText: {
    fontSize: 15,
    color: '#191C20',
    flex: 1,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginTop: 4,
  },
  previewCard: {
    backgroundColor: '#E8EDF7',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  previaQtdTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
  },
  previaAlertText: {
    color: '#8B261D',
  },
  previewGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48%',
  },
  previewHorarioRow: {
    alignItems: 'center',
  },
  gridColCentral: {
    alignItems: 'center',
  },
  gridLabel: {
    fontSize: 12,
    color: '#74777F',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191C20',
  },
  capacityTag: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4,
  },
  capacityOk: {
    color: '#00639A',
  },
  capacityOver: {
    color: '#8B261D',
  },
  actionsContainer: {
    marginTop: 20,
    gap: 12,
  },
  btnRealocar: {
    borderRadius: 24,
    borderColor: '#00639A',
  },
  btnConfirmar: {
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
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
  modalTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 16,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
  },
  optionText: {
    fontSize: 16,
    color: '#191C20',
  },
  optionEmpty: {
    color: '#74777F',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
