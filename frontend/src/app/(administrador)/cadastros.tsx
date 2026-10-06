import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MapPin, Building2, Bus, IdCard, Contact, Route, GitFork } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { ActionItem } from '@/components/dashboard/ActionItem';
import { AppPopup } from '@/components/ui/AppPopup';

export default function GestaoCadastrosScreen() {
  const router = useRouter();

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
      message: 'Esta funcionalidade de gestão está em fase de homologação para as próximas sprints.',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Gestão de Cadastros</Text>
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
        {/* Seção Infraestrutura */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Infraestrutura</Text>

          <ActionItem
            title="Bairros e pontos de parada"
            subtitle="Locais de embarque"
            Icone={MapPin}
            onPress={() => showAvisoProvisorio('Bairros e pontos de parada')}
          />
          <View style={styles.divider} />

          <ActionItem
            title="Faculdades"
            subtitle="Instituições de destino"
            Icone={Building2}
            onPress={() => showAvisoProvisorio('Faculdades')}
          />
          <View style={styles.divider} />

          <ActionItem
            title="Frota"
            subtitle="Veículos e limites de lotação"
            Icone={Bus}
            onPress={() => showAvisoProvisorio('Frota')}
          />
          <View style={styles.divider} />

          <ActionItem
            title="Motoristas"
            subtitle="Condutores autorizados"
            Icone={IdCard}
            onPress={() => showAvisoProvisorio('Motoristas')}
          />
          <View style={styles.divider} />

          <ActionItem
            title="Representantes"
            subtitle="Alunos representantes de faculdades"
            Icone={Contact}
            onPress={() => showAvisoProvisorio('Representantes')}
          />
        </View>

        {/* Seção Trajetos */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Trajetos</Text>

          <ActionItem
            title="Rotas principais"
            subtitle="Trajetos oficiais"
            Icone={Route}
            onPress={() => showAvisoProvisorio('Rotas principais')}
          />
          <View style={styles.divider} />

          <ActionItem
            title="Rotas complementares"
            subtitle="Trajetos de transferência"
            Icone={GitFork}
            onPress={() => showAvisoProvisorio('Rotas complementares')}
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
