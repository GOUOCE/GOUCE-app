import React from 'react';
import { TouchableOpacity, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';

interface CardPerfilProps {
  titulo: string;
  descricao: string;
  Icone: React.ElementType;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function CardPerfil({ titulo, descricao, Icone, onPress, disabled, loading }: CardPerfilProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[styles.card, disabled && styles.disabled]}
    >
      <View style={styles.iconBox}>
        <Icone size={32} color="#44474E" strokeWidth={1.75} />
      </View>

      <View style={styles.content}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descricao}>{descricao}</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#44474E" />
      ) : (
        <View style={styles.arrow} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C4C6D0',
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.6,
  },
  iconBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  titulo: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '500',
    color: '#191C20',
    marginBottom: 2,
  },
  descricao: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    color: '#44474E',
  },
  // Seta triangular preenchida (▸) como no protótipo
  arrow: {
    width: 0,
    height: 0,
    borderTopWidth: 4,
    borderBottomWidth: 4,
    borderLeftWidth: 5,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#44474E',
  },
});
