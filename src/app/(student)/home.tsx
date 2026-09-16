import { View, Text, StyleSheet } from 'react-native';

export default function StudentHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard do Aluno</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sua Alocação Hoje</Text>
        <Text style={styles.cardContent}>Ônibus: 01 - Placa: ABC-1234</Text>
        <Text style={styles.cardContent}>Motorista: João Silva</Text>
        <Text style={styles.cardContent}>Horário: 06:30h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#007AFF',
  },
  cardContent: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  }
});
