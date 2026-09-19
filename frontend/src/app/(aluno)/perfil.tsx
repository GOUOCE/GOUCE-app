import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Surface, useTheme, Portal, Modal, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LogOut, UserCircle, CreditCard, RefreshCw, ChevronRight, Pencil } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

export default function PerfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

  const handleSignOut = async () => {
    setModalSairVisivel(false);
    await signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setModalSairVisivel(true)}>
          <LogOut size={20} color="#904a45" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Foto e Nome */}
        <View style={styles.profileSection}>
          <Avatar.Image
            size={120}
            source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop' }}
          />
          <Text variant="headlineSmall" style={styles.userName}>{user?.name}</Text>
          <Surface style={styles.statusBadge} elevation={0}>
            <Text style={styles.statusText}>{user?.status || 'Aprovado'}</Text>
          </Surface>
        </View>

        {/* Informações Gerais */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Informações Gerais</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>E-mail</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Telefone (WhatsApp)</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.telefone || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Instituição - Campus</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.faculdade || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Curso</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.curso || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Período de Ingresso</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.periodo_ingresso || 'Não informado'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Turno</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.turno || 'Não informado'}</Text>
            </View>
          </View>
        </View>

        {/* Ações da Conta */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Ações da Conta</Text>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/editar-perfil')}>
            <Pencil size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Editar perfil</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/carteirinha-digital')}>
            <CreditCard size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Ver carteirinha digital</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/renovar-vinculo')}>
            <RefreshCw size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Renovar vínculo institucional</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Sair */}
      <Portal>
        <Modal
          visible={modalSairVisivel}
          onDismiss={() => setModalSairVisivel(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text variant="headlineSmall" style={styles.modalTitle}>Sair do aplicativo?</Text>
          <Text variant="bodyLarge" style={styles.modalText}>
            Você precisará fazer login novamente para agendar transportes.
          </Text>
          <View style={styles.modalButtons}>
            <Button mode="text" onPress={() => setModalSairVisivel(false)}>Continuar</Button>
            <Button mode="text" onPress={handleSignOut} labelStyle={{ color: '#904a45' }}>Sair</Button>
          </View>
        </Modal>
      </Portal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#904a45',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  userName: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: '#E1F5FE',
  },
  statusText: {
    color: '#0288D1',
    fontWeight: '600',
    fontSize: 14,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 20,
  },
  infoLabel: {
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    color: '#333',
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  actionText: {
    flex: 1,
    color: '#333',
  },
  divider: {
    backgroundColor: '#E0E2EC',
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 16,
  }
});
