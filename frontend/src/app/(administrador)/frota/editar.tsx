import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, X } from 'lucide-react-native';

import { frotaSchema, FrotaFormData } from '@/schemas/frotaSchema';
import { frotaService } from '@/services/frotaService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarOnibusScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

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

  const { control, handleSubmit, formState: { errors }, reset } = useForm<FrotaFormData>({
    resolver: zodResolver(frotaSchema),
    defaultValues: {
      placa: '',
      assentos: undefined,
      capacidadeEmPe: undefined,
    },
  });

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        const o = await frotaService.obterOnibusPorId(Number(id));
        if (o) {
          reset({
            placa: o.placa,
            assentos: o.assentos,
            capacidadeEmPe: o.capacidade_em_pe,
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do ônibus:', err);
      }
    }
    carregarDados();
  }, [id, reset]);

  const onSubmit = async (dados: FrotaFormData) => {
    if (!id) return;
    setIsLoading(true);
    try {
      await frotaService.atualizarOnibus(Number(id), dados.placa, Number(dados.assentos), Number(dados.capacidadeEmPe));
      setIsLoading(false);
      setSnackbarMessage('Ônibus alterado com sucesso');
      setSnackbarVisivel(true);
      setTimeout(() => {
        router.replace('/(administrador)/frota');
      }, 1200);
    } catch (error: any) {
      setIsLoading(false);
      const status = error.response?.status;
      const msg =
        status === 409 || error.message?.includes('registrado')
          ? 'Este veículo já está registrado.'
          : getErrorMessage(error, 'Erro ao atualizar ônibus.');

      showPopup({
        type: 'error',
        title: 'Aviso',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Ônibus</Text>
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Placa */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="placa"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Placa *"
                mode="outlined"
                placeholder="ex: OCR-1234"
                value={value}
                onChangeText={(t) => onChange(t.toUpperCase())}
                autoCapitalize="characters"
                error={!!errors.placa}
                style={styles.input}
              />
            )}
          />
          {errors.placa && <Text style={styles.errorText}>{errors.placa.message}</Text>}
        </View>

        {/* Qtd. de Assentos e Capac. Máxima em Pé em Linha */}
        <View style={styles.rowInputs}>
          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="assentos"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Qtd. de Assentos *"
                  mode="outlined"
                  placeholder="ex: 42"
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={!!errors.assentos}
                  style={styles.input}
                />
              )}
            />
            {errors.assentos && <Text style={styles.errorText}>{errors.assentos.message}</Text>}
          </View>

          <View style={styles.halfInputBox}>
            <Controller
              control={control}
              name="capacidadeEmPe"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  label="Capac. Máxima em Pé *"
                  mode="outlined"
                  placeholder="ex: 8"
                  value={value !== undefined ? String(value) : ''}
                  onChangeText={onChange}
                  keyboardType="numeric"
                  error={!!errors.capacidadeEmPe}
                  style={styles.input}
                />
              )}
            />
            {errors.capacidadeEmPe && <Text style={styles.errorText}>{errors.capacidadeEmPe.message}</Text>}
          </View>
        </View>

        {/* Botão Salvar Alterações */}
        <Button
          mode="contained"
          onPress={() => { void handleSubmit(onSubmit)(); }}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Salvar alterações
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
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  halfInputBox: {
    flex: 1,
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
