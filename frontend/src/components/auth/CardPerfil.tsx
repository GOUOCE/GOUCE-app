import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';

interface CardPerfilProps {
  titulo: string;
  descricao: string;
  Icone: React.ElementType;
  onPress: () => void;
}

export function CardPerfil({ titulo, descricao, Icone, onPress }: CardPerfilProps) {
  const theme = useTheme();

  return (
    <Surface style={styles.card} elevation={1}>
      <TouchableOpacity onPress={onPress} style={styles.container}>
        <View style={[styles.iconBox, { backgroundColor: '#F0F4F8' }]}>
          <Icone size={32} color={theme.colors.primary} strokeWidth={1.5} />
        </View>

        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.titulo}>{titulo}</Text>
          <Text variant="bodySmall" style={styles.descricao}>{descricao}</Text>
        </View>

        <ChevronRight size={20} color="#666" />
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  titulo: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  descricao: {
    color: '#666',
    lineHeight: 16,
  }
});
