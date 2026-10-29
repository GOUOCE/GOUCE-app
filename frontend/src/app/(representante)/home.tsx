import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, useTheme, Avatar, List, Checkbox } from 'react-native-paper';
import { useAuth } from '@contexts/AuthContext';

export default function RepresentativeHomeScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  const passageirosMock = [
    { id: '1', nome: 'João Silva', embarcou: true, local: 'Bairro Novo' },
    { id: '2', nome: 'Maria Oliveira', embarcou: false, local: 'Centro' },
    { id: '3', nome: 'Pedro Santos', embarcou: false, local: 'Serra' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>Lista de Embarque</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Ônibus 04 | Rota: Quixadá</Text>
      </View>

      <Surface style={styles.statsCard} elevation={1}>
        <View style={styles.statItem}>
          <Text variant="displaySmall" style={styles.statValue}>1/3</Text>
          <Text variant="bodySmall">Embarcados</Text>
        </View>
      </Surface>

      <ScrollView style={styles.listContainer}>
        {passageirosMock.map((p) => (
          <List.Item
            key={p.id}
            title={p.nome}
            description={`Embarque: ${p.local}`}
            left={props => <Avatar.Text {...props} size={40} label={p.nome.substring(0,2)} />}
            right={props => <Checkbox status={p.embarcou ? 'checked' : 'unchecked'} color={theme.colors.primary} />}
            style={styles.listItem}
          />
        ))}
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
  title: {
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    color: '#666',
  },
  statsCard: {
    marginHorizontal: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    color: '#3e5f90',
  },
  listContainer: {
    flex: 1,
  },
  listItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  }
});
