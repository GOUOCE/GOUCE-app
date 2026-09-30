import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, useTheme, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Phone, ChevronDown } from 'lucide-react-native';

import { editarPerfilSchema, EditarPerfilFormData } from '@/schemas/perfilSchema';
import { useAuth } from '@contexts/AuthContext';
import { userService } from '@/services/userService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: boolean;
}

function CustomSelect({ label, value, options, onSelect, error }: SelectInputProps) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <TextInput
          label={label}
          value={value || 'Selecionar'}
          mode="outlined"
          editable={false}
          error={error}
          right={<TextInput.Icon icon={() => <ChevronDown size={20} />} />}
          pointerEvents="none"
          style={{ backgroundColor: '#fff' }}
        />
      </TouchableOpacity>

      <Portal>
        <RNModal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setVisible(false)}
          >
            <View style={styles.modalSelectContent}>
              <Text variant="titleMedium" style={styles.modalSelectTitle}>{label}</Text>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionItem}
                  onPress={() => { onSelect(opt); setVisible(false); }}
                >
                  <Text variant="bodyLarge" style={[
                    styles.optionText,
                    value === opt && { color: theme.colors.primary, fontWeight: 'bold' }
                  ]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </RNModal>
      </Portal>
    </View>
  );
}

export default function EditarPerfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, updateUser } = useAuth();
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

  const { control, handleSubmit, formState: { errors }, reset } = useForm<EditarPerfilFormData>({
    resolver: zodResolver(editarPerfilSchema),
    defaultValues: {
      telefone: user?.telefone || '',
      bairro: user?.bairro || 'Croatá',
    }
  });

  // Carrega dados atualizados do perfil ao entrar
  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      setIsLoading(true);
      try {
        const profile = await userService.getProfile();
        reset({
          telefone: profile.telefone || user.telefone || '',
          bairro: profile.bairro_id || user.bairro || 'Croatá',
        });
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const onSubmit = async (data: EditarPerfilFormData) => {
    setIsLoading(true);
    try {
      await userService.updateProfile({
        telefone: data.telefone,
        bairro_id: data.bairro,
      });

      await updateUser({
        telefone: data.telefone,
        bairro: data.bairro,
      });

      showPopup({
        type: 'success',
        title: 'Perfil Atualizado',
        message: 'Suas informações de perfil foram atualizadas com sucesso!',
        confirmText: 'OK',
        onConfirm: () => {
          closePopup();
          router.back();
        },
      });
    } catch (error: any) {
      const message = getErrorMessage(error, 'Não foi possível salvar as alterações.');
      showPopup({
        type: 'error',
        title: 'Erro ao Salvar',
        message,
        confirmText: 'Entendido',
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Perfil</Text>
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
        {/* Telefone */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Telefone (WhatsApp) *"
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

        {/* Bairro / Localidade */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="bairro"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Bairro / Localidade *"
                value={value}
                options={['Centro', 'Croatá', 'Bairro Novo', 'Planalto', 'Serra', 'Outro']}
                onSelect={onChange}
                error={!!errors.bairro}
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
  selectContainer: {
    marginBottom: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSelectContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
    maxHeight: '80%',
  },
  modalSelectTitle: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  optionText: {
    color: '#333',
  },
});
