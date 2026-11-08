import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { User, ShieldAlert, FileText, Bell, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

interface ItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  danger?: boolean;
  onPress?: () => void;
}

function SectionItem({ icon: Icon, title, subtitle, danger, onPress }: ItemProps) {
  return (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.iconBox}>
        <Icon size={24} color={danger ? '#BA1A1A' : '#191C20'} />
      </View>
      <View style={styles.textBox}>
        <Text variant="titleMedium" style={[styles.itemTitle, danger && styles.dangerText]}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.itemSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color={danger ? '#BA1A1A' : '#44474E'} />
    </TouchableOpacity>
  );
}

export default function MaisMenuScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

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

  const handleLogoutConfirmation = () => {
    setPopup({
      visible: true,
      type: 'warning',
      title: 'Sair da conta',
      message: 'Deseja realmente encerrar sua sessão no sistema?',
      confirmText: 'Sair',
      cancelText: 'Cancelar',
      confirmColor: '#BA1A1A',
      onConfirm: async () => {
        setPopup((prev) => ({ ...prev, visible: false }));
        await signOut();
      },
    });
  };

  const getInicial = (nome?: string) => {
    if (!nome) return 'A';
    return nome.charAt(0).toUpperCase();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        confirmColor={popup.confirmColor}
        onConfirm={popup.onConfirm}
        onDismiss={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />

      {/* Cabeçalho de Perfil */}
      <Text variant="headlineMedium" style={styles.pageTitle}>Mais</Text>

      <View style={styles.profileCard}>
        <Avatar.Text
          size={56}
          label={getInicial(user?.name)}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <View style={styles.profileInfo}>
          <Text variant="titleMedium" style={styles.profileName}>
            {user?.name || 'Administrador'}
          </Text>
          <Text variant="bodySmall" style={styles.profileEmail}>
            {user?.email || 'admin@sistema.com'}
          </Text>
        </View>
      </View>

      {/* Seção Conta e Preferências */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Conta e Configurações</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={User}
            title="Meu Perfil"
            subtitle="Alterar dados cadastrais e senha"
            onPress={() => router.push('/(administrador)/perfil' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={Bell}
            title="Notificações"
            subtitle="Gerenciar avisos e comunicados globais"
            onPress={() => router.push('/(administrador)/notificacoes' as any)}
          />
        </View>
      </View>

      {/* Seção Relatórios e Auditoria */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Relatórios & Sistema</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={FileText}
            title="Relatórios operacionais"
            subtitle="Exportar histórico de embarques e presença"
            onPress={() => router.push('/(administrador)/relatorios' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={ShieldAlert}
            title="Logs do sistema"
            subtitle="Histórico de ações e alterações de dados"
            onPress={() => router.push('/(administrador)/logs' as any)}
          />
        </View>
      </View>

      {/* Encerramento */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Sessão</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={LogOut}
            title="Sair do aplicativo"
            subtitle="Encerrar sua sessão com segurança"
            danger
            onPress={handleLogoutConfirmation}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontWeight: '400',
    color: '#191C20',
    fontSize: 28,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF0FF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 28,
  },
  avatar: {
    backgroundColor: '#3E5F90',
  },
  avatarLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#191C20',
  },
  profileEmail: {
    fontSize: 14,
    color: '#44474E',
    marginTop: 2,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    fontWeight: '600',
    color: '#191C20',
    fontSize: 16,
    marginBottom: 12,
  },
  cardGroup: {
    backgroundColor: '#F8F9FF',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconBox: {
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  textBox: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#191C20',
  },
  dangerText: {
    color: '#BA1A1A',
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#74777F',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E2EC',
    marginLeft: 40,
  },
});