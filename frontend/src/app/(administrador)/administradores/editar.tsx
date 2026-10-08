import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, User, Mail } from 'lucide-react-native';

import { editarAdminSchema, EditarAdminFormData } from '@/schemas/adminSchema';
import { adminService } from '@/services/adminService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarAdministradorScreen() {
  const router = useRouter();
  const { id, nome: nomeParam, email: emailParam } = useLocalSearchParams<{ id: string; nome: string; email: string }>();

  const [isLoading, setIsLoading] = useState(false);

  // Pop-up estilizado
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

  const showPopup = (config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const { control, handleSubmit, formState: { errors, isDirty }, reset } = useForm<EditarAdminFormData>({
    resolver: zodResolver(editarAdminSchema),
    mode: 'onTouched',
    defaultValues: {
      nome: nomeParam || '',
      email: emailParam || '',
    },
  });

  // Recarrega os dados do servidor ou reseta os campos ao ganhar foco (BUG-HU006-UI-009)
  useFocusEffect(
    React.useCallback(() => {
      async function carregarDadosOficiais() {
        if (!id) return;
        try {
          const lista = await adminService.listarAdministradores();
          const adminAtual = lista.find((a) => String(a.id) === String(id));
          if (adminAtual) {
            reset({
              nome: adminAtual.nome,
              email: adminAtual.email,
            });
          } else if (nomeParam || emailParam) {
            reset({
              nome: nomeParam || '',
              email: emailParam || '',
            });
          }
        } catch (err) {
          console.warn('Erro ao carregar dados do administrador:', err);
        }
      }
      carregarDadosOficiais();
    }, [id, nomeParam, emailParam, reset])
  );

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/administradores');
  };

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

  const onSubmit = async (dados: EditarAdminFormData) => {
    if (!id) return;

    setIsLoading(true);
    try {
      await adminService.atualizarAdministrador(Number(id), dados.nome, dados.email);
      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Operação realizada com sucesso',
        message: 'As alterações do administrador foram salvas.',
        confirmText: 'OK',
        onConfirm: voltarParaListagem,
      });
    } catch (error: any) {
      setIsLoading(false);
      const status = error.response?.status;
      const msg = status === 409
        ? 'Este e-mail já está em uso por outro usuário no sistema.'
        : getErrorMessage(error, 'Erro ao atualizar administrador.');

      showPopup({
        type: 'error',
        title: 'Aviso',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F8F9FF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Administrador</Text>
      </View>

      {/* Pop-up Estilizado (Sucesso AC-07 / Erro) */}
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome Completo *"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                maxLength={150}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <User size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="E-mail *"
                mode="outlined"
                autoCapitalize="none"
                keyboardType="email-address"
                maxLength={150}
                value={value}
                onChangeText={onChange}
                error={!!errors.email}
                left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

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
    </KeyboardAvoidingView>
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
    marginBottom: 40,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
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
    marginLeft: 4,
  },
  saveButton: {
    borderRadius: 8,
    marginTop: 20,
    backgroundColor: '#3e5f90',
  },
  buttonContent: {
    height: 55,
  },
});
