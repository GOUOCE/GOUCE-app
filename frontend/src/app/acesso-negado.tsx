import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ShieldAlert } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

export default function AcessoNegadoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const handleVoltar = () => {
    if (!user) {
      router.replace('/(autenticacao)/login');
      return;
    }

    // Redireciona para a home correta baseada no perfil
    const home = user.role === 'ADMINISTRADOR'
      ? '/(administrador)/home'
      : user.role === 'MOTORISTA'
        ? '/(representante)/home'
        : '/(aluno)/home';

    router.replace(home);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#F9EBEB' }]}>
          <ShieldAlert size={100} color="#904a45" strokeWidth={1.5} />
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          Acesso Negado
        </Text>

        <Text variant="bodyLarge" style={styles.message}>
          Você não tem permissão para acessar esta área.
        </Text>

        <Text variant="bodySmall" style={styles.errorCode}>
          Erro 403 - Forbidden
        </Text>

        <Button
          mode="contained"
          onPress={handleVoltar}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Voltar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  message: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  errorCode: {
    color: '#999',
    marginBottom: 48,
  },
  button: {
    width: '100%',
    borderRadius: 8,
  },
  buttonContent: {
    height: 55,
  },
});
