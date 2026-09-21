import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  Text,
  useTheme,
  Portal
} from 'react-native-paper';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, X } from 'lucide-react-native';

import { alunoSchema, AlunoFormData } from '@/schemas/alunoSchema';
import { Passo1DadosBasicos } from '@/components/cadastro/Passo1DadosBasicos';
import { Passo2Demografico } from '@/components/cadastro/Passo2Demografico';
import { Passo3ContatoVinculo } from '@/components/cadastro/Passo3ContatoVinculo';
import { Passo4Documentacao } from '@/components/cadastro/Passo4Documentacao';
import { TermosDeUso } from '@/components/cadastro/TermosDeUso';

import { userService } from '@services/userService';
import { useAuth } from '@contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { setUserAndToken } = useAuth();
  const [passo, setPasso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

  const metodos = useForm<AlunoFormData>({
    resolver: zodResolver(alunoSchema),
    mode: 'onChange',
    defaultValues: {
      temFilhos: false,
      aceitouTermos: false,
    }
  });

  const { handleSubmit, trigger } = metodos;

  const titulos = [
    'Dados básicos',
    'Perfil demográfico',
    'Contato e Vínculo',
    'Documentação',
    'Termos de Uso'
  ];

  const proximoPasso = async () => {
    let camposParaValidar: any[] = [];

    if (passo === 1) camposParaValidar = ['nomeCompleto', 'email', 'dataNascimento', 'senha', 'confirmarSenha'];
    if (passo === 2) camposParaValidar = ['raca', 'identificacaoSexual', 'genero', 'transgenero'];
    if (passo === 3) camposParaValidar = ['bairro', 'whatsapp', 'instituicao', 'curso', 'campus', 'periodoIngresso', 'turno', 'semestreAtual'];
    if (passo === 4) camposParaValidar = ['comprovanteMatricula', 'comprovanteResidencia'];

    const valido = await trigger(camposParaValidar);
    if (valido) {
      if (passo === 1) {
        setIsLoading(true);
        const email = metodos.getValues('email');
        const existe = await userService.verificarEmail(email);
        setIsLoading(false);
        if (existe) {
          alert('Este e-mail já está em uso no sistema. Por favor, utilize outro ou recupere sua senha.');
          return;
        }
      }
      setPasso(passo + 1);
    }
  };

  const voltarPasso = () => {
    if (passo > 1) {
      setPasso(passo - 1);
    } else {
      setModalSairVisivel(true);
    }
  };

  const confirmarSaida = () => {
    setModalSairVisivel(false);
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

      const userData = {
        id: String(response.usuario.id),
        name: response.usuario.nome || response.usuario.nome_completo || '',
        email: response.usuario.email,
        role: 'ALUNO' as const,
        status: 'pendente' as const, // Força o status inicial para análise
      };

      await setUserAndToken(userData, response.token_acesso);
      // O AuthContext cuidará do redirecionamento para /cadastro-pendente
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Erro ao realizar cadastro. Tente novamente.';
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...metodos}>
      <View style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={voltarPasso}>
            <ChevronLeft size={28} color="#333" />
          </TouchableOpacity>
          <Text variant="titleLarge" style={styles.headerTitle}>Criar conta</Text>
          <TouchableOpacity onPress={() => setModalSairVisivel(true)}>
            <X size={28} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Modal de Confirmação de Saída */}
        <Portal>
          <Modal
            visible={modalSairVisivel}
            onDismiss={() => setModalSairVisivel(false)}
          >
            <View style={styles.modalContent}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Cancelar cadastro?</Text>
              <Text variant="bodyLarge" style={styles.modalText}>
                Se você sair agora, todos os dados preenchidos até este passo serão perdidos.
              </Text>
              <View style={styles.modalButtons}>
                <Button
                  mode="text"
                  onPress={() => setModalSairVisivel(false)}
                  style={styles.modalBtn}
                >
                  Continuar preenchendo
                </Button>
                <Button
                  mode="contained"
                  onPress={confirmarSaida}
                  style={[styles.modalBtn, { backgroundColor: '#B00020' }]}
                >
                  Sim, sair
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>

        {/* Conteúdo */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
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
      </View>
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
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 24,
    gap: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalText: {
    color: '#666',
    lineHeight: 24,
  },
  modalButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  modalBtn: {
    borderRadius: 8,
  }
});
