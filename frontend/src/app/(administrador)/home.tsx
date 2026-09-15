import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Contact, UserCog, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

export default function AdminHomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Saudação */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, Clidenor!
        </Text>
      </View>

      {/* Resumo de Hoje */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Resumo de hoje</Text>
        <View style={styles.summaryGrid}>
          <Surface style={styles.summaryCard} elevation={1}>
            <Text variant="displaySmall" style={styles.summaryValue}>3</Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>Solicitações pendentes</Text>
          </Surface>

          <Surface style={styles.summaryCard} elevation={1}>
            <Text variant="displaySmall" style={styles.summaryValue}>42</Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>Alunos ativos</Text>
          </Surface>
        </View>
      </View>

      {/* Acesso Rápido */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Acesso Rápido</Text>

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionIconBox}>
            <Contact size={28} color="#000" strokeWidth={1.5} />
          </View>
          <View style={styles.actionContent}>
            <Text variant="bodyLarge" style={styles.actionTitle}>Fila de solicitações</Text>
            <Text variant="bodySmall" style={styles.actionSubtitle}>aprovar/reprovar cadastros</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
          <ChevronRight size={24} color="#999" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.actionItem}>
          <View style={styles.actionIconBox}>
            <UserCog size={28} color="#000" strokeWidth={1.5} />
          </View>
          <View style={styles.actionContent}>
            <Text variant="bodyLarge" style={styles.actionTitle}>Gestão de administradores</Text>
          </View>
          <ChevronRight size={24} color="#999" />
        </TouchableOpacity>
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
  summaryCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F1F3F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 4,
    fontSize: 32,
  },
  summaryLabel: {
    textAlign: 'center',
    color: '#43474E',
    lineHeight: 16,
    fontSize: 14,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: '500',
    color: '#191C20',
    fontSize: 16,
  },
  actionSubtitle: {
    color: '#43474E',
  },
  badge: {
    backgroundColor: '#904a45',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E2EC',
    marginLeft: 72,
  }
});
