import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react-native';

import {
  avisoSchema,
  AvisoFormData,
  TITULO_AVISO_MAX,
  DESCRICAO_AVISO_MAX,
} from '@/schemas/avisoSchema';
import { avisoService } from '@/services/avisoService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarAvisoScreen() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

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

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    clearErrors,
  } = useForm<AvisoFormData>({
    resolver: zodResolver(avisoSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      titulo: '',
      descricao: '',
    },
  });

  useFocusEffect(
    React.useCallback(() => {
      reset({
        titulo: '',
        descricao: '',
      });

      return () => {
        reset({
          titulo: '',
          descricao: '',
        });
      };
    }, [reset])
  );

  const atualizarCampo = (campo: 'titulo' | 'descricao', valor: string) => {
    const preenchido = valor.trim() !== '';
    setValue(campo, valor, {
      shouldDirty: true,
      shouldValidate: preenchido && isSubmitted,
    });
    if (!preenchido && !isSubmitted) {
      clearErrors(campo);
    }
  };

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/notificacoes' as any);
  };

  const onSubmit = async (dados: AvisoFormData) => {
    setIsLoading(true);
    try {
      await avisoService.criarAviso(dados.titulo, dados.descricao);
      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Operação realizada com sucesso',
        message: 'Aviso publicado com sucesso.',
        confirmText: 'OK',
        onConfirm: voltarParaListagem,
      });
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao publicar aviso.');
      showPopup({
        type: 'error',
        title: 'Aviso',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F8F9FF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={voltarParaListagem}>
          <ArrowLeft size={26} color="#191C20" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Novo Aviso
        </Text>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Campo Título */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="titulo"
            render={({ field: { onBlur, value } }) => (
              <TextInput
                label="Título *"
                mode="outlined"
                placeholder="Título do aviso"
                value={value}
                onBlur={onBlur}
                onChangeText={(texto) => atualizarCampo('titulo', texto)}
                maxLength={TITULO_AVISO_MAX}
                error={!!errors.titulo}
                style={styles.input}
              />
            )}
          />
          {errors.titulo && (
            <Text style={styles.errorText}>{errors.titulo.message}</Text>
          )}
        </View>

        {/* Campo Descrição */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="descricao"
            render={({ field: { onBlur, value } }) => (
              <TextInput
                label="Descrição *"
                mode="outlined"
                placeholder="Digite a mensagem do comunicado..."
                value={value}
                onBlur={onBlur}
                onChangeText={(texto) => atualizarCampo('descricao', texto)}
                multiline
                numberOfLines={12}
                maxLength={DESCRICAO_AVISO_MAX}
                error={!!errors.descricao}
                style={[styles.input, styles.textareaInput]}
                contentStyle={styles.textareaContent}
              />
            )}
          />
          {errors.descricao && (
            <Text style={styles.errorText}>{errors.descricao.message}</Text>
          )}
        </View>

        {/* Botão Salvar Aviso */}
        <Button
          mode="contained"
          onPress={handleSubmit(onSubmit) as any}
          loading={isLoading}
          disabled={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Salvar aviso
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontWeight: '400',
    color: '#191C20',
    fontSize: 24,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  inputBox: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F8F9FF',
  },
  textareaInput: {
    minHeight: 340,
  },
  textareaContent: {
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 12,
    marginTop: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  saveButton: {
    borderRadius: 8,
    marginTop: 12,
    backgroundColor: '#3E5F90',
  },
  buttonContent: {
    height: 48,
  },
});
