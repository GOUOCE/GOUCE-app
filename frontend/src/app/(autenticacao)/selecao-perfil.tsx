import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Text, useTheme, Button, Portal } from 'react-native-paper';
import { ChevronLeft, UserCircle, Users, ShieldCheck } from 'lucide-react-native';

import { CardPerfil } from '@/components/auth/CardPerfil';
import { useAuth } from '@contexts/AuthContext';

export default function SelecaoPerfilScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { email } = useLocalSearchParams();
  const { signIn } = useAuth();
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
    console.log('Finalizando login para:', email, 'como', perfil);
    await signIn(email as string, perfil);
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
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalSairVisivel(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
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
            </View>
          </View>
        </Modal>
      </Portal>

      <Text variant="headlineMedium" style={styles.title}>Como você quer entrar?</Text>

      <View style={styles.cardList}>
        <CardPerfil
          titulo="Sou aluno"
          descricao="Agendamento, mural e carteirinha digital"
          Icone={UserCircle}
          onPress={() => handleSelectProfile('ALUNO')}
        />

        <CardPerfil
          titulo="Sou representante"
          descricao="Chamada e lista de embarque da sua universidade"
          Icone={Users}
          onPress={() => handleSelectProfile('MOTORISTA')}
        />

        <CardPerfil
          titulo="Sou administrador"
          descricao="Gestão completa do transporte"
          Icone={ShieldCheck}
          onPress={() => handleSelectProfile('ADMINISTRADOR')}
        />
      </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
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
