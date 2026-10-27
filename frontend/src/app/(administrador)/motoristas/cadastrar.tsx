import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, User, Phone } from 'lucide-react-native';

import { motoristaSchema, MotoristaFormData } from '@/schemas/motoristaSchema';
import { motoristaService } from '@/services/motoristaService';
import { getErrorMessage } from '@/utils/errorUtils';
import { formatarTelefone } from '@/utils/formatarTelefone';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarMotoristaScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

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

  // Reseta o formulário limpo sempre que ganha ou perde o foco
  useFocusEffect(
    React.useCallback(() => {
      reset({
        nome: '',
        telefone: '',
      });

      return () => {
        reset({
          nome: '',
          telefone: '',
        });
      };
    }, [reset])
  );

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/motoristas');
  };

  const onSubmit = (dados: MotoristaFormData) => {
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
          await motoristaService.criarMotorista(dados.nome, dados.telefone);
          setIsLoading(false);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'O motorista foi cadastrado com sucesso.',
            confirmText: 'OK',
            onConfirm: voltarParaListagem,
          });
        } catch (error: any) {
          setIsLoading(false);
          const status = error.response?.status;
          const msg =
            status === 409 || error.message?.includes('registrado')
              ? 'Este profissional já está registrado.'
              : getErrorMessage(error, 'Erro ao cadastrar motorista.');

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
        <TouchableOpacity onPress={voltarParaListagem}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Cadastrar Motorista</Text>
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

        {/* Botão Finalizar Cadastro */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit) as any}
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
});
