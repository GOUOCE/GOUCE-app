<<<<<<< Updated upstream
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { CalendarRange, ClipboardList, RefreshCw } from 'lucide-react-native';

import { ActionItem } from '@/components/dashboard/ActionItem';
import { AppPopup } from '@/components/ui/AppPopup';

export default function LogisticaScreen() {
  const [popup, setPopup] = useState<{
    visible: boolean;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAvisoProvisorio = (item: string) => {
    setPopup({
      visible: true,
      title: `${item}`,
      message: 'Esta funcionalidade de logística está em fase de homologação para as próximas sprints.',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Logística</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type="info"
        title={popup.title}
        message={popup.message}
        confirmText="Entendido"
        onConfirm={() => setPopup((prev) => ({ ...prev, visible: false }))}
        onDismiss={() => setPopup((prev) => ({ ...prev, visible: false }))}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seção Alocação e Embarque */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Alocação e Embarque</Text>

          <ActionItem
            title="Distribuição Logística"
            subtitle="Distribuição de alunos, ônibus e motoristas nas rotas"
            Icone={CalendarRange}
            onPress={() => showAvisoProvisorio('Distribuição Logística')}
          />
          <View style={styles.divider} />

          <ActionItem
            title="Lista de embarque"
            subtitle="Alunos alocados por ônibus para as rotas programadas para hoje"
            Icone={ClipboardList}
            onPress={() => showAvisoProvisorio('Lista de embarque')}
          />
        </View>

        {/* Seção Frota */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Frota</Text>

          <ActionItem
            title="Rodízio de frota"
            subtitle="Verificar e determinar a alocação dos ônibus entre os pontos de parada"
            Icone={RefreshCw}
            onPress={() => showAvisoProvisorio('Rodízio de frota')}
          />
        </View>
      </ScrollView>
    </View>
=======
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Calendar, ClipboardList, RefreshCw, ChevronRight } from 'lucide-react-native';

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

export default function LogisticaHubScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Título Principal */}
      <Text variant="headlineMedium" style={styles.pageTitle}>Logística</Text>

      {/* Seção Alocação e Embarque */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Alocação e Embarque</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={Calendar}
            title="Distribuição Logística"
            subtitle="Distribuição de alunos, ônibus e motoristas nas rotas"
            onPress={() => router.push('/(administrador)/logistica/distribuicao' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={ClipboardList}
            title="Lista de embarque"
            subtitle="Alunos alocados por ônibus para as rotas programadas para hoje"
            onPress={() => router.push('/(administrador)/logistica/embarque' as any)}
          />
        </View>
      </View>

      {/* Seção Frota */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Frota</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={RefreshCw}
            title="Rodízio de frota"
            subtitle="Verificar e determinar a alocação dos ônibus entre os pontos de parada"
            onPress={() => router.push('/(administrador)/logistica/rodizio' as any)}
          />
        </View>
      </View>
    </ScrollView>
>>>>>>> Stashed changes
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< Updated upstream
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
    fontWeight: 'bold',
    fontSize: 18,
=======
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
    marginBottom: 32,
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
  itemSubtitle: {
    fontSize: 13,
    color: '#74777F',
    marginTop: 2,
>>>>>>> Stashed changes
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E2EC',
<<<<<<< Updated upstream
    marginLeft: 72,
  },
});
=======
    marginLeft: 40,
  },
});
>>>>>>> Stashed changes
