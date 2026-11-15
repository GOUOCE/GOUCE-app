import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { Contact, UserCog } from 'lucide-react-native';
import { SummaryCard } from '@/components/dashboard/SummaryCard';
import { ActionItem } from '@/components/dashboard/ActionItem';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '@contexts/AuthContext';
import { api } from '@/api/api';

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [qtdPendentes, setQtdPendentes] = useState<number>(0);
  const [qtdAtivos, setQtdAtivos] = useState<number>(0);

  // Recarrega o resumo dinâmico do banco de dados sempre que o painel ganha foco
  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      async function carregarResumoReal() {
        try {
          const [resPendentes, resRenovacoes, resAtivos] = await Promise.all([
            api.get<any[]>('/usuarios/alunos', { params: { status: 'pendente' } }),
            api.get<any[]>('/usuarios/alunos', { params: { status: 'analise_renovacao' } }),
            api.get<any[]>('/usuarios/alunos', { params: { status: 'ativado' } }),
          ]);
          if (isMounted) {
            const totalPendentes = (resPendentes.data?.length || 0) + (resRenovacoes.data?.length || 0);
            setQtdPendentes(totalPendentes);
            setQtdAtivos(resAtivos.data?.length || 0);
          }
        } catch (err) {
          console.warn('Erro ao carregar resumo do painel:', err);
        }
      }
      carregarResumoReal();
      return () => { isMounted = false; };
    }, [])
  );

  const primeiroNome = user?.name ? user.name.split(' ')[0] : 'Administrador';

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Saudação */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, {primeiroNome}!
        </Text>
      </View>

      {/* Resumo de Hoje */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Resumo de hoje</Text>
        <View style={styles.summaryGrid}>
          <SummaryCard value={qtdPendentes} label="Solicitações pendentes" />
          <SummaryCard value={qtdAtivos} label="Alunos ativos" />
        </View>
      </View>

      {/* Acesso Rápido */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Acesso Rápido</Text>

        <ActionItem
          title="Fila de solicitações"
          subtitle="aprovar/reprovar cadastros"
          Icone={Contact}
          badgeCount={qtdPendentes > 0 ? qtdPendentes : undefined}
          onPress={() => router.push('/(administrador)/solicitacoes')}
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
