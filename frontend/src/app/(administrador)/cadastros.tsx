<<<<<<< Updated upstream
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MapPin, Building2, Bus, IdCard, Contact, Route, GitFork } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { ActionItem } from '@/components/dashboard/ActionItem';
import { AppPopup } from '@/components/ui/AppPopup';
=======
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MapPin, Building2, Bus, Contact, UserCheck, GitCommit, GitFork, ChevronRight } from 'lucide-react-native';

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
>>>>>>> Stashed changes

export default function GestaoCadastrosScreen() {
  const router = useRouter();

<<<<<<< Updated upstream
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
=======
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Título Principal */}
      <Text variant="headlineMedium" style={styles.pageTitle}>Gestão de Cadastros</Text>

      {/* Seção Infraestrutura */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Infraestrutura</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={MapPin}
            title="Bairros e pontos de parada"
            subtitle="Locais de embarque"
            onPress={() => router.push('/(administrador)/cadastros/pontos' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={Building2}
            title="Faculdades"
            subtitle="Instituições de destino"
            onPress={() => router.push('/(administrador)/cadastros/faculdades' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={Bus}
            title="Frota"
            subtitle="Veículos e limites de lotação"
            onPress={() => router.push('/(administrador)/cadastros/frota' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={Contact}
            title="Motoristas"
            subtitle="Condutores autorizados"
            onPress={() => router.push('/(administrador)/cadastros/motoristas' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={UserCheck}
            title="Representantes"
            subtitle="Alunos representantes de faculdades"
            onPress={() => router.push('/(administrador)/cadastros/representantes' as any)}
          />
        </View>
      </View>

      {/* Seção Trajetos */}
      <View style={styles.section}>
        <Text variant="titleSmall" style={styles.sectionHeader}>Trajetos</Text>
        <View style={styles.cardGroup}>
          <SectionItem
            icon={GitCommit}
            title="Rotas principais"
            subtitle="Trajetos oficiais"
            onPress={() => router.push('/(administrador)/cadastros/rotas-principais' as any)}
          />
          <View style={styles.divider} />
          <SectionItem
            icon={GitFork}
            title="Rotas complementares"
            subtitle="Trajetos de transferência"
            onPress={() => router.push('/(administrador)/cadastros/rotas-complementares' as any)}
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
