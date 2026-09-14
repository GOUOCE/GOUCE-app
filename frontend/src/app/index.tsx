import React from 'react';
import { StyleSheet, View, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.centerContent}>
        {/* Logo principal GOUOCE */}
        <Image
          source={require('../../assets/logo-gouoce.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push('/(auth)/login')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Entrar
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push('/(auth)/register')}
          style={[styles.button, styles.outlineButton]}
          contentStyle={styles.buttonContent}
          labelStyle={{ color: theme.colors.primary }}
        >
          Criar conta de aluno
        </Button>
      </View>

      <View style={styles.footer}>
         {/* Logo da Prefeitura */}
         <Image
            source={require('../../assets/logo-prefeitura.png')}
            style={styles.prefeituraLogo}
            resizeMode="contain"
         />
         <Text variant="labelSmall" style={styles.version}>Versão 1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  logo: {
    width: 280,
    height: 150,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 80,
  },
  button: {
    borderRadius: 8,
  },
  outlineButton: {
    borderColor: '#3e5f90', // Cor Primária
    borderWidth: 1.5,
  },
  buttonContent: {
    height: 55,
  },
  footer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 30,
  },
  prefeituraLogo: {
    width: 150,
    height: 50,
  },
  version: {
    color: '#999',
  }
});
