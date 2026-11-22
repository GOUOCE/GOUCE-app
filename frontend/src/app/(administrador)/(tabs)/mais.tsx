import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { BarChart2, Megaphone, LogOut, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

interface ItemProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

function SectionItem({ icon: Icon, title, subtitle, onPress }: ItemProps) {
  return (
    <TouchableOpacity style={styles.itemContainer} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.iconBox}>
        <Icon size={24} color="#191C20" />
      </View>
      <View style={styles.textBox}>
        <Text variant="titleMedium" style={styles.itemTitle}>{title}</Text>
        <Text variant="bodySmall" style={styles.itemSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={18} color="#44474E" />
    </TouchableOpacity>
  );
}

export default function MaisMenuScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

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
      title: 'Sair da conta?',
      message: 'Você precisará fazer login novamente para realizar ações administrativas.',
      confirmText: 'Sair',
      cancelText: 'Continuar',
      confirmColor: '#BA1A1A',
      onConfirm: async () => {
        setPopup((prev) => ({ ...prev, visible: false }));
        await signOut();
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título Principal */}
        <Text variant="headlineMedium" style={styles.pageTitle}>Mais Opções</Text>

        {/* Seção Acompanhamento */}
        <View style={styles.section}>
          <Text variant="titleSmall" style={styles.sectionHeader}>Acompanhamento</Text>
          <View style={styles.cardGroup}>
            <SectionItem
              icon={BarChart2}
              title="Relatórios quantitativos"
              subtitle="Métricas de lotação, frota e motoristas"
              onPress={() => router.push('/(administrador)/relatorios' as any)}
            />
            <View style={styles.divider} />
            <SectionItem
              icon={Megaphone}
              title="Gerenciar avisos"
              subtitle="Comunicados, alertas e mensagens para os alunos"
              onPress={() => router.push('/(administrador)/solicitacoes' as any)}
            />
          </View>
        </View>

        {/* Botão de Encerramento da Conta */}
        <View style={styles.logoutContainer}>
          <Button
            mode="outlined"
            onPress={handleLogoutConfirmation}
            style={styles.btnLogout}
            contentStyle={styles.btnContent}
            textColor="#BA1A1A"
            icon={() => <LogOut size={20} color="#BA1A1A" />}
          >
            Sair da conta
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontWeight: 'normal',
    color: '#191C20',
    fontSize: 28,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    fontWeight: 'bold',
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
  logoutContainer: {
    marginTop: 40,
  },
  btnLogout: {
    borderRadius: 24,
    borderColor: '#BA1A1A',
    borderWidth: 1,
  },
  btnContent: {
    height: 52,
    flexDirection: 'row',
    gap: 8,
  },
});
