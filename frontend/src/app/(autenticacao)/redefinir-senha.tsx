import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Portal
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Lock, Eye, EyeOff } from 'lucide-react-native';

import { resetPasswordSchema, ResetPasswordFormData } from '@/schemas/loginSchema';
import { useLocalSearchParams } from 'expo-router';
import { authService } from '@services/authService';

export default function RedefinirSenhaScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { token } = useLocalSearchParams<{ token: string }>();
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

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

  const { control, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  });

  const onSubmit = async (dados: ResetPasswordFormData) => {
    if (!token) {
      alert('Token de recuperação inválido ou expirado.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword(dados, token);
      alert('Senha redefinida com sucesso!');
      router.replace('/(autenticacao)/login');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao redefinir senha. Tente novamente.';
      alert(message);
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
      <Portal>
        <Modal
          visible={modalSairVisivel}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalSairVisivel(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Sair desta tela?</Text>
              <Text variant="bodyLarge" style={styles.modalText}>
                As alterações não salvas serão perdidas.
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  mode="text"
                  onPress={() => setModalSairVisivel(false)}
                  style={styles.modalBtn}
                >
                  Continuar aqui
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmarSaida}
                  style={[styles.modalBtn, { backgroundColor: '#B00020' }]}
                >
                  Sim, sair
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </Portal>

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
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.btnContent}
        >
          Salvar nova senha
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
  },
  btnContent: {
    height: 55,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    color: '#666',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  modalBtn: {
    borderRadius: 8,
  }
});
