import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, useTheme, Button, Portal, Modal } from 'react-native-paper';
import { ChevronLeft, IdCard, Contact, Shield } from 'lucide-react-native';

import { CardPerfil } from '@/components/auth/CardPerfil';
import { useAuth } from '@contexts/AuthContext';

export default function SelecaoPerfilScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { email, senha } = useLocalSearchParams<{ email: string; senha: string }>();
  const { signIn, isLoading } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

  const handleBack = () => {
    setModalSairVisivel(true);
  };

  const confirmarSaida = () => {
    setModalSairVisivel(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSelectProfile = async (perfil: 'ALUNO' | 'MOTORISTA' | 'ADMINISTRADOR') => {
    try {
      await signIn(email, senha);
    } catch (error: any) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || "";

      // Caso a conta esteja pendente (HU-001/HU-002)
      if (status === 403 && detail.includes('pendente')) {
        router.replace('/(autenticacao)/cadastro-pendente');
        return;
      }

      const message = detail || 'E-mail ou senha incorretos. Tente novamente.';
      Alert.alert('Falha na autenticação', message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <ChevronLeft size={32} color="#333" />
      </TouchableOpacity>

      {/* Modal de Confirmação de Saída */}
      <Portal>
        <Modal
          visible={modalSairVisivel}
          onDismiss={() => setModalSairVisivel(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Sair desta tela?</Text>
          <Text variant="bodyLarge" style={styles.modalText}>
            As credenciais informadas serão perdidas e você precisará digitá-las novamente.
          </Text>
          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setModalSairVisivel(false)}
              style={styles.modalBtn}
            >
              Continuar aqui
            </Button>
            <Button
              mode="contained"
              onPress={confirmarSaida}
              style={[styles.modalBtn, { backgroundColor: '#B00020' }]}
            >
              Sim, sair
            </Button>
          </View>
        </Modal>
      </Portal>

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
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  }
});
