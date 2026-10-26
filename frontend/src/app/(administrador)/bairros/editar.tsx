import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Portal, Snackbar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Trash2, RotateCcw, X } from 'lucide-react-native';

import { bairroSchema, BairroFormData } from '@/schemas/bairroSchema';
import { bairroService, PontoParadaItem } from '@/services/bairroService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarBairroScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pontos, setPontos] = useState<PontoParadaItem[]>([]);
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

  const { control, handleSubmit, formState: { errors, isDirty }, reset, setValue, trigger } = useForm<BairroFormData>({
    resolver: zodResolver(bairroSchema),
    defaultValues: {
      nome: '',
      pontos: [],
    },
  });

  // Recarrega os dados oficiais do banco de dados ao ganhar foco e descarta alterações não salvas ao sair
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;

      async function carregarDadosOficiais() {
        if (!id) return;
        try {
          const b = await bairroService.obterBairroPorId(Number(id));
          if (b && isMounted) {
            setPontos(b.pontos);
            const pontosAtivosNomes = b.pontos.filter((p) => p.ativo !== false).map((p) => p.nome);
            setNovoPontoNome('');
            setErroPonto(false);
            setModalPontoVisible(false);
            reset({
              nome: b.nome,
              pontos: pontosAtivosNomes.length > 0 ? pontosAtivosNomes : ['Ponto de Parada'],
            });
          }
        } catch (err) {
          console.warn('Erro ao carregar dados do bairro:', err);
        }
      }

      carregarDadosOficiais();

      return () => {
        isMounted = false;
        setNovoPontoNome('');
        setErroPonto(false);
        setModalPontoVisible(false);
      };
    }, [id, reset])
  );

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/bairros');
  };

  const handleBack = () => {
    if (isDirty) {
      showPopup({
        type: 'warning',
        title: 'Sair desta tela?',
        message: 'As alterações não salvas serão perdidas.',
        confirmText: 'Sim, sair',
        cancelText: 'Continuar aqui',
        confirmColor: '#B00020',
        onConfirm: voltarParaListagem,
      });
    } else {
      voltarParaListagem();
    }
  };

  const handleAdicionarPonto = () => {
    if (!novoPontoNome || novoPontoNome.trim().length < 2) {
      setErroPonto(true);
      return;
    }

    const pontoFormatado = novoPontoNome.trim();
    const indexExistente = pontos.findIndex((p) => p.nome.toLowerCase() === pontoFormatado.toLowerCase());

    if (indexExistente !== -1) {
      const pontoExistente = pontos[indexExistente];
      if (!pontoExistente.ativo) {
        // Ponto inativo encontrado -> Oferece reativação
        showPopup({
          type: 'info',
          title: 'Reativar ponto de parada?',
          message: `O ponto de parada "${pontoExistente.nome}" consta como inativo. Deseja reativá-lo?`,
          confirmText: 'Reativar',
          cancelText: 'Cancelar',
          onConfirm: () => {
            closePopup();
            const novos = [...pontos];
            novos[indexExistente].ativo = true;
            setPontos(novos);
            const nomesAtivos = novos.filter((p) => p.ativo).map((p) => p.nome);
            setValue('pontos', nomesAtivos, { shouldDirty: true });
            trigger('pontos');
            setNovoPontoNome('');
            setErroPonto(false);
            setModalPontoVisible(false);
          },
        });
        return;
      }

      showPopup({
        type: 'error',
        title: 'Aviso',
        message: 'Esta localidade já está cadastrada.',
        confirmText: 'Entendido',
      });
      return;
    }

    const novosPontos: PontoParadaItem[] = [...pontos, { id: Date.now(), nome: pontoFormatado, ativo: true }];
    setPontos(novosPontos);
    const nomesAtivos = novosPontos.filter((p) => p.ativo).map((p) => p.nome);
    setValue('pontos', nomesAtivos, { shouldDirty: true });
    trigger('pontos');
    setNovoPontoNome('');
    setErroPonto(false);
    setModalPontoVisible(false);
  };

  const handleInativarPonto = (index: number) => {
    const novos = [...pontos];
    novos[index].ativo = false;
    setPontos(novos);
    const nomesAtivos = novos.filter((p) => p.ativo).map((p) => p.nome);
    setValue('pontos', nomesAtivos.length > 0 ? nomesAtivos : [], { shouldDirty: true });
    trigger('pontos');
  };

  const handleReativarPonto = (index: number) => {
    const novos = [...pontos];
    novos[index].ativo = true;
    setPontos(novos);
    const nomesAtivos = novos.filter((p) => p.ativo).map((p) => p.nome);
    setValue('pontos', nomesAtivos, { shouldDirty: true });
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
        voltarParaListagem();
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

  const pontosAtivos = pontos.map((p, originalIdx) => ({ ...p, originalIdx })).filter((p) => p.ativo !== false);
  const pontosInativos = pontos.map((p, originalIdx) => ({ ...p, originalIdx })).filter((p) => p.ativo === false);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
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
        cancelText={popup.cancelText}
        confirmColor={popup.confirmColor}
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

        {/* Pontos de Parada Ativos */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Pontos de Parada</Text>

        <View style={styles.pontosList}>
          {pontosAtivos.map((item) => (
            <View key={item.id || item.originalIdx} style={styles.pontoRow}>
              <Text variant="bodyLarge" style={styles.pontoName}>{item.nome}</Text>
              <TouchableOpacity onPress={() => handleInativarPonto(item.originalIdx)}>
                <Trash2 size={20} color="#333" />
              </TouchableOpacity>
            </View>
          ))}

          {errors.pontos && <Text style={styles.errorText}>{errors.pontos.message}</Text>}
        </View>

        {/* Pontos Inativos (Se houver) */}
        {pontosInativos.length > 0 && (
          <View style={styles.inativosSection}>
            <Text variant="titleMedium" style={styles.inativosTitle}>Pontos Inativos</Text>
            {pontosInativos.map((item) => (
              <View key={item.id || item.originalIdx} style={styles.pontoRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyLarge" style={[styles.pontoName, { color: '#888' }]}>{item.nome}</Text>
                  <Text variant="bodySmall" style={{ color: '#888' }}>(inativo)</Text>
                </View>
                <TouchableOpacity onPress={() => handleReativarPonto(item.originalIdx)}>
                  <RotateCcw size={20} color="#333" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

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
          onPress={handleSubmit(onSubmit)}
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
  inativosSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  inativosTitle: {
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
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
