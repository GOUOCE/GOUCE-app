import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Building2, ChevronDown, GitFork, MapPin } from 'lucide-react-native';

import { rotaComplementarSchema, RotaComplementarFormData } from '@/schemas/rotaComplementarSchema';
import { rotaComplementarService, RotaPrincipalSimples } from '@/services/rotaComplementarService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { CampoHorario } from '@/components/ui/CampoHorario';
import { CampoTextoRotulado } from '@/components/ui/CampoTextoRotulado';

export default function CadastrarRotaComplementarScreen() {
  const router = useRouter();

  const [rotasPrincipaisAtivas, setRotasPrincipaisAtivas] = useState<RotaPrincipalSimples[]>([]);
  const [modalRotaVisible, setModalRotaVisible] = useState(false);
  const [rotaSelecionadaNome, setRotaSelecionadaNome] = useState('');
  const [rotaParaVincularId, setRotaParaVincularId] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Pop-up Estilizado
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
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

  // A seta e o sucesso voltam sempre para a listagem, não para o Painel (#360)
  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/rotas-complementares');
  };

  const { control, handleSubmit, formState: { errors, isSubmitted }, setValue, getValues, trigger, clearErrors } = useForm<RotaComplementarFormData>({
    resolver: zodResolver(rotaComplementarSchema),
    defaultValues: {
      rotaPrincipalId: undefined,
      nome: '',
      horarioSaida: '',
      horarioRetorno: '',
      pontoConexao: '',
    },
  });

  useEffect(() => {
    async function carregarRotasPrincipais() {
      try {
        const ativas = await rotaComplementarService.listarRotasPrincipaisAtivas();
        // Nenhuma rota principal vem marcada: o administrador escolhe (#355)
        setRotasPrincipaisAtivas(ativas);
      } catch (err) {
        showPopup({
          type: 'error',
          title: 'Erro de Conexão',
          message: getErrorMessage(err, 'Erro ao carregar rotas principais.'),
          confirmText: 'Entendido',
        });
      }
    }
    carregarRotasPrincipais();
  }, [showPopup]);

  // Erro só aparece depois de tentar salvar; apagar o campo tira o erro (padrão da HU-010) (#356)
  const atualizarCampo = (campo: 'nome' | 'pontoConexao', valor: string) => {
    const preenchido = valor.trim() !== '';
    setValue(campo, valor, { shouldDirty: true, shouldValidate: preenchido && isSubmitted });
    if (!preenchido) clearErrors(campo);
  };

  // Trocar um horário depois de tentar salvar reconfere os dois: o retorno depende da saída (#350)
  const atualizarHorario = (campo: 'horarioSaida' | 'horarioRetorno', horario: string) => {
    setValue(campo, horario, { shouldDirty: true });
    if (isSubmitted) trigger(['horarioSaida', 'horarioRetorno']);
  };

  const abrirSeletorRota = () => {
    setRotaParaVincularId(getValues('rotaPrincipalId') || undefined);
    setModalRotaVisible(true);
  };

  const confirmarRotaPrincipal = () => {
    const escolhida = rotasPrincipaisAtivas.find((rp) => rp.id === rotaParaVincularId);
    if (!escolhida) return;
    setValue('rotaPrincipalId', escolhida.id, { shouldDirty: true, shouldValidate: isSubmitted });
    setRotaSelecionadaNome(escolhida.nome);
    setModalRotaVisible(false);
  };

  const onSubmit = (dados: RotaComplementarFormData) => {
    showPopup({
      type: 'info',
      title: 'Realizar cadastro?',
      message: 'Essa ação não poderá ser desfeita.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        setIsLoading(true);
        try {
          await rotaComplementarService.criarRotaComplementar({
            nome: dados.nome,
            rotaPrincipalId: Number(dados.rotaPrincipalId),
            horarioSaida: dados.horarioSaida,
        horarioRetorno: dados.horarioRetorno,
            pontoConexao: dados.pontoConexao,
          });
          setIsLoading(false);
          // Sucesso no pop-up padrão; a tela só sai ao tocar em OK, sem segundo envio no meio (#353)
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'A rota complementar foi cadastrada com sucesso.',
            confirmText: 'OK',
            onConfirm: voltarParaListagem,
          });
        } catch (error: any) {
          setIsLoading(false);
          const msg = getErrorMessage(error, 'Erro ao cadastrar rota complementar.');
          showPopup({
            type: 'error',
            title: msg.startsWith('Erro de conexão') ? 'Erro de Conexão' : 'Aviso',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarParaListagem}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Cadastrar Rota Complementar</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onDismiss={popup.type === 'success' ? voltarParaListagem : closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seletor Rota Principal Vinculada */}
        <View style={styles.inputBox}>
          <TouchableOpacity activeOpacity={0.7} onPress={abrirSeletorRota}>
            <View pointerEvents="none">
              <TextInput
                label="Rota Principal Vinculada *"
                mode="outlined"
                value={rotaSelecionadaNome || 'Selecionar'}
                editable={false}
                textColor={rotaSelecionadaNome ? '#191C20' : '#74777F'}
                error={!!errors.rotaPrincipalId}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={abrirSeletorRota} />}
                style={styles.input}
              />
            </View>
          </TouchableOpacity>
          {errors.rotaPrincipalId && <Text style={styles.errorText}>{errors.rotaPrincipalId.message}</Text>}
        </View>

        {/* Modal de Seleção de Rota Principal: só ativas, a escolhida fica marcada (#355) */}
        <RNModal visible={modalRotaVisible} transparent={true} animationType="none">
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalRotaVisible(false)}>
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              <Text variant="titleLarge" style={styles.modalTitle}>Rota Principal Vinculada</Text>
              <Text variant="bodySmall" style={styles.modalSubtitle}>Selecione a rota principal ativa à qual esta rota complementar se conecta.</Text>

              {rotasPrincipaisAtivas.length === 0 ? (
                <Text style={styles.optionText}>Nenhuma rota principal ativa cadastrada.</Text>
              ) : (
                <RadioButton.Group
                  value={rotaParaVincularId ? String(rotaParaVincularId) : ''}
                  onValueChange={(valor) => setRotaParaVincularId(Number(valor))}
                >
                  {rotasPrincipaisAtivas.map((rp) => (
                    <RadioButton.Item
                      key={rp.id}
                      label={rp.nome}
                      value={String(rp.id)}
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
                <Button mode="text" onPress={() => setModalRotaVisible(false)}>Cancelar</Button>
                <Button mode="text" onPress={confirmarRotaPrincipal} disabled={!rotaParaVincularId} labelStyle={rotaParaVincularId ? { color: '#004D40', fontWeight: 'bold' } : undefined}>Confirmar</Button>
              </View>
            </View>
          </TouchableOpacity>
        </RNModal>

        {/* Nome da Rota */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { value } }) => (
              <CampoTextoRotulado
                rotulo="Nome da Rota *"
                placeholder="ex.: Van 2 - Bairro Novo"
                value={value}
                onChangeText={(texto) => atualizarCampo('nome', texto)}
                maxLength={150}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <GitFork size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Horários de Saída e Retorno lado a lado, como nas rotas principais: relógio de 24 h (#208, itens 2 e 4; #350, #357) */}
        <View style={styles.rowInputs}>
          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="horarioSaida"
              render={({ field: { value } }) => (
                <CampoHorario
                  label="Horário de Saída *"
                  value={value}
                  onChange={(horario) => atualizarHorario('horarioSaida', horario)}
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
                  onChange={(horario) => atualizarHorario('horarioRetorno', horario)}
                  error={!!errors.horarioRetorno}
                />
              )}
            />
            {errors.horarioRetorno && <Text style={styles.errorText}>{errors.horarioRetorno.message}</Text>}
          </View>
        </View>

        {/* Ponto de Conexão */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="pontoConexao"
            render={({ field: { value } }) => (
              <CampoTextoRotulado
                rotulo="Ponto de Conexão *"
                placeholder="ex.: Trevo do Bairro Novo"
                value={value}
                onChangeText={(texto) => atualizarCampo('pontoConexao', texto)}
                maxLength={150}
                error={!!errors.pontoConexao}
                left={<TextInput.Icon icon={() => <MapPin size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.pontoConexao && <Text style={styles.errorText}>{errors.pontoConexao.message}</Text>}
        </View>

        {/* Botão Finalizar Cadastro */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Finalizar cadastro
        </Button>
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInputBox: {
    flex: 1,
    marginBottom: 20,
  },
  inputBox: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    borderRadius: 8,
    marginTop: 24,
    backgroundColor: '#3E5F90',
  },
  buttonContent: {
    height: 55,
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
  radioItem: {
    paddingHorizontal: 0,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  optionText: {
    color: '#333',
    fontSize: 16,
  },
});
