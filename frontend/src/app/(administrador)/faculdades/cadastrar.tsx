import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Building2, X } from 'lucide-react-native';

import { faculdadeSchema, FaculdadeFormData } from '@/schemas/faculdadeSchema';
import { faculdadeService } from '@/services/faculdadeService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarFaculdadeScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  // Pop-up Estilizado
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
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

  const { control, handleSubmit, formState: { errors } } = useForm<FaculdadeFormData>({
    resolver: zodResolver(faculdadeSchema),
    defaultValues: {
      nome: '',
      sigla: '',
      campus: '',
    },
  });

  const onSubmit = (dados: FaculdadeFormData) => {
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
          await faculdadeService.criarFaculdade(dados.nome, dados.sigla, dados.campus);
          setIsLoading(false);
          setSnackbarMessage('Faculdade cadastrada com sucesso');
          setSnackbarVisivel(true);
          setTimeout(() => {
            router.replace('/(administrador)/faculdades');
          }, 1200);
        } catch (error: any) {
          setIsLoading(false);
          const msg = getErrorMessage(error, 'Erro ao cadastrar faculdade.');
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
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Cadastrar Faculdade</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onDismiss={closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Nome da Instituição */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome da Instituição *"
                mode="outlined"
                placeholder="Nome da instituição"
                value={value}
                onChangeText={onChange}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Sigla do Nome */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="sigla"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Sigla do Nome *"
                mode="outlined"
                placeholder="Sigla do nome (ex.: UFC)"
                value={value}
                onChangeText={onChange}
                error={!!errors.sigla}
                style={styles.input}
              />
            )}
          />
          {errors.sigla && <Text style={styles.errorText}>{errors.sigla.message}</Text>}
        </View>

        {/* Campus */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="campus"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Campus *"
                mode="outlined"
                placeholder="Campus"
                value={value}
                onChangeText={onChange}
                error={!!errors.campus}
                style={styles.input}
              />
            )}
          />
          {errors.campus && <Text style={styles.errorText}>{errors.campus.message}</Text>}
        </View>

        {/* Botão Finalizar Cadastro */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit)}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Finalizar cadastro
        </Button>
      </ScrollView>

      {/* Toast Snackbar */}
      <Snackbar
        visible={snackbarVisivel}
        onDismiss={() => setSnackbarVisivel(false)}
        action={{
          label: '',
          icon: () => <X size={20} color="#fff" />,
          onPress: () => setSnackbarVisivel(false),
        }}
        style={styles.snackbar}
      >
        {snackbarMessage}
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
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
