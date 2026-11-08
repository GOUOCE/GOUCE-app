import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, SegmentedButtons, Snackbar, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, X } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { agendamentoDiaSchema, AgendamentoDiaFormData } from '@/schemas/agendamentoSchema';
import { agendamentoService, OpcaoSelect, OpcoesAgendamentoResponse, AgendamentoDia, AgendamentoPayload } from '@/services/agendamentoService';
import { AppPopup } from '@/components/ui/AppPopup';

export default function ConfigurarAgendamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ datasIso?: string; modoEdicao?: string }>();

  const datasArray = (params.datasIso || '2026-09-02').split(',');
  const modoEdicao = params.modoEdicao === 'true';

  const [indiceDataAtual, setIndiceDataAtual] = useState(0);
  const dataIsoAtual = datasArray[indiceDataAtual] || '2026-09-02';

  const [opcoes, setOpcoes] = useState<OpcoesAgendamentoResponse | null>(null);
  const [agendamentosSalvos, setAgendamentosSalvos] = useState<AgendamentoDia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Dropdown generico
  const [modalPicker, setModalPicker] = useState<{
    visible: boolean;
    title: string;
    options: OpcaoSelect[];
    onSelect: (val: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    onSelect: () => {},
  });

  // Popup de Cancelamento (HU-014)
  const [popupCancelarVisible, setPopupCancelarVisible] = useState(false);

  // Snackbar Toast
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<AgendamentoDiaFormData>({
    resolver: zodResolver(agendamentoDiaSchema),
    defaultValues: {
      dataIso: dataIsoAtual,
      usaIda: true,
      pontoEmbarqueIda: '1',
      faculdadeDestinoIda: '1',
      rotaComplementarIda: '',
      usaVolta: true,
      pontoDesembarqueVolta: '1',
      faculdadeOrigemVolta: '1',
      rotaComplementarVolta: '',
    },
  });

  const usaIda = watch('usaIda');
  const usaVolta = watch('usaVolta');

  useEffect(() => {
    carregarOpcoes();
  }, []);

  useEffect(() => {
    setValue('dataIso', dataIsoAtual);
  }, [dataIsoAtual, setValue]);

  const carregarOpcoes = async () => {
    const opts = await agendamentoService.obterOpcoesAgendamento();
    setOpcoes(opts);
  };

  const abrirPicker = (title: string, options: OpcaoSelect[], onSelect: (val: string) => void) => {
    setModalPicker({ visible: true, title, options, onSelect });
  };

  const getLabelPorValor = (options: OpcaoSelect[] | undefined, val: string | undefined) => {
    if (!val || !options) return 'Selecionar';
    const achado = options.find(o => o.value === val);
    return achado ? achado.label : 'Selecionar';
  };

  const handleSalvarDia = async (dados: AgendamentoDiaFormData) => {
    const novoDia: AgendamentoDia = {
      ...dados,
      dataIso: dataIsoAtual,
    };

    const novaLista = [...agendamentosSalvos.filter(a => a.dataIso !== dataIsoAtual), novoDia];
    setAgendamentosSalvos(novaLista);

    // Mapear para payload da API /transporte/agendamentos (Sem horários conforme atualização da HU-013)
    const payloadApi: AgendamentoPayload = {
      data: dataIsoAtual,
      usa_ida: dados.usaIda,
      usa_volta: dados.usaVolta,
      ponto_embarque_id: dados.usaIda && dados.pontoEmbarqueIda ? Number(dados.pontoEmbarqueIda) : null,
      ies_destino_id: dados.usaIda && dados.faculdadeDestinoIda ? Number(dados.faculdadeDestinoIda) : null,
      rota_complementar_ida_id: dados.usaIda && dados.rotaComplementarIda ? Number(dados.rotaComplementarIda) : null,
      ponto_desembarque_id: dados.usaVolta && dados.pontoDesembarqueVolta ? Number(dados.pontoDesembarqueVolta) : null,
      ies_origem_id: dados.usaVolta && dados.faculdadeOrigemVolta ? Number(dados.faculdadeOrigemVolta) : null,
      rota_complementar_volta_id: dados.usaVolta && dados.rotaComplementarVolta ? Number(dados.rotaComplementarVolta) : null,
    };

    setIsLoading(true);
    try {
      if (modoEdicao) {
        await agendamentoService.atualizarAgendamento(1, payloadApi);
      } else {
        await agendamentoService.criarAgendamento(payloadApi);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }

    if (indiceDataAtual < datasArray.length - 1) {
      setIndiceDataAtual(indiceDataAtual + 1);
      setSnackbarMessage('Agendamento salvo. Avançando para o próximo dia.');
      setSnackbarVisivel(true);
    } else {
      router.push({
        pathname: '/(aluno)/agendar-transporte/sucesso',
        params: { agendamentosJson: JSON.stringify(novaLista) },
      } as any);
    }
  };

  const handleConfirmarCancelamento = async () => {
    setPopupCancelarVisible(false);
    setIsLoading(true);
    await agendamentoService.cancelarAgendamento(dataIsoAtual);
    setIsLoading(false);
    setSnackbarMessage('Agendamento cancelado com sucesso');
    setSnackbarVisivel(true);
    setTimeout(() => {
      router.replace('/(aluno)/home' as any);
    }, 1500);
  };

  const formatarDataCabecalho = (iso: string) => {
    if (iso === '2026-08-31') return 'Segunda-feira 31/08/2026';
    if (iso === '2026-09-01') return 'Terça-feira 01/09/2026';
    if (iso === '2026-09-02') return 'Quarta-feira 02/09/2026';
    if (iso === '2026-09-03') return 'Quinta-feira 03/09/2026';
    if (iso === '2026-09-04') return 'Sexta-feira 04/09/2026';
    return `Dia ${iso}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {formatarDataCabecalho(dataIsoAtual)}
        </Text>
      </View>

      {/* Tabs de Seleção de Datas */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {datasArray.map((dIso, idx) => {
            const isAtivo = idx === indiceDataAtual;
            const rotulo = dIso === '2026-08-31' ? 'Seg, 31/08' :
                           dIso === '2026-09-01' ? 'Ter, 01/09' :
                           dIso === '2026-09-02' ? 'Qua, 02/09' :
                           dIso === '2026-09-03' ? 'Qui, 03/09' :
                           dIso === '2026-09-04' ? 'Sex, 04/09' : dIso;

            return (
              <TouchableOpacity
                key={dIso}
                onPress={() => setIndiceDataAtual(idx)}
                style={[styles.tabButton, isAtivo && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isAtivo && styles.tabTextActive]}>{rotulo}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Popup de Confirmacao de Cancelamento (HU-014) */}
      <AppPopup
        visible={popupCancelarVisible}
        type="warning"
        title="Cancelar agendamento?"
        message="Esta ação não poderá ser desfeita."
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarCancelamento}
        onDismiss={() => setPopupCancelarVisible(false)}
      />

      {/* Modal Dropdown Picker */}
      <Modal visible={modalPicker.visible} transparent animationType="fade" onRequestClose={() => setModalPicker(prev => ({ ...prev, visible: false }))}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalPicker(prev => ({ ...prev, visible: false }))}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>{modalPicker.title}</Text>
            {modalPicker.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  modalPicker.onSelect(opt.value);
                  setModalPicker(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* SEÇÃO IDA */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Ida</Text>
        <Text variant="bodyMedium" style={styles.labelQuestion}>Vai usar o ônibus na ida?</Text>

        <Controller
          control={control}
          name="usaIda"
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value ? 'sim' : 'nao'}
              onValueChange={(val) => onChange(val === 'sim')}
              buttons={[
                { value: 'sim', label: 'Sim', style: value ? styles.segActive : styles.segInactive },
                { value: 'nao', label: 'Não', style: !value ? styles.segActive : styles.segInactive },
              ]}
              style={styles.segmentedBtn}
            />
          )}
        />

        {usaIda && (
          <View style={styles.fieldsGroup}>
            {/* Ponto de Embarque */}
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Ponto de embarque *</Text>
              <Controller
                control={control}
                name="pontoEmbarqueIda"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.pontoEmbarqueIda && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione o Ponto de Embarque', opcoes?.pontosEmbarque || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.pontosEmbarque, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.pontoEmbarqueIda && <Text style={styles.errorText}>{errors.pontoEmbarqueIda.message}</Text>}
            </View>

            {/* Faculdade de Destino */}
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Faculdade (IES) de destino *</Text>
              <Controller
                control={control}
                name="faculdadeDestinoIda"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.faculdadeDestinoIda && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione a Faculdade de Destino', opcoes?.faculdades || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.faculdades, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.faculdadeDestinoIda && <Text style={styles.errorText}>{errors.faculdadeDestinoIda.message}</Text>}
            </View>

            {/* Rota Complementar Ida */}
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Rota complementar (opcional)</Text>
              <Controller
                control={control}
                name="rotaComplementarIda"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => abrirPicker('Selecione a Rota Complementar', opcoes?.rotasComplementaresIda || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.rotasComplementaresIda, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}

        {/* SEÇÃO VOLTA */}
        <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>Volta</Text>
        <Text variant="bodyMedium" style={styles.labelQuestion}>Vai usar o ônibus na volta?</Text>

        <Controller
          control={control}
          name="usaVolta"
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value ? 'sim' : 'nao'}
              onValueChange={(val) => onChange(val === 'sim')}
              buttons={[
                { value: 'sim', label: 'Sim', style: value ? styles.segActive : styles.segInactive },
                { value: 'nao', label: 'Não', style: !value ? styles.segActive : styles.segInactive },
              ]}
              style={styles.segmentedBtn}
            />
          )}
        />

        {usaVolta && (
          <View style={styles.fieldsGroup}>
            {/* Faculdade de Origem */}
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Faculdade de origem *</Text>
              <Controller
                control={control}
                name="faculdadeOrigemVolta"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.faculdadeOrigemVolta && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione a Faculdade de Origem', opcoes?.faculdades || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.faculdades, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.faculdadeOrigemVolta && <Text style={styles.errorText}>{errors.faculdadeOrigemVolta.message}</Text>}
            </View>

            {/* Ponto de Desembarque */}
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Ponto de desembarque *</Text>
              <Controller
                control={control}
                name="pontoDesembarqueVolta"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.pontoDesembarqueVolta && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione o Ponto de Desembarque', opcoes?.pontosEmbarque || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.pontosEmbarque, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.pontoDesembarqueVolta && <Text style={styles.errorText}>{errors.pontoDesembarqueVolta.message}</Text>}
            </View>

            {/* Rota Complementar Volta */}
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Rota complementar de volta (opcional)</Text>
              <Controller
                control={control}
                name="rotaComplementarVolta"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => abrirPicker('Selecione a Rota Complementar de Volta', opcoes?.rotasComplementaresVolta || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.rotasComplementaresVolta, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}

        {/* BOTÕES DE AÇÃO */}
        <View style={styles.actionsContainer}>
          {modoEdicao && (
            <Button
              mode="outlined"
              onPress={() => setPopupCancelarVisible(true)}
              textColor="#B00020"
              style={styles.cancelBtn}
              contentStyle={styles.btnContent}
            >
              Cancelar Agendamento
            </Button>
          )}

          <Button
            mode="contained"
            onPress={() => { void handleSubmit(handleSalvarDia)(); }}
            loading={isLoading}
            disabled={isLoading}
            style={styles.saveBtn}
            contentStyle={styles.btnContent}
          >
            {modoEdicao
              ? 'Salvar alterações'
              : indiceDataAtual < datasArray.length - 1
              ? 'Salvar dia e ir para o próximo'
              : 'Confirmar agendamento'}
          </Button>
        </View>
      </ScrollView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 20,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsRow: {
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E2EC',
  },
  tabButtonActive: {
    backgroundColor: '#C2E7FF',
  },
  tabText: {
    fontSize: 14,
    color: '#43474E',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#001D36',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 8,
  },
  labelQuestion: {
    color: '#43474E',
    marginBottom: 12,
  },
  segmentedBtn: {
    marginBottom: 20,
    width: 160,
  },
  segActive: {
    backgroundColor: '#00639A',
  },
  segInactive: {
    backgroundColor: '#FFF',
  },
  fieldsGroup: {
    gap: 16,
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
  selectBoxError: {
    borderColor: '#BA1A1A',
    borderWidth: 1.5,
  },
  selectText: {
    fontSize: 15,
    color: '#191C20',
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 12,
    marginTop: 4,
  },
  actionsContainer: {
    marginTop: 32,
    gap: 12,
  },
  saveBtn: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  cancelBtn: {
    borderRadius: 8,
    borderColor: '#BA1A1A',
  },
  btnContent: {
    height: 55,
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
  snackbar: {
    backgroundColor: '#322F35',
  },
});
