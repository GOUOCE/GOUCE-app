import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  useTheme,
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

import { resetPasswordSchema, ResetPasswordFormData } from '@/schemas/loginSchema';
import { authService } from '@services/authService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function RedefinirSenhaScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
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

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValidToken(false);
        showPopup({
          type: 'error',
          title: 'Link de recuperação expirado ou inválido',
          message: 'Link de recuperação expirado ou inválido. Por favor, solicite novamente.',
          confirmText: 'Solicitar novo link',
          onConfirm: () => {
            closePopup();
            router.replace('/(autenticacao)/esqueci-senha');
          },
        });
        return;
      }

      setIsLoading(true);
      try {
        await authService.validateToken(token);
        setIsValidToken(true);
      } catch (err) {
        setIsValidToken(false);
        showPopup({
          type: 'error',
          title: 'Link de recuperação expirado ou inválido',
          message: 'Link de recuperação expirado ou inválido. Por favor, solicite novamente.',
          confirmText: 'Solicitar novo link',
          onConfirm: () => {
            closePopup();
            router.replace('/(autenticacao)/esqueci-senha');
          },
        });
      } finally {
        setIsLoading(false);
      }
    }
    checkToken();
  }, [token]);

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

  const { control, handleSubmit, formState: { errors, isValid } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      novaSenha: '',
      confirmarNovaSenha: '',
    }
  });

  const onSubmit = async (dados: ResetPasswordFormData) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await authService.resetPassword(dados, token);
      showPopup({
        type: 'success',
        title: 'Senha redefinida com sucesso',
        message: 'Você já pode realizar o login com sua nova senha.',
        confirmText: 'Fazer login',
        onConfirm: () => {
          closePopup();
          router.replace('/(autenticacao)/login');
        },
      });
    } catch (error: any) {
      const message = getErrorMessage(error, 'Link de recuperação expirado ou inválido. Por favor, solicite novamente.');
      showPopup({
        type: 'error',
        title: 'Link de recuperação expirado ou inválido',
        message,
        confirmText: 'Solicitar novo link',
        onConfirm: () => {
          closePopup();
          router.replace('/(autenticacao)/esqueci-senha');
        },
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Redefinir Senha</Text>
      </View>

      {/* Modal de Confirmação de Saída */}
      <AppPopup
        visible={modalSairVisivel}
        type="warning"
        title="Sair desta tela?"
        message="As alterações não salvas serão perdidas."
        confirmText="Sim, sair"
        cancelText="Continuar aqui"
        confirmColor="#B00020"
        onConfirm={confirmarSaida}
        onDismiss={() => setModalSairVisivel(false)}
      />

      {/* Pop-up de Sucesso / Erro */}
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

      {isValidToken === null || (isValidToken && isLoading) ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3e5f90" />
          <Text style={{ marginTop: 12, color: '#666' }}>Validando token de recuperação...</Text>
        </View>
      ) : isValidToken === true ? (
        <View style={styles.content}>
          <Text variant="bodyMedium" style={styles.description}>
            Link acessado pelo e-mail. Defina sua nova senha.
          </Text>

          <View style={styles.inputBox}>
            <Text variant="labelMedium" style={styles.label}>Nova senha *</Text>
            <Controller
              control={control}
              name="novaSenha"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.novaSenha}
                  secureTextEntry={!verSenha}
                  maxLength={128}
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
            <Text variant="bodySmall" style={styles.hint}>
              Mín. 8 caracteres, com letra maiúscula, minúscula e número.
            </Text>
            {errors.novaSenha && <Text style={styles.errorText}>{errors.novaSenha.message}</Text>}
          </View>

          <View style={styles.inputBox}>
            <Text variant="labelMedium" style={styles.label}>Confirmar nova senha *</Text>
            <Controller
              control={control}
              name="confirmarNovaSenha"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  mode="outlined"
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.confirmarNovaSenha}
                  secureTextEntry={!verConfirmarSenha}
                  maxLength={128}
                  right={
                    <TextInput.Icon
                      icon={() => verConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                      onPress={() => setVerConfirmarSenha(!verConfirmarSenha)}
                    />
                  }
                  style={styles.input}
                />
              )}
            />
            {errors.confirmarNovaSenha && <Text style={styles.errorText}>{errors.confirmarNovaSenha.message}</Text>}
          </View>

          <Button
            mode="contained"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading || !isValid}
            style={styles.button}
            contentStyle={styles.btnContent}
          >
            Salvar nova senha
          </Button>
        </View>
      ) : null}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  description: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputBox: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
  },
  hint: {
    color: '#666',
    marginTop: 8,
    lineHeight: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    borderRadius: 8,
    marginTop: 32,
    backgroundColor: '#3e5f90',
  },
  btnContent: {
    height: 55,
  },
});
