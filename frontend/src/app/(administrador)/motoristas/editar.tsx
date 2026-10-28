import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, User, Phone } from 'lucide-react-native';

import { motoristaSchema, MotoristaFormData } from '@/schemas/motoristaSchema';
import { motoristaService } from '@/services/motoristaService';
import { getErrorMessage } from '@/utils/errorUtils';
import { formatarTelefone } from '@/utils/formatarTelefone';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarMotoristaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tentativa, setTentativa] = useState(0);
  const recarregar = React.useCallback(() => setTentativa((atual) => atual + 1), []);
  return <EditarMotoristaForm key={`${id}-${tentativa}`} id={id} onRetry={recarregar} />;
}

function EditarMotoristaForm({ id, onRetry }: { id: string; onRetry: () => void }) {
  const router = useRouter();

  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const showPopup = React.useCallback((config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  }, []);

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const { control, handleSubmit, formState: { errors, isDirty, isSubmitted }, reset, setValue, clearErrors } = useForm<MotoristaFormData>({
    resolver: zodResolver(motoristaSchema),
    defaultValues: {
      nome: '',
      telefone: '',
    },
  });

  // Recarrega os dados oficiais do banco de dados ao ganhar foco e descarta alterações não salvas ao sair
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      setDadosCarregados(false);
      reset({ nome: '', telefone: '' });

      async function carregarDadosOficiais() {
        if (!id) return;
        try {
          const m = await motoristaService.obterMotoristaPorId(Number(id));
          if (!isMounted) return;
          if (!m) throw new Error('Motorista não encontrado.');
          if (m) {
            reset({
              nome: m.nome,
              telefone: formatarTelefone(m.telefone) || m.telefone,
            });
            setDadosCarregados(true);
          }
        } catch (err) {
          if (!isMounted) return;
          const msg = getErrorMessage(err, 'Erro ao carregar dados do motorista.');
          showPopup({
            type: 'error',
            title: 'Erro de Conexão',
            message: msg,
            confirmText: 'Tentar novamente',
            onConfirm: () => { closePopup(); onRetry(); },
          });
        }
      }

      carregarDadosOficiais();

      return () => {
        isMounted = false;
        setDadosCarregados(false);
        reset({ nome: '', telefone: '' });
      };
    }, [id, reset, showPopup, onRetry])
  );

  const atualizarCampo = (campo: 'nome' | 'telefone', valor: string) => {
    const preenchido = valor.trim() !== '';
    setValue(campo, valor, { shouldDirty: true, shouldValidate: preenchido && isSubmitted });
    if (!preenchido) clearErrors(campo);
  };

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/motoristas');
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

  const onSubmit = async (dados: MotoristaFormData) => {
    if (!id || !dadosCarregados) return;
    setIsLoading(true);
    try {
      await motoristaService.atualizarMotorista(Number(id), dados.nome, dados.telefone);
      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Operação realizada com sucesso',
        message: 'As alterações do profissional foram salvas.',
        confirmText: 'OK',
        onConfirm: voltarParaListagem,
      });
    } catch (error: any) {
      setIsLoading(false);
      const status = error.response?.status;
      const msg =
        status === 409 || error.message?.includes('registrado')
          ? 'Este profissional já está registrado.'
          : getErrorMessage(error, 'Erro ao atualizar motorista.');

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
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Motorista</Text>
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
        onDismiss={popup.type === 'success' ? voltarParaListagem : closePopup}
      />

      {!dadosCarregados ? <ActivityIndicator accessibilityLabel="Carregando motorista" /> : <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Nome Completo */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { value } }) => (
              <TextInput
                label="Nome Completo *"
                mode="outlined"
                placeholder="Nome do motorista"
                value={value}
                onChangeText={(texto) => atualizarCampo('nome', texto)}
                error={!!errors.nome}
                left={<TextInput.Icon icon={() => <User size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
        </View>

        {/* Telefone */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="telefone"
            render={({ field: { onBlur, value } }) => (
              <TextInput
                label="Telefone *"
                mode="outlined"
                placeholder="(88) 9 9999-9999"
                value={value}
                onChangeText={(text) => atualizarCampo('telefone', formatarTelefone(text))}
                onBlur={() => {
                  onBlur();
                  if (value) atualizarCampo('telefone', formatarTelefone(value));
                }}
                maxLength={16}
                keyboardType="phone-pad"
                error={!!errors.telefone}
                left={<TextInput.Icon icon={() => <Phone size={20} color="#666" />} />}
                style={styles.input}
              />
            )}
          />
          {errors.telefone && <Text style={styles.errorText}>{errors.telefone.message}</Text>}
        </View>

        {/* Botão Salvar Alterações */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit) as any}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Salvar alterações
        </Button>
      </ScrollView>}
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
});
