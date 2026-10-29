import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { ClipboardCheck, Clock } from 'lucide-react-native';

interface TelaSucessoProps {
  onVoltarLogin: () => void;
}

export function TelaSucesso({ onVoltarLogin }: TelaSucessoProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <View style={styles.wrapper}>
          <ClipboardCheck size={120} color="#006677" strokeWidth={1.5} />
          <View style={styles.clockBadge}>
             <Clock size={48} color="#006677" strokeWidth={3} fill="#fff" />
          </View>
        </View>
      </View>

      <Text variant="headlineSmall" style={styles.title}>
        Cadastro enviado para análise
      </Text>

      <Text variant="bodyLarge" style={styles.description}>
        Sua solicitação será avaliada pela coordenação. Você será notificado quando houver uma resposta.
      </Text>

      <Button
        mode="contained"
        onPress={onVoltarLogin}
        style={styles.button}
        contentStyle={styles.buttonContent}
      >
        Ir para o login
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  wrapper: {
    position: 'relative',
  },
  clockBadge: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 30,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  description: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    marginTop: 16,
    borderRadius: 8,
  },
  buttonContent: {
    height: 55,
  },
});
