import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Text, useTheme } from 'react-native-paper';
import { GouoceLogo, PrefeituraLogo } from '@/components/ui/Logos';

export default function WelcomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      {/* Container do Logo Superior (GOUOCE) */}
      <View style={styles.logoWrapper}>
        <GouoceLogo width={220} height={180} />
      </View>

      {/* Container de Conteúdo Inferior (Botões + Prefeitura) */}
      <View style={styles.bottomSection}>
        <View style={styles.buttonGroup}>
          <Button
            mode="contained"
            onPress={() => router.push('/(autenticacao)/login')}
            style={styles.mainButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Entrar
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/(autenticacao)/register')}
            style={[styles.mainButton, styles.outlineButton]}
            contentStyle={styles.buttonContent}
            labelStyle={[styles.buttonLabel, { color: theme.colors.primary }]}
          >
            Criar conta de aluno
          </Button>
        </View>

        <View style={styles.footer}>
           <PrefeituraLogo width={130} height={60} />
           <Text variant="labelSmall" style={styles.versionText}>Versão 1.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoWrapper: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    flex: 2,
    justifyContent: 'flex-end',
    paddingBottom: 20,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  mainButton: {
    borderRadius: 12,
  },
  outlineButton: {
    borderColor: '#3e5f90',
    borderWidth: 1.5,
  },
  buttonContent: {
    height: 56,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    gap: 4,
  },
  versionText: {
    color: '#999',
    fontSize: 12,
  }
});
