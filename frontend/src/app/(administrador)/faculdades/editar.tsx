import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Building2 } from 'lucide-react-native';

import { faculdadeSchema, FaculdadeFormData } from '@/schemas/faculdadeSchema';
import { faculdadeService } from '@/services/faculdadeService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function EditarFaculdadeScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(false);
  // id da faculdade cujos dados estão no formulário; enquanto não carregar, o formulário não aparece (#256)
  const [idCarregado, setIdCarregado] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

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

  const { control, handleSubmit, formState: { errors, isDirty }, reset, setValue, clearErrors } = useForm<FaculdadeFormData>({
    resolver: zodResolver(faculdadeSchema),
    defaultValues: {
      nome: '',
      sigla: '',
      campus: '',
    },
  });

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/faculdades');
  };

  const limparFormulario = React.useCallback(() => {
    setIdCarregado(null);
    reset({ nome: '', sigla: '', campus: '' });
  }, [reset]);

  // Ao ganhar foco, descarta o que havia no formulário e carrega os dados salvos do id atual;
  // ao sair, limpa de novo, para que um rascunho não seja enviado para outra faculdade (#256)
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      limparFormulario();
      setCarregando(true);

      async function carregarDadosOficiais() {
        if (!id) return;
        try {
          const f = await faculdadeService.obterFaculdadePorId(Number(id));
          if (!isMounted) return;
          if (!f) throw new Error('Faculdade não encontrada.');
          reset({
            nome: f.nome,
            sigla: f.sigla,
            campus: f.campus,
          });
          setIdCarregado(id);
        } catch (err: any) {
          if (!isMounted) return;
          const msg = getErrorMessage(err, 'Erro ao carregar dados da faculdade.');
          showPopup({
            type: 'error',
            title: err?.response ? 'Aviso' : 'Erro de Conexão',
            message: msg,
            confirmText: 'Entendido',
          });
        } finally {
          if (isMounted) setCarregando(false);
        }
      }

      carregarDadosOficiais();

      return () => {
        isMounted = false;
        limparFormulario();
      };
    }, [id, reset, limparFormulario])
  );

  const dadosCarregados = !!id && idCarregado === id;

  // Campo apagado não mostra erro; a mensagem de obrigatório só aparece ao salvar
  const alterarCampo = (campo: keyof FaculdadeFormData, texto: string) => {
    const preenchido = texto.trim() !== '';
    setValue(campo, texto, { shouldDirty: true, shouldValidate: preenchido });
    if (!preenchido) clearErrors(campo);
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

  const onSubmit = async (dados: FaculdadeFormData) => {
    if (!id || idCarregado !== id) return;
    setIsLoading(true);
    try {
      await faculdadeService.atualizarFaculdade(Number(id), dados.nome, dados.sigla, dados.campus);
      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Operação realizada com sucesso',
        message: 'As alterações da faculdade foram salvas.',
        confirmText: 'OK',
        onConfirm: voltarParaListagem,
      });
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao atualizar faculdade.');
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Editar Faculdade</Text>
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

      {!dadosCarregados ? (
        <View style={styles.loading}>
          {carregando && <ActivityIndicator size="large" color="#3E5F90" />}
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Nome da Instituição */}
        <View style={styles.inputBox}>
          <Controller
            control={control}
            name="nome"
            render={({ field: { value } }) => (
              <TextInput
                label="Nome da Instituição *"
                mode="outlined"
                placeholder="Nome da instituição"
                value={value}
                onChangeText={(texto) => alterarCampo('nome', texto)}
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
            render={({ field: { value } }) => (
              <TextInput
                label="Sigla do Nome *"
                mode="outlined"
                placeholder="Sigla do nome (ex.: UFC)"
                value={value}
                onChangeText={(texto) => alterarCampo('sigla', texto)}
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
            render={({ field: { value } }) => (
              <TextInput
                label="Campus *"
                mode="outlined"
                placeholder="Campus"
                value={value}
                onChangeText={(texto) => alterarCampo('campus', texto)}
                error={!!errors.campus}
                style={styles.input}
              />
            )}
          />
          {errors.campus && <Text style={styles.errorText}>{errors.campus.message}</Text>}
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
          Salvar Alterações
        </Button>
      </ScrollView>
      )}
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
