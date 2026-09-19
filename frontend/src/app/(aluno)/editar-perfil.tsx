import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Text, TextInput, Button, useTheme, Portal, Modal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Mail, Phone, MapPin, Eye, EyeOff } from 'lucide-react-native';
import { editarPerfilSchema, EditarPerfilFormData } from '@/schemas/perfilSchema';
import { useAuth } from '@contexts/AuthContext';

export default function EditarPerfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [verSenha, setVerSenha] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modalSenhaVisivel, setModalSenhaVisivel] = useState(false);
  const [tempData, setTempData] = useState<EditarPerfilFormData | null>(null);

  const { control, handleSubmit, formState: { errors }, watch } = useForm<EditarPerfilFormData>({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: {
      email: user?.email || '',
      telefone: '(88) 9 9999-9999',
      bairro: 'Centro',
    }
  });

  const onSubmit = async (data: EditarPerfilFormData) => {
    // Se o e-mail mudou, solicita a senha atual
    if (data.email !== user?.email) {
      setTempData(data);
      setModalSenhaVisivel(true);
      return;
    }

    handleSave(data);
  };

  const handleSave = async (data: EditarPerfilFormData) => {
    setIsLoading(true);
    try {
      console.log('Salvando alterações:', data);
      // Simulação de delay de rede
      await new Promise(resolve => setTimeout(resolve, 1500));
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setIsLoading(false);
      setModalSenhaVisivel(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.formContainer}>
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

        {/* Telefone */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.label}>Telefone (WhatsApp) *</Text>
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={!!errors.telefone}
                keyboardType="phone-pad"
                left={<TextInput.Icon icon={() => <Phone size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}
        </View>

        {/* Bairro */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.label}>Bairro / Localidade *</Text>
          <Controller
            control={control}
            name="bairro"
            render={({ field: { onChange, value } }) => (
              <TextInput
                mode="outlined"
                value={value}
                onChangeText={onChange}
                error={!!errors.bairro}
                left={<TextInput.Icon icon={() => <MapPin size={20} color="#666" />} />}
                style={styles.input}
                placeholder="Selecionar"
              />
            )}
          />
          {errors.bairro && <Text style={styles.errorText}>{errors.bairro.message}</Text>}
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

      {/* Modal Confirmação de Senha (para mudança de e-mail) */}
      <Portal>
        <Modal
          visible={modalSenhaVisivel}
          onDismiss={() => setModalSenhaVisivel(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>Confirme sua senha</Text>
          <Text variant="bodyMedium" style={styles.modalText}>
            Para alterar seu e-mail de acesso, é necessário confirmar sua senha atual por segurança.
          </Text>

          <Controller
            control={control}
            name="senhaAtual"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Senha Atual"
                mode="outlined"
                secureTextEntry={!verSenha}
                value={value}
                onChangeText={onChange}
                right={
                  <TextInput.Icon
                    icon={() => verSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                    onPress={() => setVerSenha(!verSenha)}
                  />
                }
              />
            )}
          />

          <View style={styles.modalButtons}>
            <Button mode="text" onPress={() => setModalSenhaVisivel(false)}>Cancelar</Button>
            <Button
              mode="contained"
              onPress={() => tempData && handleSave(tempData)}
              loading={isLoading}
            >
              Confirmar
            </Button>
          </View>
        </Modal>
      </Portal>
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
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
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
  saveButton: {
    borderRadius: 8,
    marginTop: 16,
    backgroundColor: '#3e5f90',
  },
  buttonContent: {
    height: 55,
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
    lineHeight: 20,
    marginBottom: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 8,
  }
});
