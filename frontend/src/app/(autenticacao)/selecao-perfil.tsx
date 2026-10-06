import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, useTheme } from 'react-native-paper';
import { ChevronLeft, IdCard, Contact, Shield } from 'lucide-react-native';

import { CardPerfil } from '@/components/auth/CardPerfil';
import { useAuth } from '@contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function SelecaoPerfilScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { email: emailParam, senha: senhaParam } = useLocalSearchParams<{ email?: string; senha?: string }>();
  const { signIn, pendingCredentials, clearPendingCredentials, isLoading } = useAuth();

  const emailFinal = pendingCredentials?.email || emailParam || '';
  const senhaFinal = pendingCredentials?.senha || senhaParam || '';

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

  const handleBack = () => {
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

  const confirmarSaida = () => {
    closePopup();
    clearPendingCredentials();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSelectProfile = async (perfil: 'ALUNO' | 'MOTORISTA' | 'ADMINISTRADOR') => {
    try {
      await signIn(emailFinal, senhaFinal, perfil);
    } catch (error: any) {
      if (error.code === 'ROLE_MISMATCH' || error.message?.includes('Perfil')) {
        showPopup({
          type: 'warning',
          title: 'Perfil Incompatível',
          message: error.message || 'Sua conta pertence a outro perfil de acesso. Escolha a opção correspondente.',
          confirmText: 'Entendido',
        });
        return;
      }

      const status = error.response?.status;
      const detail = error.response?.data?.detail || "";

      // Caso a conta esteja pendente (HU-001/HU-002)
      if ((status === 401 || status === 403) && typeof detail === 'string' && detail.toLowerCase().includes('pendente')) {
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <ChevronLeft size={32} color="#333" />
      </TouchableOpacity>

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

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text>Autenticando...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 40,
    marginLeft: -8,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#333',
  },
  cardList: {
    gap: 8,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
