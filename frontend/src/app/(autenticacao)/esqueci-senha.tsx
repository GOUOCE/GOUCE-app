import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  useTheme,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail } from 'lucide-react-native';

import { forgotPasswordSchema, ForgotPasswordFormData } from '@/schemas/loginSchema';
import { authService } from '@services/authService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EsqueciSenhaScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

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

  const handleBack = () => {
    setModalSairVisivel(true);
  };

  const confirmarSaida = () => {
    setModalSairVisivel(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onTouched',
    defaultValues: {
      email: '',
    }
  });

  const onSubmit = async (dados: ForgotPasswordFormData) => {
    Keyboard.dismiss();
    setIsLoading(true);
    try {
      await authService.forgotPassword(dados);
      showPopup({
        type: 'success',
        title: 'E-mail enviado',
        message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.',
        confirmText: 'Entendido',
        onConfirm: () => {
          closePopup();
          router.replace('/(autenticacao)/login');
        },
      });
    } catch (error: any) {
      const message = getErrorMessage(error, 'Erro ao solicitar recuperação. Tente novamente.');
      showPopup({
        type: 'error',
        title: 'Aviso',
        message,
        confirmText: 'Tentar novamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Esqueci minha senha</Text>
      </View>

      {/* Pop-up de Confirmação de Saída */}
      <AppPopup
        visible={modalSairVisivel}
        type="warning"
        title="Sair desta tela?"
        message="As informações inseridas serão perdidas."
        confirmText="Sim, sair"
        cancelText="Continuar aqui"
        confirmColor="#B00020"
        onConfirm={confirmarSaida}
        onDismiss={() => setModalSairVisivel(false)}
      />

      {/* Pop-up de Sucesso / Aviso */}
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

      <View style={styles.content}>
        <Text variant="bodyMedium" style={styles.description}>
          Informe o e-mail cadastrado para receber o link de redefinição.
        </Text>

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

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.btnContent}
        >
          Enviar instruções
        </Button>

        <View style={styles.dividerBox}>
          <View style={styles.line} />
          <Text variant="bodySmall" style={styles.dividerText}>ou</Text>
          <View style={styles.line} />
        </View>

        <Button
          mode="outlined"
          onPress={() => router.push('/(autenticacao)/register')}
          style={styles.btnRegister}
          contentStyle={styles.btnContent}
          labelStyle={{ color: theme.colors.primary }}
        >
          Criar conta de aluno
        </Button>
      </View>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 40,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    paddingHorizontal: 24,
  },
  description: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputBox: {
    marginBottom: 32,
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
  button: {
    borderRadius: 8,
    marginBottom: 24,
    backgroundColor: '#3e5f90',
  },
  btnContent: {
    height: 55,
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
  },
  btnRegister: {
    borderRadius: 8,
    borderColor: '#3e5f90',
    borderWidth: 1.5,
  },
});
