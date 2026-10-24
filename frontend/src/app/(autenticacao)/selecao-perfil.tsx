import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from 'react-native-paper';
import { ChevronLeft, IdCard, Contact, Shield } from 'lucide-react-native';

import { CardPerfil } from '@/components/auth/CardPerfil';
import { useAuth } from '@contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function SelecaoPerfilScreen() {
  const router = useRouter();
  const { signIn, pendingCredentials, clearPendingCredentials } = useAuth();
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);

  const emailFinal = (pendingCredentials?.email || '').trim().toLowerCase();
  const senhaFinal = pendingCredentials?.senha || '';

  // Se não houver credenciais pendentes, redireciona ao login
  useEffect(() => {
    if (!pendingCredentials || !pendingCredentials.email || !pendingCredentials.senha) {
      router.replace('/(autenticacao)/login');
    }
  }, [pendingCredentials, router]);

  // Estado do Pop-up
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

  const confirmarSaida = () => {
    closePopup();
    clearPendingCredentials();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleBack = () => {
    if (isLoadingLocal) return;
    showPopup({
      type: 'warning',
      title: 'Sair desta tela?',
      message: 'As credenciais informadas serão perdidas e você precisará digitá-las novamente.',
      confirmText: 'Sim, sair',
      cancelText: 'Continuar aqui',
      confirmColor: '#B00020',
      onConfirm: confirmarSaida,
    });
  };

  const handleSelectProfile = async (perfil: 'ALUNO' | 'MOTORISTA' | 'ADMINISTRADOR') => {
    if (!emailFinal || !senhaFinal) {
      router.replace('/(autenticacao)/login');
      return;
    }

    if (isLoadingLocal) return;
    setIsLoadingLocal(true);

    try {
      await signIn(emailFinal, senhaFinal, perfil);
    } catch (error: any) {
      setIsLoadingLocal(false);

      if (error.code === 'ROLE_MISMATCH' || error.message?.includes('Perfil')) {
        showPopup({
          type: 'warning',
          title: 'Perfil Incompatível',
          message:
            error.message ||
            'Sua conta pertence a outro perfil de acesso. Escolha a opção correspondente.',
          confirmText: 'Entendido',
        });
        return;
      }

      const status = error.response?.status;
      const detail = error.response?.data?.detail || '';

      // Caso a conta esteja pendente (HU-001/HU-002)
      if (
        (status === 401 || status === 403) &&
        typeof detail === 'string' &&
        (detail.toLowerCase().includes('pendente') ||
         detail.toLowerCase().includes('coordenação') ||
         detail.toLowerCase().includes('aprovação'))
      ) {
        router.replace('/(autenticacao)/cadastro-pendente');
        return;
      }

      const message = getErrorMessage(error, 'E-mail ou senha incorretos. Tente novamente.');
      showPopup({
        type: 'error',
        title: 'Falha na Autenticação',
        message,
        confirmText: 'Tentar novamente',
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          disabled={isLoadingLocal}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>

        <Text variant="headlineMedium" style={styles.title}>Como você quer entrar?</Text>

        <View style={styles.cardList}>
          <CardPerfil
            titulo="Sou aluno"
            descricao="Agendamento, mural e carteirinha digital"
            Icone={IdCard}
            onPress={() => handleSelectProfile('ALUNO')}
          />

          <CardPerfil
            titulo="Sou representante"
            descricao="Chamada e lista de embarque da sua universidade"
            Icone={Contact}
            onPress={() => handleSelectProfile('MOTORISTA')}
          />

          <CardPerfil
            titulo="Sou administrador"
            descricao="Gestão completa do transporte"
            Icone={Shield}
            onPress={() => handleSelectProfile('ADMINISTRADOR')}
          />
        </View>
      </View>

      {/* Indicador de autenticação: embaixo, centralizado */}
      {isLoadingLocal && (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#3e5f90" />
          <Text style={styles.loadingText}>Autenticando...</Text>
        </View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#F8F9FF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
    marginLeft: -4,
  },
  title: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 28,
  },
  cardList: {
    gap: 16,
  },
  loadingFooter: {
    position: 'absolute',
    bottom: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
  },
});
