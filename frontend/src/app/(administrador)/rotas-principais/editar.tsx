import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Checkbox, RadioButton, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, GitCommit, Building2, ChevronDown, Trash2 } from 'lucide-react-native';

import { rotaPrincipalSchema, RotaPrincipalFormData } from '@/schemas/rotaPrincipalSchema';
import {
  rotaPrincipalService,
  FaculdadeOpcao,
  BairroOpcao,
} from '@/services/rotaPrincipalService';
import { getErrorMessage } from '@/utils/errorUtils';
import { formatarInstituicao } from '@/utils/formatarInstituicao';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { CampoHorario } from '@/components/ui/CampoHorario';
import { CampoTextoRotulado } from '@/components/ui/CampoTextoRotulado';

// Campo fechado: "SIGLA - Campus", como em Faculdades; sem sigla, o nome no lugar (#344)
const rotuloFaculdade = (f: FaculdadeOpcao) =>
  formatarInstituicao({ sigla: f.sigla, nome_faculdade: f.nome, campus: f.campus });

// Valores do formulário vazio; a tela volta a eles ao ganhar e ao perder o foco (#341).
// Nenhum campo obrigatório vem preenchido: o administrador escolhe tudo (#337)
const VALORES_INICIAIS: RotaPrincipalFormData = {
  nome: '',
  horarioSaida: '',
  horarioRetorno: '',
  faculdadesIdaIds: [],
  faculdadesVoltaIds: [],
  bairrosIds: [],
};

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

  const [bairroParaVincularId, setBairroParaVincularId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Pop-up Estilizado
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showPopup = React.useCallback((config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  }, []);

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/rotas-principais');
  };

  // Alteração não salva pede confirmação antes de sair, como nas edições do épico 02 (#342)
  const handleBack = () => {
    if (isDirty) {
      showPopup({
        type: 'warning',
        title: 'Sair desta tela?',
        message: 'As alterações não salvas serão perdidas.',
        confirmText: 'Sim, sair',
        cancelText: 'Continuar aqui',
        confirmColor: '#B00020',
        onConfirm: voltarParaListagem,
      });
    } else {
      voltarParaListagem();
    }
  };

  const { control, handleSubmit, formState: { errors, isDirty, isSubmitted }, reset, setValue, trigger, clearErrors } = useForm<RotaPrincipalFormData>({
    resolver: zodResolver(rotaPrincipalSchema),
    defaultValues: VALORES_INICIAIS,
  });

  const limparFormulario = React.useCallback(() => {
    reset(VALORES_INICIAIS);
    setFacsIdaSelecionadas([]);
    setFacsVoltaSelecionadas([]);
    setBairrosVinculadosIds([]);
    setBairroParaVincularId(undefined);
    setDadosCarregados(false);
  }, [reset]);

  // Recarrega a rota escolhida e as opções ativas ao ganhar foco e descarta o que não foi salvo ao sair (#341)
  useFocusEffect(
    React.useCallback(() => {
      let ativa = true;
      limparFormulario();

      async function carregarDados() {
        if (!id) return;
        try {
          const [{ faculdades: facs, bairros }, r] = await Promise.all([
            rotaPrincipalService.listarOpcoes(),
            rotaPrincipalService.obterRotaPrincipalPorId(Number(id)),
          ]);
          if (!ativa) return;
          setFaculdadesAtivas(facs);
          setBairrosAtivos(bairros);

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
          setDadosCarregados(true);
        } catch (err) {
          if (!ativa) return;
          showPopup({
            type: 'error',
            title: 'Erro de Conexão',
            message: getErrorMessage(err, 'Erro ao carregar dados da rota principal.'),
            confirmText: 'Entendido',
            onConfirm: () => {
              closePopup();
              router.replace('/(administrador)/rotas-principais');
            },
          });
        }
      }
      carregarDados();

      return () => {
        ativa = false;
        limparFormulario();
      };
    }, [id, limparFormulario, reset, showPopup, router])
  );

  // Erro só aparece depois de tentar salvar; apagar o campo tira o erro (padrão da HU-010)
  const atualizarCampo = (campo: 'nome' | 'horarioSaida' | 'horarioRetorno', valor: string) => {
    const preenchido = valor.trim() !== '';
    setValue(campo, valor, { shouldDirty: true, shouldValidate: preenchido && isSubmitted });
    if (!preenchido) clearErrors(campo);
    // Trocar um horário depois de tentar salvar reconfere os dois: a regra de retorno depois da saída depende de ambos
    if (campo !== 'nome' && isSubmitted) trigger(['horarioSaida', 'horarioRetorno']);
  };

  const toggleFaculdadeIda = (idFac: number) => {
    const novos = facsIdaSelecionadas.includes(idFac)
      ? facsIdaSelecionadas.filter((fId) => fId !== idFac)
      : [...facsIdaSelecionadas, idFac];
    setFacsIdaSelecionadas(novos);
    setValue('faculdadesIdaIds', novos, { shouldDirty: true, shouldValidate: isSubmitted });
  };

  const toggleFaculdadeVolta = (idFac: number) => {
    const novos = facsVoltaSelecionadas.includes(idFac)
      ? facsVoltaSelecionadas.filter((fId) => fId !== idFac)
      : [...facsVoltaSelecionadas, idFac];
    setFacsVoltaSelecionadas(novos);
    setValue('faculdadesVoltaIds', novos, { shouldDirty: true, shouldValidate: isSubmitted });
  };

  const handleVincularBairro = () => {
    if (!bairroParaVincularId) return;
    if (!bairrosVinculadosIds.includes(bairroParaVincularId)) {
      const novos = [...bairrosVinculadosIds, bairroParaVincularId];
      setBairrosVinculadosIds(novos);
      setValue('bairrosIds', novos, { shouldDirty: true, shouldValidate: isSubmitted });
    }
    setModalVincularBairroVisible(false);
  };

  const bairrosDisponiveis = bairrosAtivos.filter((b) => !bairrosVinculadosIds.includes(b.id));

  const abrirVincularBairro = () => {
    setBairroParaVincularId(undefined);
    setModalVincularBairroVisible(true);
  };

  // A lixeira pede confirmação antes de tirar o bairro da rota (#346)
  const handleDesvincularBairro = (bairro: BairroOpcao) => {
    showPopup({
      type: 'warning',
      title: 'Remover bairro?',
      message: `O bairro ${bairro.nome} será removido desta rota.`,
      confirmText: 'Remover',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: () => {
        closePopup();
        const novos = bairrosVinculadosIds.filter((bId) => bId !== bairro.id);
        setBairrosVinculadosIds(novos);
        setValue('bairrosIds', novos, { shouldDirty: true, shouldValidate: isSubmitted });
      },
    });
  };

  const onSubmit = async (dados: RotaPrincipalFormData) => {
    if (!id || !dadosCarregados) return;
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
      showPopup({
        type: 'success',
        title: 'Operação realizada com sucesso',
        message: 'As alterações da rota foram salvas.',
        confirmText: 'OK',
        onConfirm: voltarParaListagem,
      });
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao atualizar rota principal.');
      showPopup({
        type: 'error',
        title: msg.startsWith('Erro de conexão') ? 'Erro de Conexão' : 'Aviso',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  const resumoFacsIda = faculdadesAtivas
    .filter((f) => facsIdaSelecionadas.includes(f.id))
    .map(rotuloFaculdade)
    .join(', ');

  const resumoFacsVolta = faculdadesAtivas
    .filter((f) => facsVoltaSelecionadas.includes(f.id))
    .map(rotuloFaculdade)
    .join(', ');

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
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
        cancelText={popup.cancelText}
        confirmColor={popup.confirmColor}
        onConfirm={popup.onConfirm}
        onDismiss={popup.type === 'success' ? voltarParaListagem : closePopup}
      />

      {!dadosCarregados ? <ActivityIndicator style={styles.carregando} accessibilityLabel="Carregando rota" /> : <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Nome da Rota */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { value } }) => (
              <CampoTextoRotulado
                rotulo="Nome da Rota *"
                placeholder="ex.: Linha 01 - Centro"
                value={value}
                onChangeText={(texto) => atualizarCampo('nome', texto)}
                maxLength={150}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <GitCommit size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Horários de Saída e Retorno lado a lado, como no protótipo: relógio de 24 h (#340) */}
        <View style={styles.rowInputs}>
          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="horarioSaida"
              render={({ field: { value } }) => (
                <CampoHorario
                  label="Horário de Saída *"
                  value={value}
                  onChange={(horario) => atualizarCampo('horarioSaida', horario)}
                  error={!!errors.horarioSaida}
                />
              )}
            />
            {errors.horarioSaida && <Text style={styles.errorText}>{errors.horarioSaida.message}</Text>}
          </View>

          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="horarioRetorno"
              render={({ field: { value } }) => (
                <CampoHorario
                  label="Horário de Retorno *"
                  value={value}
                  onChange={(horario) => atualizarCampo('horarioRetorno', horario)}
                  error={!!errors.horarioRetorno}
                />
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
                value={resumoFacsIda || 'Selecionar'}
                editable={false}
                textColor={resumoFacsIda ? '#191C20' : '#74777F'}
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
                value={resumoFacsVolta || 'Selecionar'}
                editable={false}
                textColor={resumoFacsVolta ? '#191C20' : '#74777F'}
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
                <TouchableOpacity onPress={() => handleDesvincularBairro(bairro)} accessibilityLabel={`Remover ${bairro.nome}`}>
                  <Trash2 size={20} color="#333" />
                </TouchableOpacity>
              </View>
            ))}

          {errors.bairrosIds && <Text style={styles.errorText}>{errors.bairrosIds.message}</Text>}
        </View>

        {/* Botão Vincular bairro */}
        <Button
          mode="outlined"
          onPress={abrirVincularBairro}
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
      </ScrollView>}

      {/* Modal Faculdades de Ida */}
      <RNModal visible={modalFacsIdaVisible} transparent={true} animationType="none">
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
                {/* Texto com largura fixa ao lado do checkbox: não quebra diferente na primeira abertura */}
                <View style={styles.checkboxTexto}>
                  <Text style={styles.checkboxLabel}>{fac.nome}</Text>
                  <Text style={styles.checkboxSub}>{rotuloFaculdade(fac)}</Text>
                </View>
                <View pointerEvents="none">
                  <Checkbox.Android
                    status={facsIdaSelecionadas.includes(fac.id) ? 'checked' : 'unchecked'}
                    color="#3E5F90"
                  />
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActionButtons}>
              <Button mode="text" onPress={() => setModalFacsIdaVisible(false)}>Cancelar</Button>
              <Button mode="text" onPress={() => setModalFacsIdaVisible(false)} labelStyle={{ color: '#004D40', fontWeight: 'bold' }}>Confirmar</Button>
            </View>
          </View>
        </TouchableOpacity>
      </RNModal>

      {/* Modal Faculdades de Volta */}
      <RNModal visible={modalFacsVoltaVisible} transparent={true} animationType="none">
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
                {/* Texto com largura fixa ao lado do checkbox: não quebra diferente na primeira abertura */}
                <View style={styles.checkboxTexto}>
                  <Text style={styles.checkboxLabel}>{fac.nome}</Text>
                  <Text style={styles.checkboxSub}>{rotuloFaculdade(fac)}</Text>
                </View>
                <View pointerEvents="none">
                  <Checkbox.Android
                    status={facsVoltaSelecionadas.includes(fac.id) ? 'checked' : 'unchecked'}
                    color="#3E5F90"
                  />
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.modalActionButtons}>
              <Button mode="text" onPress={() => setModalFacsVoltaVisible(false)}>Cancelar</Button>
              <Button mode="text" onPress={() => setModalFacsVoltaVisible(false)} labelStyle={{ color: '#004D40', fontWeight: 'bold' }}>Confirmar</Button>
            </View>
          </View>
        </TouchableOpacity>
      </RNModal>

      {/* Modal Vincular Bairro */}
      <RNModal visible={modalVincularBairroVisible} transparent={true} animationType="none">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVincularBairroVisible(false)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text variant="titleLarge" style={styles.modalTitle}>Vincular bairro</Text>
            <Text variant="bodySmall" style={styles.modalSubtitle}>Selecione o bairro a ser vinculado.</Text>

            {/* Só bairros ainda não vinculados; o escolhido fica marcado (#346) */}
            {bairrosDisponiveis.length === 0 ? (
              <Text style={styles.optionText}>Todos os bairros ativos já estão vinculados a esta rota.</Text>
            ) : (
              <RadioButton.Group
                value={bairroParaVincularId ? String(bairroParaVincularId) : ''}
                onValueChange={(valor) => setBairroParaVincularId(Number(valor))}
              >
                {bairrosDisponiveis.map((b) => (
                  <RadioButton.Item
                    key={b.id}
                    label={b.nome}
                    value={String(b.id)}
                    mode="android"
                    color="#3E5F90"
                    position="leading"
                    labelStyle={styles.radioLabel}
                    style={styles.radioItem}
                  />
                ))}
              </RadioButton.Group>
            )}

            <View style={styles.modalActionButtons}>
              <Button mode="text" onPress={() => setModalVincularBairroVisible(false)}>Cancelar</Button>
              <Button mode="text" onPress={handleVincularBairro} disabled={!bairroParaVincularId} labelStyle={bairroParaVincularId ? { color: '#004D40', fontWeight: 'bold' } : undefined}>Vincular</Button>
            </View>
          </View>
        </TouchableOpacity>
      </RNModal>
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
  carregando: {
    marginTop: 32,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInputBox: {
    flex: 1,
    marginBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputBox: {
    marginBottom: 20,
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
  checkboxTexto: {
    flex: 1,
    marginRight: 8,
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  checkboxSub: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  radioItem: {
    paddingHorizontal: 0,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
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
});
