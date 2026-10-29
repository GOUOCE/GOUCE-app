import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import {
  Text,
  Button,
  Surface,
  useTheme,
} from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, X, RefreshCw } from 'lucide-react-native';

import { renovacaoSchema, RenovacaoFormData, AlunoFormData } from '@/schemas/alunoSchema';
import { Passo1DadosBasicos } from '@/components/cadastro/Passo1DadosBasicos';
import { Passo2Demografico } from '@/components/cadastro/Passo2Demografico';
import { Passo3ContatoVinculo } from '@/components/cadastro/Passo3ContatoVinculo';
import { Passo4Documentacao } from '@/components/cadastro/Passo4Documentacao';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { userService } from '@services/userService';
import { api } from '../../api/api';
import { getErrorMessage } from '@/utils/errorUtils';
import { useAuth } from '@contexts/AuthContext';

export default function RenovarVinculoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, updateUser } = useAuth();
  const statusAtual = (user?.status || '').toLowerCase();
  // Já existe uma solicitação aguardando a coordenação (#133)
  const emAnalise = statusAtual === 'analise_renovacao' || statusAtual === 'pendente';

  const [passo, setPasso] = useState<number>(0); // 0 = Tela Inicial de Aviso, 1..4 = Passos do formulário
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Pop-up estilizado para erro/confirmação
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

  const metodos = useForm<RenovacaoFormData>({
    resolver: zodResolver(renovacaoSchema),
    mode: 'onChange',
    defaultValues: {
      temFilhos: false,
      aceitouTermos: true,
    },
  });

  const { handleSubmit, trigger, reset, clearErrors } = metodos;

  // Reseta o estado e volta para a tela inicial de aviso sempre que a tela ganha foco (BUG-HU028-UI-008)
  useFocusEffect(
    React.useCallback(() => {
      setPasso(0);
      reset();
      clearErrors();
    }, [])
  );

  // Pré-preenchimento dos dados do aluno autenticado
  const carregarEPreencherDados = async () => {
    setIsLoading(true);
    try {
      const perfilApi = await userService.getProfile();
      if (perfilApi) {
        const formatarDataNascimento = (valor: any) => {
          if (!valor) return '';
          const str = String(valor).replace(/\D/g, '');
          if (str.length === 8) {
            return `${str.slice(6, 8)}/${str.slice(4, 6)}/${str.slice(0, 4)}`;
          }
          return String(valor);
        };

        // A API devolve "Campus Quixadá"; as opções do seletor são só o nome da cidade
        const campus = String(perfilApi.campus || '').replace(/^campus\s+/i, '');
        // A foto é um id de arquivo; para exibir no passo 1 precisa da URL autenticada
        const idFoto = perfilApi.id_foto_aluno || perfilApi.foto_perfil || '';
        const fotoPerfil = idFoto
          ? String(idFoto).startsWith('http')
            ? idFoto
            : `${api.defaults.baseURL}/arquivos/${idFoto}/view?token=${token || ''}`
          : '';

        reset({
          fotoPerfil,
          nomeCompleto: perfilApi.nome || perfilApi.nome_completo || user?.name || '',
          email: perfilApi.email || user?.email || '',
          dataNascimento: formatarDataNascimento(perfilApi.data_nascimento),
          raca: perfilApi.raca || 'Preto',
          identificacaoSexual: perfilApi.identificacao_sexual || 'Bissexual',
          genero: perfilApi.identificacao_genero || 'Homem',
          transgenero: perfilApi.transgenero || 'Não',
          temFilhos: Boolean(perfilApi.tem_filhos),
          bairro: String(perfilApi.bairro_id ?? perfilApi.bairro ?? ''),
          whatsapp: perfilApi.telefone || '',
          instituicao: String(perfilApi.faculdade_id || ''),
          curso: perfilApi.curso || 'Engenharia de Software',
          campus: campus || 'Quixadá',
          periodoIngresso: perfilApi.periodo_ingresso || '2024.1',
          turno: perfilApi.turno_curso || 'Noturno',
          semestreAtual: String(perfilApi.semestre_atual || '8º').includes('º')
            ? String(perfilApi.semestre_atual)
            : `${perfilApi.semestre_atual || 8}º`,
          aceitouTermos: true,
          comprovanteMatricula: null,
          comprovanteResidencia: null,
        });
      }
    } catch (err) {
      console.warn('Aviso ao carregar dados do perfil para renovação:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const iniciarRenovacao = async () => {
    await carregarEPreencherDados();
    clearErrors();
    setPasso(1);
  };

  const proximoPasso = async () => {
    clearErrors();

    let camposParaValidar: any[] = [];

    if (passo === 1) camposParaValidar = ['nomeCompleto', 'dataNascimento'];
    if (passo === 2) camposParaValidar = ['raca', 'identificacaoSexual', 'genero', 'transgenero'];
    if (passo === 3) camposParaValidar = ['bairro', 'whatsapp', 'instituicao', 'curso', 'campus', 'periodoIngresso', 'turno', 'semestreAtual'];
    if (passo === 4) camposParaValidar = ['comprovanteMatricula'];

    const valido = await trigger(camposParaValidar);
    if (valido) {
      clearErrors();
      if (passo < 4) {
        setPasso(passo + 1);
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  const voltarPasso = () => {
    clearErrors();
    if (passo > 1) {
      setPasso(passo - 1);
    } else if (passo === 1) {
      solicitarConfirmacaoCancelamento();
    } else {
      router.back();
    }
  };

  const solicitarConfirmacaoCancelamento = () => {
    showPopup({
      type: 'warning',
      title: 'Cancelar renovação?',
      message: 'Se você sair agora, todas as alterações feitas serão perdidas e a renovação cancelada.',
      confirmText: 'Sair',
      cancelText: 'Continuar',
      confirmColor: '#B00020',
      onConfirm: () => {
        closePopup();
        setPasso(0);
        reset();
        router.back();
      },
    });
  };

  const onSubmit = async (dados: RenovacaoFormData) => {
    setIsLoading(true);
    try {
      await userService.renovarVinculo(dados as AlunoFormData);
      await updateUser({ status: 'analise_renovacao' });

      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Comprovante enviado com sucesso',
        message: 'Sua solicitação de renovação foi enviada para análise da coordenação.',
        confirmText: 'Entendido',
        onConfirm: () => {
          closePopup();
          setPasso(0);
          reset();
          router.replace('/(aluno)/perfil');
        },
      });
    } catch (error: any) {
      setIsLoading(false);
      console.error('Erro na renovação de vínculo:', error);
      const msgError = getErrorMessage(
        error,
        'Falha no envio. Verifique sua conexão e tente novamente.'
      );
      showPopup({
        type: 'error',
        title: 'Falha no envio',
        message: msgError,
        confirmText: 'Tentar novamente',
      });
    }
  };

  const renderCardAviso = () => {
    const status = (user?.status || '').toLowerCase();

    if (status === 'analise_renovacao') {
      return (
        <Surface style={[styles.alertCard, { backgroundColor: '#FFF3E0' }]} elevation={0}>
          <RefreshCw size={24} color="#E65100" />
          <Text style={[styles.alertText, { color: '#E65100' }]}>
            Pendente: vínculo em análise
          </Text>
        </Surface>
      );
    }

    if (status === 'expirado' || status === 'vencido') {
      return (
        <Surface style={[styles.alertCard, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <RefreshCw size={24} color="#904a45" />
          <Text style={[styles.alertText, { color: '#904a45' }]}>
            Vínculo expirado - renovação necessária
          </Text>
        </Surface>
      );
    }

    return (
      <Surface style={[styles.alertCard, { backgroundColor: '#E1F5FE' }]} elevation={0}>
        <RefreshCw size={24} color="#0288D1" />
        <Text style={[styles.alertText, { color: '#0288D1' }]}>
          Vínculo institucional ativo
        </Text>
      </Surface>
    );
  };

  return (
    <FormProvider {...metodos}>
      <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={voltarPasso}>
            <ChevronLeft size={32} color="#333" />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>Renovar Vínculo</Text>
          {passo > 0 && (
            <TouchableOpacity onPress={solicitarConfirmacaoCancelamento} style={styles.closeBtnHeader}>
              <X size={28} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        {/* Pop-up Estilizado (Erros / Confirmação de Saída / Sucesso) */}
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

        {/* TELA INICIAL (Aviso de Vínculo) */}
        {passo === 0 && (
          <View style={styles.content}>
            {renderCardAviso()}

            <Text variant="bodyLarge" style={styles.instruction}>
              Para revalidar seu vínculo institucional, você precisa revisar seus dados cadastrais e enviar um comprovante de matrícula atualizado.
            </Text>

            {emAnalise && (
              <Text variant="bodyMedium" style={styles.avisoEmAnalise}>
                {statusAtual === 'pendente'
                  ? 'Seu cadastro ainda está em análise. Aguarde a resposta da coordenação.'
                  : 'Sua renovação de vínculo já está em análise. Aguarde a resposta da coordenação.'}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={iniciarRenovacao}
              loading={isLoading}
              disabled={isLoading || emAnalise}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
            >
              Iniciar renovação
            </Button>
          </View>
        )}

        {/* PASSO A PASSO (1 a 4) */}
        {passo > 0 && (
          <View style={styles.formWrapper}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text variant="titleMedium" style={styles.stepIndicator}>
                {passo === 1 && 'Passo 1 de 4 - Dados básicos'}
                {passo === 2 && 'Passo 2 de 4 - Perfil demográfico'}
                {passo === 3 && 'Passo 3 de 4 - Contato e Vínculo'}
                {passo === 4 && 'Passo 4 de 4 - Documentação'}
              </Text>

              <View style={styles.formContainer}>
                {passo === 1 && <Passo1DadosBasicos isRenovacao={true} />}
                {passo === 2 && <Passo2Demografico />}
                {passo === 3 && <Passo3ContatoVinculo />}
                {passo === 4 && <Passo4Documentacao isRenovacao={true} />}
              </View>
            </ScrollView>

            {/* Footer com Botão Próximo/Continuar */}
            <View style={styles.footer}>
              <Button
                mode="contained"
                onPress={passo === 4 ? handleSubmit(onSubmit) as any : proximoPasso}
                loading={isLoading}
                disabled={isLoading}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
              >
                {passo === 4 ? 'Continuar' : 'Próximo'}
              </Button>
            </View>
          </View>
        )}
      </View>
    </FormProvider>
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
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  closeBtnHeader: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  alertText: {
    fontWeight: '500',
    flex: 1,
  },
  instruction: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 40,
  },
  avisoEmAnalise: {
    color: '#E65100',
    marginTop: -24,
    marginBottom: 24,
  },
  formWrapper: {
    flex: 1,
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
  formContainer: {
    flex: 1,
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  primaryButton: {
    borderRadius: 8,
    backgroundColor: '#3e5f90',
  },
  buttonContent: {
    height: 55,
  },
});
