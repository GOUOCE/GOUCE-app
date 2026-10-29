import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Checkbox, Portal, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, GitCommit, Clock, Building2, ChevronDown, Trash2, X } from 'lucide-react-native';

import { rotaPrincipalSchema, RotaPrincipalFormData } from '@/schemas/rotaPrincipalSchema';
import {
  rotaPrincipalService,
  FaculdadeOpcao,
  BairroOpcao,
} from '@/services/rotaPrincipalService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarRotaPrincipalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [faculdadesAtivas, setFaculdadesAtivas] = useState<FaculdadeOpcao[]>([]);
  const [bairrosAtivos, setBairrosAtivos] = useState<BairroOpcao[]>([]);

  const [facsIdaSelecionadas, setFacsIdaSelecionadas] = useState<number[]>([]);
  const [facsVoltaSelecionadas, setFacsVoltaSelecionadas] = useState<number[]>([]);
  const [bairrosVinculadosIds, setBairrosVinculadosIds] = useState<number[]>([]);

  const [modalFacsIdaVisible, setModalFacsIdaVisible] = useState(false);
  const [modalFacsVoltaVisible, setModalFacsVoltaVisible] = useState(false);
  const [modalVincularBairroVisible, setModalVincularBairroVisible] = useState(false);
  const [modalSaidaVisible, setModalSaidaVisible] = useState(false);
  const [modalRetornoVisible, setModalRetornoVisible] = useState(false);

  const [bairroParaVincularId, setBairroParaVincularId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Snackbar Toast
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  // Pop-up Estilizado
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showPopup = (config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/rotas-principais');
  };

  const { control, handleSubmit, formState: { errors }, reset, setValue, trigger } = useForm<RotaPrincipalFormData>({
    resolver: zodResolver(rotaPrincipalSchema),
    defaultValues: {
      nome: '',
      horarioSaida: '06:40',
      horarioRetorno: '17:30',
      faculdadesIdaIds: [],
      faculdadesVoltaIds: [],
      bairrosIds: [],
    },
  });

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        const [facs, bairros] = await Promise.all([
          rotaPrincipalService.listarFaculdadesAtivas(),
          rotaPrincipalService.listarBairrosAtivos(),
        ]);
        setFaculdadesAtivas(facs);
        setBairrosAtivos(bairros);

        const r = await rotaPrincipalService.obterRotaPrincipalPorId(Number(id));
        if (r) {
          const idaIds = r.faculdades_ida.map((f) => f.id);
          const voltaIds = r.faculdades_volta.map((f) => f.id);
          const bairrosIds = r.bairros.map((b) => b.id);

          setFacsIdaSelecionadas(idaIds);
          setFacsVoltaSelecionadas(voltaIds);
          setBairrosVinculadosIds(bairrosIds);

          reset({
            nome: r.nome,
            horarioSaida: r.horario_saida,
            horarioRetorno: r.horario_retorno,
            faculdadesIdaIds: idaIds,
            faculdadesVoltaIds: voltaIds,
            bairrosIds: bairrosIds,
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar dados da rota principal:', err);
      }
    }
    carregarDados();
  }, [id, reset]);

  const toggleFaculdadeIda = (idFac: number) => {
    const novos = facsIdaSelecionadas.includes(idFac)
      ? facsIdaSelecionadas.filter((fId) => fId !== idFac)
      : [...facsIdaSelecionadas, idFac];
    setFacsIdaSelecionadas(novos);
    setValue('faculdadesIdaIds', novos);
    trigger('faculdadesIdaIds');
  };

  const toggleFaculdadeVolta = (idFac: number) => {
    const novos = facsVoltaSelecionadas.includes(idFac)
      ? facsVoltaSelecionadas.filter((fId) => fId !== idFac)
      : [...facsVoltaSelecionadas, idFac];
    setFacsVoltaSelecionadas(novos);
    setValue('faculdadesVoltaIds', novos);
    trigger('faculdadesVoltaIds');
  };

  const handleVincularBairro = () => {
    if (!bairroParaVincularId) return;
    if (!bairrosVinculadosIds.includes(bairroParaVincularId)) {
      const novos = [...bairrosVinculadosIds, bairroParaVincularId];
      setBairrosVinculadosIds(novos);
      setValue('bairrosIds', novos);
      trigger('bairrosIds');
    }
    setModalVincularBairroVisible(false);
  };

  const handleDesvincularBairro = (idBairro: number) => {
    const novos = bairrosVinculadosIds.filter((bId) => bId !== idBairro);
    setBairrosVinculadosIds(novos);
    setValue('bairrosIds', novos);
    trigger('bairrosIds');
  };

  const onSubmit = async (dados: RotaPrincipalFormData) => {
    if (!id) return;
    setIsLoading(true);
    try {
      await rotaPrincipalService.atualizarRotaPrincipal(Number(id), {
        nome: dados.nome,
        horarioSaida: dados.horarioSaida,
        horarioRetorno: dados.horarioRetorno,
        faculdadesIdaIds: dados.faculdadesIdaIds,
        faculdadesVoltaIds: dados.faculdadesVoltaIds,
        bairrosIds: dados.bairrosIds,
      });
      setIsLoading(false);
      setSnackbarMessage('Rota alterada com sucesso');
      setSnackbarVisivel(true);
      setTimeout(() => {
        router.replace('/(administrador)/rotas-principais');
      }, 1200);
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao atualizar rota principal.');
      showPopup({
        type: 'error',
        title: 'Aviso',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  const resumoFacsIda = facsIdaSelecionadas.length > 0
    ? `${facsIdaSelecionadas.length} - ${faculdadesAtivas.filter((f) => facsIdaSelecionadas.includes(f.id)).map((f) => f.sigla).join(', ')}`
    : 'Selecionar';

  const resumoFacsVolta = facsVoltaSelecionadas.length > 0
    ? `${facsVoltaSelecionadas.length} - ${faculdadesAtivas.filter((f) => facsVoltaSelecionadas.includes(f.id)).map((f) => f.sigla).join(', ')}`
    : 'Selecionar';

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarParaListagem}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Rota</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        onConfirm={popup.onConfirm}
        onDismiss={closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Nome da Rota */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome da Rota *"
                mode="outlined"
                placeholder="ex.: Linha 01 - Centro"
                value={value}
                onChangeText={onChange}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <GitCommit size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Horários de Saída e Retorno */}
        <View style={styles.rowInputs}>
          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="horarioSaida"
              render={({ field: { value } }) => (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setModalSaidaVisible(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      label="Horário de Saída *"
                      mode="outlined"
                      value={value || 'Selecionar'}
                      editable={false}
                      error={!!errors.horarioSaida}
                      left={<TextInput.Icon icon={() => <Clock size={20} color="#666" />} />}
                      style={styles.input}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
            {errors.horarioSaida && <Text style={styles.errorText}>{errors.horarioSaida.message}</Text>}
          </View>

          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="horarioRetorno"
              render={({ field: { value } }) => (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setModalRetornoVisible(true)}>
                  <View pointerEvents="none">
                    <TextInput
                      label="Horário de Retorno *"
                      mode="outlined"
                      value={value || 'Selecionar'}
                      editable={false}
                      error={!!errors.horarioRetorno}
                      left={<TextInput.Icon icon={() => <Clock size={20} color="#666" />} />}
                      style={styles.input}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
            {errors.horarioRetorno && <Text style={styles.errorText}>{errors.horarioRetorno.message}</Text>}
          </View>
        </View>

        {/* Faculdades de Ida (Destino) */}
        <View style={styles.inputBox}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setModalFacsIdaVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Faculdades de Ida (Destino) *"
                mode="outlined"
                value={resumoFacsIda}
                editable={false}
                error={!!errors.faculdadesIdaIds}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={() => setModalFacsIdaVisible(true)} />}
                style={styles.input}
              />
            </View>
          </TouchableOpacity>
          {errors.faculdadesIdaIds && <Text style={styles.errorText}>{errors.faculdadesIdaIds.message}</Text>}
        </View>

        {/* Faculdades de Volta (Origem) */}
        <View style={styles.inputBox}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setModalFacsVoltaVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Faculdades de Volta (Origem) *"
                mode="outlined"
                value={resumoFacsVolta}
                editable={false}
                error={!!errors.faculdadesVoltaIds}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={() => setModalFacsVoltaVisible(true)} />}
                style={styles.input}
              />
            </View>
          </TouchableOpacity>
          {errors.faculdadesVoltaIds && <Text style={styles.errorText}>{errors.faculdadesVoltaIds.message}</Text>}
        </View>

        {/* Seção Bairros vinculados */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Bairros vinculados</Text>

        <View style={styles.bairrosList}>
          {bairrosAtivos
            .filter((b) => bairrosVinculadosIds.includes(b.id))
            .map((bairro) => (
              <View key={bairro.id} style={styles.bairroRow}>
                <Text variant="bodyLarge" style={styles.bairroName}>{bairro.nome}</Text>
                <TouchableOpacity onPress={() => handleDesvincularBairro(bairro.id)}>
                  <Trash2 size={20} color="#333" />
                </TouchableOpacity>
              </View>
            ))}

          {errors.bairrosIds && <Text style={styles.errorText}>{errors.bairrosIds.message}</Text>}
        </View>

        {/* Botão Vincular bairro */}
        <Button
          mode="outlined"
          onPress={() => setModalVincularBairroVisible(true)}
          style={styles.vincularButton}
          labelStyle={styles.vincularLabel}
        >
          Vincular bairro
        </Button>

        {/* Botão Salvar Alterações */}
        <Button
          mode="contained"
          onPress={() => { void handleSubmit(onSubmit)(); }}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Salvar alterações
        </Button>
      </ScrollView>

      {/* Modal Faculdades de Ida */}
      <Portal>
        <RNModal visible={modalFacsIdaVisible} transparent={true} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalFacsIdaVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text variant="titleLarge" style={styles.modalTitle}>Faculdades de Ida (Destino)</Text>
              <Text variant="bodySmall" style={styles.modalSubtitle}>Selecione todas as faculdades presentes na rota de ida.</Text>

              {faculdadesAtivas.map((fac) => (
                <TouchableOpacity
                  key={fac.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleFaculdadeIda(fac.id)}
                >
                  <Text style={styles.checkboxLabel}>{fac.sigla}</Text>
                  <Checkbox.Android
                    status={facsIdaSelecionadas.includes(fac.id) ? 'checked' : 'unchecked'}
                    color="#3E5F90"
                    onPress={() => toggleFaculdadeIda(fac.id)}
                  />
                </TouchableOpacity>
              ))}

              <View style={styles.modalActionButtons}>
                <Button mode="text" onPress={() => setModalFacsIdaVisible(false)}>Cancelar</Button>
                <Button mode="text" onPress={() => setModalFacsIdaVisible(false)} labelStyle={{ color: '#004D40', fontWeight: 'bold' }}>Confirmar</Button>
              </View>
            </View>
          </TouchableOpacity>
        </RNModal>
      </Portal>

      {/* Modal Faculdades de Volta */}
      <Portal>
        <RNModal visible={modalFacsVoltaVisible} transparent={true} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalFacsVoltaVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text variant="titleLarge" style={styles.modalTitle}>Faculdades de Volta (Origem)</Text>
              <Text variant="bodySmall" style={styles.modalSubtitle}>Selecione todas as faculdades presentes na rota de volta.</Text>

              {faculdadesAtivas.map((fac) => (
                <TouchableOpacity
                  key={fac.id}
                  style={styles.checkboxRow}
                  onPress={() => toggleFaculdadeVolta(fac.id)}
                >
                  <Text style={styles.checkboxLabel}>{fac.sigla}</Text>
                  <Checkbox.Android
                    status={facsVoltaSelecionadas.includes(fac.id) ? 'checked' : 'unchecked'}
                    color="#3E5F90"
                    onPress={() => toggleFaculdadeVolta(fac.id)}
                  />
                </TouchableOpacity>
              ))}

              <View style={styles.modalActionButtons}>
                <Button mode="text" onPress={() => setModalFacsVoltaVisible(false)}>Cancelar</Button>
                <Button mode="text" onPress={() => setModalFacsVoltaVisible(false)} labelStyle={{ color: '#004D40', fontWeight: 'bold' }}>Confirmar</Button>
              </View>
            </View>
          </TouchableOpacity>
        </RNModal>
      </Portal>

      {/* Modal Vincular Bairro */}
      <Portal>
        <RNModal visible={modalVincularBairroVisible} transparent={true} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVincularBairroVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text variant="titleLarge" style={styles.modalTitle}>Vincular bairro</Text>
              <Text variant="bodySmall" style={styles.modalSubtitle}>Selecione o bairro a ser vinculado.</Text>

              <View style={styles.inputBox}>
                {bairrosAtivos.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={styles.optionItem}
                    onPress={() => setBairroParaVincularId(b.id)}
                  >
                    <Text style={[styles.optionText, bairroParaVincularId === b.id && { color: '#3E5F90', fontWeight: 'bold' }]}>
                      {b.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActionButtons}>
                <Button mode="text" onPress={() => setModalVincularBairroVisible(false)}>Cancelar</Button>
                <Button mode="text" onPress={handleVincularBairro} labelStyle={{ color: '#004D40', fontWeight: 'bold' }}>Vincular</Button>
              </View>
            </View>
          </TouchableOpacity>
        </RNModal>
      </Portal>

      {/* Modais de Horário de Saída e Retorno */}
      <Portal>
        <RNModal visible={modalSaidaVisible} transparent={true} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalSaidaVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text variant="titleLarge" style={styles.modalTitle}>Horário de Saída</Text>
              {['06:00', '06:10', '06:20', '06:30', '06:40', '07:00'].map((h) => (
                <TouchableOpacity key={h} style={styles.optionItem} onPress={() => { setValue('horarioSaida', h); setModalSaidaVisible(false); }}>
                  <Text style={styles.optionText}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </RNModal>
      </Portal>

      <Portal>
        <RNModal visible={modalRetornoVisible} transparent={true} animationType="fade">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalRetornoVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text variant="titleLarge" style={styles.modalTitle}>Horário de Retorno</Text>
              {['11:30', '12:00', '17:00', '17:30', '18:00', '22:00'].map((h) => (
                <TouchableOpacity key={h} style={styles.optionItem} onPress={() => { setValue('horarioRetorno', h); setModalRetornoVisible(false); }}>
                  <Text style={styles.optionText}>{h}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </RNModal>
      </Portal>

      {/* Toast Snackbar */}
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
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputBox: {
    marginBottom: 20,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInputBox: {
    flex: 1,
  },
  input: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bairrosList: {
    marginBottom: 16,
  },
  bairroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  bairroName: {
    color: '#333',
    fontSize: 16,
  },
  vincularButton: {
    borderColor: '#3E5F90',
    borderRadius: 8,
    marginBottom: 32,
  },
  vincularLabel: {
    color: '#3E5F90',
    fontWeight: 'bold',
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  buttonContent: {
    height: 55,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: '#666',
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  optionItem: {
    paddingVertical: 12,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
