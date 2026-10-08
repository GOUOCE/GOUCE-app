import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TextInput, Button, Text, useTheme } from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail, Eye, EyeOff } from 'lucide-react-native';

import { loginSchema, LoginFormData } from '@/schemas/loginSchema';
import { useAuth } from '@contexts/AuthContext';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { perfil } = useLocalSearchParams();
  const { signIn, isLoading } = useAuth();
  const [verSenha, setVerSenha] = useState(false);

  // Estado do Pop-up
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

  const handleBack = () => {
    showPopup({
      type: 'warning',
      title: 'Sair do aplicativo?',
      message: 'Você precisará fazer login novamente para agendar transportes.',
      confirmText: 'Sim, sair',
      cancelText: 'Continuar no app',
      confirmColor: '#B00020',
      onConfirm: confirmarSaida,
    });
  };

  const confirmarSaida = () => {
    closePopup();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      senha: '',
    }
  });

  const onSubmit = async (dados: LoginFormData) => {
    router.push({
      pathname: '/(autenticacao)/selecao-perfil',
      params: { email: dados.email, senha: dados.senha }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Entrar</Text>
      </View>

      {/* Pop-up Estilizado Personalizado */}
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

      <View style={styles.formContainer}>
        {/* E-mail */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.label}>E-mail *</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                mode="outlined"
                value={value}
                onChangeText={onChange}
                onBlur={() => {
                  onBlur();
                  if (value) {
                    onChange(value.trim().toLowerCase());
                  }
                }}
                error={!!errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
        </View>

        {/* Senha */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.label}>Senha *</Text>
          <Controller
            control={control}
            name="senha"
            render={({ field: { onChange, value } }) => (
              <TextInput
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={!!errors.senha}
                secureTextEntry={!verSenha}
                maxLength={128}
                right={<TextInput.Icon icon={() => verSenha ? <EyeOff size={20} /> : <Eye size={20} />} onPress={() => setVerSenha(!verSenha)} />}
                style={styles.input}
              />
            )}
          />
          {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}
        </View>

        <TouchableOpacity onPress={() => router.push('/(autenticacao)/esqueci-senha')} style={styles.forgotBox}>
          <Text variant="bodyMedium" style={[styles.forgotText, { color: theme.colors.primary }]}>
            Esqueci minha senha
          </Text>
        </TouchableOpacity>

        {/* Botão Entrar */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.btnContent}
        >
          Próximo
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    flex: 1,
  },
  inputBox: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 4,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  forgotBox: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotText: {
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    backgroundColor: '#3e5f90',
  },
  btnContent: {
    height: 55,
  },
});
