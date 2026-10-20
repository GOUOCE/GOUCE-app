import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, User, Phone, X } from 'lucide-react-native';

import { motoristaSchema, MotoristaFormData } from '@/schemas/motoristaSchema';
import { motoristaService } from '@/services/motoristaService';
import { getErrorMessage } from '@/utils/errorUtils';
import { formatarTelefone } from '@/utils/formatarTelefone';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarMotoristaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(false);
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

  const { control, handleSubmit, formState: { errors }, reset } = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: '',
      telefone: '',
    },
  });

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        const m = await motoristaService.obterMotoristaPorId(Number(id));
        if (m) {
          reset({
            nome: m.nome,
            telefone: formatarTelefone(m.telefone) || m.telefone,
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do motorista:', err);
      }
    }
    carregarDados();
  }, [id, reset]);

  const onSubmit = async (dados: MotoristaFormData) => {
    if (!id) return;
    setIsLoading(true);
    try {
      await motoristaService.atualizarMotorista(Number(id), dados.nome, dados.telefone);
      setIsLoading(false);
      setSnackbarMessage('Motorista alterado com sucesso');
      setSnackbarVisivel(true);
      setTimeout(() => {
        router.replace('/(administrador)/motoristas');
      }, 1200);
    } catch (error: any) {
      setIsLoading(false);
      const status = error.response?.status;
      const msg =
        status === 409 || error.message?.includes('registrado')
          ? 'Este profissional já está registrado.'
          : getErrorMessage(error, 'Erro ao atualizar motorista.');

      showPopup({
        type: 'error',
        title: 'Aviso',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Motorista</Text>
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
        {/* Nome Completo */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome Completo *"
                mode="outlined"
                placeholder="Nome do motorista"
                value={value}
                onChangeText={onChange}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <User size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Telefone */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                label="Telefone *"
                mode="outlined"
                placeholder="(88) 9 9999-9999"
                value={value}
                onChangeText={(text) => onChange(formatarTelefone(text))}
                onBlur={() => {
                  onBlur();
                  if (value) onChange(formatarTelefone(value));
                }}
                maxLength={15}
                keyboardType="phone-pad"
                error={!!errors.telefone}
                left={<TextInput.Icon icon={() => <Phone size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}
        </View>

        {/* Botão Salvar Alterações */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Salvar alterações
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
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
