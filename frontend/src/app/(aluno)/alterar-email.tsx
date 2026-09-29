import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

import { alterarEmailSchema, AlterarEmailFormData } from '@/schemas/perfilSchema';
import { useAuth } from '@contexts/AuthContext';
import { userService } from '@/services/userService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function AlterarEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [verSenha, setVerSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pop-up estilizado
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

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<AlterarEmailFormData>({
    resolver: zodResolver(alterarEmailSchema),
    defaultValues: {
      emailAtual: user?.email || '',
      novoEmail: '',
      senhaAtual: '',
    }
  });

  useEffect(() => {
    if (user?.email) {
      setValue('emailAtual', user.email);
    }
  }, [user]);

  const onSubmit = async (data: AlterarEmailFormData) => {
    setIsLoading(true);
    try {
      await userService.updateEmail({
        novo_email: data.novoEmail,
        senha_atual: data.senhaAtual,
      });

      await updateUser({
        email: data.novoEmail,
      });

      showPopup({
        type: 'success',
        title: 'E-mail Alterado',
        message: 'Endereço de e-mail alterado com sucesso! Utilize seu novo e-mail no próximo login.',
        confirmText: 'OK',
        onConfirm: () => {
          closePopup();
          router.back();
        },
      });
    } catch (error: any) {
      const message = getErrorMessage(error, 'Erro ao alterar e-mail. Verifique a senha atual.');
      showPopup({
        type: 'error',
        title: 'Falha ao Alterar E-mail',
        message,
        confirmText: 'Tentar novamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Alterar e-mail</Text>
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

      <ScrollView contentContainerStyle={styles.formContainer}>
        {/* E-mail Atual */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="emailAtual"
            render={({ field: { value } }) => (
              <TextInput
                label="E-mail atual *"
                mode="outlined"
                value={value}
                editable={false}
                left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
                style={[styles.input, { backgroundColor: '#F0F0F0' }]}
              />
            )}
          />
        </View>

        {/* Novo E-mail */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="novoEmail"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Novo E-mail *"
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={!!errors.novoEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.novoEmail && <Text style={styles.errorText}>{errors.novoEmail.message}</Text>}
        </View>

        {/* Senha Atual */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="senhaAtual"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Senha atual *"
                mode="outlined"
                secureTextEntry={!verSenha}
                value={value}
                onChangeText={onChange}
                error={!!errors.senhaAtual}
                left={<TextInput.Icon icon={() => <Lock size={20} color="#666" />} />}
                right={
                  <TextInput.Icon
                    icon={() => verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    onPress={() => setVerSenha(!verSenha)}
                  />
                }
                style={styles.input}
              />
            )}
          />
          {errors.senhaAtual && <Text style={styles.errorText}>{errors.senhaAtual.message}</Text>}
        </View>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Confirmar novo e-mail
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
    marginBottom: 40,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
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
    marginTop: 24,
    backgroundColor: '#3e5f90',
  },
  buttonContent: {
    height: 55,
  },
});
