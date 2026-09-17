import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  TextInput,
  Button,
  Text,
  useTheme,
  Portal
} from 'react-native-paper';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail, Eye, EyeOff } from 'lucide-react-native';

import { loginSchema, LoginFormData } from '@/schemas/loginSchema';
import { useAuth } from '@contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { perfil } = useLocalSearchParams();
  const { signIn, isLoading } = useAuth();
  const [verSenha, setVerSenha] = useState(false);
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

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
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

      {/* Modal de Confirmação de Saída do App */}
      <Portal>
        <Modal
          visible={modalSairVisivel}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalSairVisivel(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Sair do aplicativo?</Text>
              <Text variant="bodyLarge" style={styles.modalText}>
                Você precisará fazer login novamente para agendar transportes.
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  mode="text"
                  onPress={() => setModalSairVisivel(false)}
                  style={styles.modalBtn}
                >
                  Continuar no app
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

      <View style={styles.formContainer}>
        {/* E-mail */}
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
          {errors.senha && <Text style={styles.errorText}>{errors.senha.message}</Text>}
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(autenticacao)/esqueci-senha')}
          style={styles.forgotLink}
        >
          <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>Esqueci minha senha</Text>
        </TouchableOpacity>

        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          style={styles.btnEntrar}
          contentStyle={styles.btnContent}
        >
          Entrar
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
  formContainer: {
    paddingHorizontal: 24,
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  btnEntrar: {
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
