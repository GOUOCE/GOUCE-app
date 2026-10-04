import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, X } from 'lucide-react-native';

import { alunoSchema, AlunoFormData, etapa1Schema, etapa2Schema, etapa3Schema, etapa4Schema } from '@/schemas/alunoSchema';
import { Passo1DadosBasicos } from '@/components/cadastro/Passo1DadosBasicos';
import { Passo2Demografico } from '@/components/cadastro/Passo2Demografico';
import { Passo3ContatoVinculo } from '@/components/cadastro/Passo3ContatoVinculo';
import { Passo4Documentacao } from '@/components/cadastro/Passo4Documentacao';
import { TermosDeUso } from '@/components/cadastro/TermosDeUso';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

import { userService } from '@services/userService';
import { getErrorMessage } from '@/utils/errorUtils';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [passo, setPasso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Estado centralizado do Pop-up estilizado
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

  const metodos = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      temFilhos: false,
      aceitouTermos: false,
    }
  });

  const { handleSubmit, trigger, setError, clearErrors, getValues } = metodos;

  const titulos = [
    'Dados básicos',
    'Perfil demográfico',
    'Contato e Vínculo',
    'Documentação',
    'Termos de Uso'
  ];

  const proximoPasso = async () => {
    clearErrors();

    let schemaEtapa: any;
    if (passo === 1) schemaEtapa = etapa1Schema;
    if (passo === 2) schemaEtapa = etapa2Schema;
    if (passo === 3) schemaEtapa = etapa3Schema;
    if (passo === 4) schemaEtapa = etapa4Schema;

    if (schemaEtapa) {
      const valores = getValues();
      const resultado = schemaEtapa.safeParse(valores);

      if (!resultado.success) {
        resultado.error.issues.forEach((issue: any) => {
          if (issue.path && issue.path.length > 0) {
            setError(issue.path[0] as any, { message: issue.message });
          }
        });
        return;
      }
    }

    if (passo === 1) {
      setIsLoading(true);
      const email = metodos.getValues('email');
      const existe = await userService.verificarEmail(email);
      setIsLoading(false);
      if (existe) {
        showPopup({
          type: 'warning',
          title: 'E-mail em uso',
          message: 'Este e-mail já está cadastrado no sistema. Por favor, utilize outro e-mail ou a opção "Esqueci minha senha".',
          confirmText: 'Entendido',
        });
        return;
      }
    }

    clearErrors();
    setPasso(passo + 1);
  };

  const voltarPasso = () => {
    clearErrors();
    if (passo > 1) {
      setPasso(passo - 1);
    } else {
      solicitarConfirmacaoSaida();
    }
  };

  const solicitarConfirmacaoSaida = () => {
    showPopup({
      type: 'warning',
      title: 'Cancelar cadastro?',
      message: 'Se você sair agora, todos os dados preenchidos até este passo serão perdidos.',
      confirmText: 'Sim, sair',
      cancelText: 'Continuar preenchendo',
      confirmColor: '#B00020',
      onConfirm: confirmarSaida,
    });
  };

  const confirmarSaida = () => {
    closePopup();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const onSubmit = async (dados: AlunoFormData) => {
    setIsLoading(true);
    try {
      const response = await userService.register(dados);

      if (response.success) {
        router.replace('/(autenticacao)/cadastro-pendente');
      }
    } catch (error: any) {
      console.error('[REGISTER DEBUG] Error object:', error);
      const message = getErrorMessage(error, 'Erro ao realizar cadastro. Tente novamente.');
      showPopup({
        type: 'error',
        title: 'Aviso no Cadastro',
        message,
        confirmText: 'Entendido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...metodos}>
      <KeyboardAvoidingView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={voltarPasso}>
            <ChevronLeft size={28} color="#333" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>Criar conta</Text>
          <TouchableOpacity onPress={solicitarConfirmacaoSaida}>
            <X size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Pop-up Estilizado Personalizado */}
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

        {/* Conteúdo */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {passo <= 4 && (
            <Text variant="titleMedium" style={styles.stepIndicator}>
              Passo {passo} de 4 - {titulos[passo-1]}
            </Text>
          )}
          {passo === 5 && (
            <View style={styles.termsHeader}>
              <Text variant="headlineSmall" style={styles.termsTitle}>Termos de Uso</Text>
              <Text variant="bodyMedium" style={styles.termsSubtitle}>
                Para fazer parte da Associação dos Universitários de Ocara (AUO) é necessário estar ciente do seu estatuto e do regimento interno. Leia com atenção:
              </Text>
            </View>
          )}

          <View style={styles.formContainer}>
            {passo === 1 && <Passo1DadosBasicos />}
            {passo === 2 && <Passo2Demografico />}
            {passo === 3 && <Passo3ContatoVinculo />}
            {passo === 4 && <Passo4Documentacao />}
            {passo === 5 && <TermosDeUso />}
          </View>
        </ScrollView>

        {/* Footer com Botão */}
        <View style={styles.footer}>
          {passo < 5 ? (
            <Button
              mode="contained"
              onPress={proximoPasso}
              loading={isLoading}
              disabled={isLoading}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
            >
              Próximo
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.actionButton}
              contentStyle={styles.buttonContent}
              disabled={!metodos.watch('aceitouTermos') || isLoading}
            >
              Concluir cadastro
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  stepIndicator: {
    marginBottom: 24,
    fontWeight: '600',
    color: '#333',
  },
  termsHeader: {
    marginBottom: 24,
  },
  termsTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  termsSubtitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
  formContainer: {
    flex: 1,
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    borderRadius: 8,
  },
  buttonContent: {
    height: 55,
  },
});
