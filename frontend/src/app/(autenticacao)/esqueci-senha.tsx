import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Snackbar,
  Portal
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail, X } from 'lucide-react-native';

import { forgotPasswordSchema, ForgotPasswordFormData } from '@/schemas/loginSchema';
import { authService } from '@services/authService';

export default function EsqueciSenhaScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [visivel, setVisivel] = useState(false);
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

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const onSubmit = async (dados: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await authService.forgotPassword(dados);
      setVisivel(true);
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao solicitar recuperação. Tente novamente.';
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Esqueci minha senha</Text>
      </View>

      {/* Modal de Confirmação de Saída */}
      <Portal>
        <Modal
          visible={modalSairVisivel}
          onDismiss={() => setModalSairVisivel(false)}
        >
          <View style={styles.modalContent}>
            <Text variant="headlineSmall" style={styles.modalTitle}>Sair desta tela?</Text>
            <Text variant="bodyLarge" style={styles.modalText}>
              As informações inseridas serão perdidas.
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
        </Modal>
      </Portal>

      <View style={styles.content}>
        <Text variant="bodyMedium" style={styles.description}>
          Informe o e-mail cadastrado para receber o link de redefinição.
        </Text>

        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.label}>E-mail *</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={!!errors.email}
                autoCapitalize="none"
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

      <Snackbar
        visible={visivel}
        onDismiss={() => setVisivel(false)}
        action={{
          label: '',
          icon: () => <X size={20} color="#fff" />,
          onPress: () => setVisivel(false),
        }}
        style={styles.snackbar}
      >
        E-mail enviado. Verifique sua caixa de entrada para continuar.
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
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 24,
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
