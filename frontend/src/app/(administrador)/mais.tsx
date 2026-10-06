import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Surface, Divider } from 'react-native-paper';
import { LogOut, ChevronRight, UserCog, Shield } from 'lucide-react-native';

import { useAuth } from '@contexts/AuthContext';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function AdminMaisScreen() {
  const { user, signOut } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

  const getIniciais = (nome: string) => {
    if (!nome) return 'AD';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const handleSignOut = async () => {
    setModalSairVisivel(false);
    await signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Mais Opções</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Perfil do Administrador */}
        <Surface style={styles.profileCard} elevation={1}>
          <Avatar.Text
            size={64}
            label={getIniciais(user?.name || 'Administrador')}
            style={styles.avatar}
            labelStyle={styles.avatarLabel}
          />
          <View style={styles.userInfo}>
            <Text variant="titleMedium" style={styles.userName}>{user?.name || 'Administrador'}</Text>
            <Text variant="bodySmall" style={styles.userEmail}>{user?.email || 'admin@gouce.app'}</Text>
            <Surface style={styles.badge} elevation={0}>
              <Shield size={12} color="#0288D1" />
              <Text style={styles.badgeText}>Administrador</Text>
            </Surface>
          </View>
        </Surface>

        {/* Opções */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Conta</Text>

          <TouchableOpacity style={styles.actionItem} onPress={() => setModalSairVisivel(true)}>
            <LogOut size={24} color="#904a45" />
            <Text variant="bodyLarge" style={[styles.actionText, { color: '#904a45' }]}>Sair do aplicativo</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Sair do Aplicativo */}
      <AppPopup
        visible={modalSairVisivel}
        type="warning"
        title="Sair do aplicativo?"
        message="Você precisará fazer login novamente para acessar o painel administrativo."
        confirmText="Sim, sair"
        cancelText="Continuar no app"
        confirmColor="#904a45"
        onConfirm={handleSignOut}
        onDismiss={() => setModalSairVisivel(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    marginBottom: 32,
  },
  avatar: {
    backgroundColor: '#3E5F90',
  },
  avatarLabel: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    color: '#666',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    color: '#0288D1',
    fontWeight: '600',
    fontSize: 12,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  actionText: {
    flex: 1,
    fontWeight: '500',
  },
});
