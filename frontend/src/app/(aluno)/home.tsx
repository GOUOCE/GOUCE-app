import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Button } from 'react-native-paper';
import { CalendarPlus, ClipboardList, Megaphone, Contact } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';
import { QuickAction } from '@/components/dashboard/QuickAction';

export default function StudentHomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Saudação */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, {user?.name?.split(' ')[0] || 'Aluno'}!
        </Text>
      </View>

      {/* Sua viagem hoje */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Sua viagem hoje</Text>
        <Surface style={styles.tripCard} elevation={1}>
          <View style={styles.tripInfo}>
            <Text variant="titleMedium" style={styles.busName}>Ônibus 04 - Placa OCR-1234</Text>
            <Text variant="bodyMedium" style={styles.routeDetails}>Rota Centro → UFC | Saída 06:40</Text>
          </View>
          <Button
            mode="contained"
            onPress={() => {}}
            style={styles.detailsBtn}
            buttonColor="#3e5f90"
          >
            Ver detalhes
          </Button>
        </Surface>
      </View>

      {/* Acesso Rápido */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Acesso Rápido</Text>
        <View style={styles.actionGrid}>
          <QuickAction title="Agendar Transporte" Icone={CalendarPlus} />
          <QuickAction title="Meus Agendamentos" Icone={ClipboardList} />
          <QuickAction title="Mural de Avisos" Icone={Megaphone} />
          <QuickAction title="Carteirinha Digital" Icone={Contact} />
        </View>
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
    color: '#333',
    fontWeight: '600',
    fontSize: 18,
  },
  tripCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F1F3F9',
    gap: 12,
  },
  tripInfo: {
    gap: 4,
  },
  busName: {
    fontWeight: 'bold',
    color: '#191C20',
  },
  routeDetails: {
    color: '#43474E',
  },
  detailsBtn: {
    alignSelf: 'flex-end',
    borderRadius: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  }
});
