import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Portal, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Building2, ChevronDown, GitFork, Clock, X } from 'lucide-react-native';

import { rotaComplementarSchema, RotaComplementarFormData } from '@/schemas/rotaComplementarSchema';
import { rotaComplementarService, RotaPrincipalSimples } from '@/services/rotaComplementarService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarRotaComplementarScreen() {
  const router = useRouter();

  const [rotasPrincipaisAtivas, setRotasPrincipaisAtivas] = useState<RotaPrincipalSimples[]>([]);
  const [modalRotaVisible, setModalRotaVisible] = useState(false);
  const [modalHorarioVisible, setModalHorarioVisible] = useState(false);
  const [rotaSelecionadaNome, setRotaSelecionadaNome] = useState('Selecionar');
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
    cancelText?: string;
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

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<RotaComplementarFormData>({
    resolver: zodResolver(rotaComplementarSchema),
    defaultValues: {
      rotaPrincipalId: undefined,
      nome: '',
      horarioSaida: '06:10',
      pontoConexao: '',
    },
  });

  useEffect(() => {
    async function carregarRotasPrincipais() {
      try {
        const ativas = await rotaComplementarService.listarRotasPrincipaisAtivas();
        setRotasPrincipaisAtivas(ativas);
        if (ativas.length > 0) {
          setValue('rotaPrincipalId', ativas[0].id);
          setRotaSelecionadaNome(ativas[0].nome);
        }
      } catch (err) {
        console.warn('Erro ao carregar rotas principais ativas:', err);
      }
    }
    carregarRotasPrincipais();
  }, [setValue]);

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
            pontoConexao: dados.pontoConexao,
          });
          setIsLoading(false);
          setSnackbarMessage('Rota complementar cadastrada com sucesso');
          setSnackbarVisivel(true);
          setTimeout(() => {
            router.replace('/(administrador)/rotas-complementares');
          }, 1200);
        } catch (error: any) {
          setIsLoading(false);
          const msg = getErrorMessage(error, 'Erro ao cadastrar rota complementar.');
          showPopup({
            type: 'error',
            title: 'Aviso',
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
        <TouchableOpacity onPress={() => router.back()}>
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
        onDismiss={closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seletor Rota Principal Vinculada */}
        <View style={styles.inputBox}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setModalRotaVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Rota Principal Vinculada *"
                mode="outlined"
                value={rotaSelecionadaNome}
                editable={false}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={() => setModalRotaVisible(true)} />}
                style={styles.input}
              />
            </View>
          </TouchableOpacity>
          {errors.rotaPrincipalId && <Text style={styles.errorText}>{errors.rotaPrincipalId.message}</Text>}
        </View>

        {/* Modal de Seleção de Rota Principal */}
        <Portal>
          <RNModal visible={modalRotaVisible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalRotaVisible(false)}>
              <View style={styles.modalSelectContent}>
                <Text variant="titleMedium" style={styles.modalSelectTitle}>Rota Principal Vinculada</Text>
                {rotasPrincipaisAtivas.map((rp) => (
                  <TouchableOpacity
                    key={rp.id}
                    style={styles.optionItem}
                    onPress={() => {
                      setValue('rotaPrincipalId', rp.id);
                      setRotaSelecionadaNome(rp.nome);
                      setModalRotaVisible(false);
                    }}
                  >
                    <Text style={[styles.optionText, rotaSelecionadaNome === rp.nome && { color: '#3E5F90', fontWeight: 'bold' }]}>
                      {rp.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </RNModal>
        </Portal>

        {/* Nome */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome *"
                mode="outlined"
                placeholder="ex.: Van 2 - Bairro Novo"
                value={value}
                onChangeText={onChange}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <GitFork size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Horário de Saída */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="horarioSaida"
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity activeOpacity={0.7} onPress={() => setModalHorarioVisible(true)}>
                <View pointerEvents="none">
                  <TextInput
                    label="Horário de Saída *"
                    mode="outlined"
                    placeholder="Selecionar"
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

        {/* Modal de Seleção de Horário */}
        <Portal>
          <RNModal visible={modalHorarioVisible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalHorarioVisible(false)}>
              <View style={styles.modalSelectContent}>
                <Text variant="titleMedium" style={styles.modalSelectTitle}>Horário de Saída</Text>
                {['05:40', '06:00', '06:10', '06:20', '06:30', '07:00'].map((horario) => (
                  <TouchableOpacity
                    key={horario}
                    style={styles.optionItem}
                    onPress={() => {
                      setValue('horarioSaida', horario);
                      setModalHorarioVisible(false);
                    }}
                  >
                    <Text style={styles.optionText}>{horario}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </RNModal>
        </Portal>

        {/* Ponto de Conexão */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="pontoConexao"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Ponto de Conexão *"
                mode="outlined"
                placeholder="ex.: Trevo do Bairro Novo"
                value={value}
                onChangeText={onChange}
                error={!!errors.pontoConexao}
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
  modalSelectContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
  },
  modalSelectTitle: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  optionText: {
    color: '#333',
    fontSize: 16,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
