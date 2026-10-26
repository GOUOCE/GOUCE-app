import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Portal, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Trash2, X } from 'lucide-react-native';

import { bairroSchema, BairroFormData } from '@/schemas/bairroSchema';
import { bairroService } from '@/services/bairroService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarBairroScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pontos, setPontos] = useState<string[]>([]);
  const [modalPontoVisible, setModalPontoVisible] = useState(false);
  const [novoPontoNome, setNovoPontoNome] = useState('');
  const [erroPonto, setErroPonto] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Snackbar Toast
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

  const { control, handleSubmit, formState: { errors }, reset, setValue, trigger } = useForm<BairroFormData>({
    resolver: zodResolver(bairroSchema),
    defaultValues: {
      nome: '',
      pontos: [],
    },
  });

  useEffect(() => {
    async function carregarDados() {
      if (!id) return;
      try {
        const b = await bairroService.obterBairroPorId(Number(id));
        if (b) {
          const pontosNomes = b.pontos.map((p) => p.nome);
          setPontos(pontosNomes);
          reset({
            nome: b.nome,
            pontos: pontosNomes,
          });
        }
      } catch (err) {
        console.warn('Erro ao carregar dados do bairro:', err);
      }
    }
    carregarDados();
  }, [id, reset]);

  const handleAdicionarPonto = () => {
    if (!novoPontoNome || novoPontoNome.trim().length < 2) {
      setErroPonto(true);
      return;
    }

    const pontoFormatado = novoPontoNome.trim();
    if (pontos.some((p) => p.toLowerCase() === pontoFormatado.toLowerCase())) {
      showPopup({
        type: 'error',
        title: 'Aviso',
        message: 'Esta localidade já está cadastrada.',
        confirmText: 'Entendido',
      });
      return;
    }

    const novosPontos = [...pontos, pontoFormatado];
    setPontos(novosPontos);
    setValue('pontos', novosPontos);
    trigger('pontos');
    setNovoPontoNome('');
    setErroPonto(false);
    setModalPontoVisible(false);
  };

  const handleRemoverPonto = (index: number) => {
    const novosPontos = pontos.filter((_, i) => i !== index);
    setPontos(novosPontos);
    setValue('pontos', novosPontos);
    trigger('pontos');
  };

  const onSubmit = async (dados: BairroFormData) => {
    if (!id) return;
    setIsLoading(true);
    try {
      await bairroService.atualizarBairro(Number(id), dados.nome, pontos);
      setIsLoading(false);
      setSnackbarMessage('Bairro alterado com sucesso');
      setSnackbarVisivel(true);
      setTimeout(() => {
        router.replace('/(administrador)/bairros');
      }, 1200);
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao atualizar bairro.');
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Bairro</Text>
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
        {/* Nome do Bairro */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { onChange, value } }) => (
              <TextInput
                label="Nome do Bairro *"
                mode="outlined"
                placeholder="Nome do bairro"
                value={value}
                onChangeText={onChange}
                error={!!errors.nome}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Pontos de Parada */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Pontos de Parada</Text>

        <View style={styles.pontosList}>
          {pontos.map((ponto, idx) => (
            <View key={idx} style={styles.pontoRow}>
              <Text variant="bodyLarge" style={styles.pontoName}>{ponto}</Text>
              <TouchableOpacity onPress={() => handleRemoverPonto(idx)}>
                <Trash2 size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ))}

          {errors.pontos && <Text style={styles.errorText}>{errors.pontos.message}</Text>}
        </View>

        {/* Botão Adicionar Ponto de Parada */}
        <Button
          mode="outlined"
          onPress={() => setModalPontoVisible(true)}
          style={styles.addPontoButton}
          labelStyle={styles.addPontoLabel}
        >
          Adicionar ponto de parada
        </Button>

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

      {/* Modal Novo Ponto de Parada */}
      <Portal>
        <RNModal visible={modalPontoVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Novo ponto de parada</Text>
              <Text variant="bodyMedium" style={styles.modalSubtitle}>Adicione um nome para o novo ponto.</Text>

              <TextInput
                label="Nome do Ponto *"
                mode="outlined"
                placeholder="Nome do ponto de parada"
                value={novoPontoNome}
                onChangeText={setNovoPontoNome}
                error={erroPonto}
                style={{ backgroundColor: '#fff', marginBottom: 16 }}
              />
              {erroPonto && <Text style={styles.errorTextModal}>Informe um nome válido com pelo menos 2 caracteres.</Text>}

              <View style={styles.modalButtons}>
                <Button mode="text" onPress={() => setModalPontoVisible(false)}>
                  Cancelar
                </Button>
                <Button mode="text" onPress={handleAdicionarPonto} labelStyle={{ color: '#004D40', fontWeight: 'bold' }}>
                  Adicionar
                </Button>
              </View>
            </View>
          </View>
        </RNModal>
      </Portal>

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
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  pontosList: {
    marginBottom: 20,
  },
  pontoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pontoName: {
    color: '#333',
    fontSize: 16,
  },
  addPontoButton: {
    borderColor: '#3E5F90',
    borderRadius: 8,
    marginBottom: 32,
  },
  addPontoLabel: {
    color: '#3E5F90',
    fontWeight: 'bold',
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  buttonContent: {
    height: 55,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  errorTextModal: {
    color: 'red',
    fontSize: 12,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
