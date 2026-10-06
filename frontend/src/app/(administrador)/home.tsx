import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Contact, UserCog } from 'lucide-react-native';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { ActionItem } from '@/components/dashboard/ActionItem';
import { useRouter } from 'expo-router';

export default function AdminHomeScreen() {
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Saudação */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, Administrador!
        </Text>
      </View>

      {/* Resumo de Hoje */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Resumo de hoje</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard value={3} label="Solicitações pendentes" />
          <SummaryCard value={42} label="Alunos ativos" />
        </View>
      </View>

      {/* Acesso Rápido */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Acesso Rápido</Text>

        <ActionItem
          title="Fila de solicitações"
          subtitle="aprovar/reprovar cadastros"
          Icone={Contact}
          badgeCount={3}
        />

        <View style={styles.divider} />

        <ActionItem
          title="Gestão de administradores"
          Icone={UserCog}
          onPress={() => router.push('/(administrador)/administradores')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  greeting: {
    fontWeight: '400',
    color: '#333',
    fontSize: 32,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#191C20',
    fontWeight: 'bold',
    fontSize: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E2EC',
    marginLeft: 72,
  }
});
