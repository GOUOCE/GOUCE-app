import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme, Button } from 'react-native-paper';
import { CalendarPlus, ClipboardList, Megaphone, Contact } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

interface QuickActionProps {
  title: string;
  Icone: any;
  onPress?: () => void;
}

function QuickAction({ title, Icone, onPress }: QuickActionProps) {
  return (
    <Surface style={styles.actionCard} elevation={0}>
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <Icone size={36} color="#333" strokeWidth={1.2} />
        <Text variant="bodySmall" style={styles.actionLabel}>{title}</Text>
      </TouchableOpacity>
    </Surface>
  );
}

export default function StudentHomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Saudação */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, João!
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
  },
  actionCard: {
    width: '48%',
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#E0E2EC',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    textAlign: 'center',
    color: '#191C20',
    fontWeight: '500',
    fontSize: 14,
  }
});
