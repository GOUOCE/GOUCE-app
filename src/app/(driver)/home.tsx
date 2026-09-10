import { View, Text, StyleSheet } from 'react-native';

export default function DriverHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard do Motorista</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sua Rota de Hoje</Text>
        <Text style={styles.cardContent}>Veículo: Ônibus 01</Text>
        <Text style={styles.cardContent}>Rota: Ocara -> Quixadá</Text>
        <Text style={styles.cardContent}>Alunos Agendados: 42</Text>
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
    borderLeftWidth: 5,
    borderLeftColor: '#34C759',
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
    color: '#34C759',
  },
  cardContent: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  }
});
