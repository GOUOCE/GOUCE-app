import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Portal } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Trash2 } from 'lucide-react-native';

import { bairroSchema, BairroFormData, pontoParadaSchema } from '@/schemas/bairroSchema';
import { bairroService } from '@/services/bairroService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarBairroScreen() {
  const router = useRouter();

  const [pontos, setPontos] = useState<string[]>([]);
  const [modalPontoVisible, setModalPontoVisible] = useState(false);
  const [novoPontoNome, setNovoPontoNome] = useState('');
  const [erroPonto, setErroPonto] = useState('');
  const [isLoading, setIsLoading] = useState(false);


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

  const { control, handleSubmit, formState: { errors }, setValue, trigger, reset } = useForm<BairroFormData>({
    resolver: zodResolver(bairroSchema),
    defaultValues: {
      nome: '',
      pontos: [],
    },
  });

  // Reseta o formulário e o modal sempre que a tela ganha/perde foco
  useFocusEffect(
    React.useCallback(() => {
      setPontos([]);
      setNovoPontoNome('');
      setErroPonto('');
      setModalPontoVisible(false);
      reset({
        nome: '',
        pontos: [],
      });

      return () => {
        setPontos([]);
        setNovoPontoNome('');
        setErroPonto('');
        setModalPontoVisible(false);
        reset({
          nome: '',
          pontos: [],
        });
      };
    }, [reset])
  );

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/bairros');
  };

  const abrirModalPonto = () => {
    setNovoPontoNome('');
    setErroPonto('');
    setModalPontoVisible(true);
  };

  const cancelarModalPonto = () => {
    setModalPontoVisible(false);
    setNovoPontoNome('');
    setErroPonto('');
  };

  const handleAdicionarPonto = () => {
    const resultado = pontoParadaSchema.safeParse(novoPontoNome);
    if (!resultado.success) {
      setErroPonto(resultado.error.issues[0].message);
      return;
    }

    const pontoFormatado = resultado.data;
    if (pontos.some((p) => p.toLowerCase() === pontoFormatado.toLowerCase())) {
      setModalPontoVisible(false);
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
    setErroPonto('');
    setModalPontoVisible(false);
  };

  const handleRemoverPonto = (index: number) => {
    const novosPontos = pontos.filter((_, i) => i !== index);
    setPontos(novosPontos);
    setValue('pontos', novosPontos);
    trigger('pontos');
  };

  const onSubmit = (dados: BairroFormData) => {
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
          await bairroService.criarBairro(dados.nome, pontos);
          setIsLoading(false);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'Bairro cadastrado com sucesso.',
            confirmText: 'OK',
            onConfirm: voltarParaListagem,
          });
        } catch (error: any) {
          setIsLoading(false);
          const msg = getErrorMessage(error, 'Erro ao cadastrar bairro.');
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

  const mensagemErroPontos = errors.pontos?.message || (Array.isArray(errors.pontos)
    ? errors.pontos.find((erro) => erro?.message)?.message : undefined);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarParaListagem}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Novo Bairro</Text>
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
        onDismiss={popup.type === 'success' ? voltarParaListagem : closePopup}
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

          {mensagemErroPontos && <Text accessibilityRole="alert" style={styles.errorText}>{mensagemErroPontos}</Text>}
        </View>

        {/* Botão Adicionar Ponto de Parada */}
        <Button
          mode="outlined"
          onPress={abrirModalPonto}
          style={styles.addPontoButton}
          labelStyle={styles.addPontoLabel}
        >
          Adicionar ponto de parada
        </Button>

        {/* Botão Finalizar Cadastro */}
        <Button
          mode="contained"
          onPress={() => { void handleSubmit(onSubmit)(); }}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Finalizar cadastro
        </Button>
      </ScrollView>

      {/* Modal Novo Ponto de Parada */}
      <Portal>
        <RNModal visible={modalPontoVisible} transparent={true} animationType="fade" onRequestClose={cancelarModalPonto}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Novo ponto de parada</Text>
              <Text variant="bodyMedium" style={styles.modalSubtitle}>Adicione um nome para o novo ponto.</Text>

              <TextInput
                label="Nome do Ponto *"
                mode="outlined"
                value={novoPontoNome}
                onChangeText={(texto) => {
                  setNovoPontoNome(texto);
                  if (erroPonto) {
                    const resultado = pontoParadaSchema.safeParse(texto);
                    setErroPonto(resultado.success ? '' : resultado.error.issues[0].message);
                  }
                }}
                error={!!erroPonto}
                style={{ backgroundColor: '#fff', marginBottom: 16 }}
              />
              {!!erroPonto && <Text accessibilityRole="alert" style={styles.errorTextModal}>{erroPonto}</Text>}

              <View style={styles.modalButtons}>
                <Button mode="text" onPress={cancelarModalPonto}>
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
});
