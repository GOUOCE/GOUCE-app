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

export default function GestaoCadastrosScreen() {
  const router = useRouter();

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
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E2EC',
    marginLeft: 40,
  },
});