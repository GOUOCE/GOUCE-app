import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Solicitar Cadastro</Text>
      <Text style={styles.description}>
        Preencha seus dados para análise da coordenação.
      </Text>

      <TextInput style={styles.input} placeholder="Nome Completo" />
      <TextInput style={styles.input} placeholder="E-mail" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="WhatsApp" />
      <TextInput style={styles.input} placeholder="Bairro/Localidade" />
      <TextInput style={styles.input} placeholder="Instituição de Ensino" />
      <TextInput style={styles.input} placeholder="Curso" />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Enviar Solicitação</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.linkText}>Voltar para o Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#007AFF',
    textAlign: 'center',
    marginTop: 20,
  }
});
