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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E2EC',
    marginLeft: 72,
  },
});
