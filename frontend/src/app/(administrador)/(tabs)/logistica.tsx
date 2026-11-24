import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Calendar, ClipboardList, ChevronRight, RefreshCcw } from 'lucide-react-native';

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
          <View style={styles.divider} />
          <SectionItem
            icon={RefreshCcw}
            title="Rodízio de Frota"
            subtitle="Rodízio semanal dos ônibus entre as rotas ativas"
            onPress={() => router.push('/(administrador)/logistica/rodizio' as any)}
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