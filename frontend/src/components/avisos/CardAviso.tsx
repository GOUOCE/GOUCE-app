import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronDown, ChevronLeft } from 'lucide-react-native';

import { AvisoItem } from '@/services/avisoService';
import { formatarDataPublicacaoAviso } from '@/utils/formatarData';

interface CardAvisoProps {
  aviso: AvisoItem;
  inicialmenteExpandido?: boolean;
}

export function CardAviso({
  aviso,
  inicialmenteExpandido = false,
}: CardAvisoProps) {
  const [expandido, setExpandido] = useState(inicialmenteExpandido);

  const alternarExpansao = () => {
    setExpandido((prev) => !prev);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={alternarExpansao}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleBox}>
          <Text
            variant="titleMedium"
            style={styles.titulo}
            numberOfLines={expandido ? undefined : 1}
          >
            {aviso.titulo}
          </Text>
          <Text variant="bodySmall" style={styles.dataPublicacao}>
            {formatarDataPublicacaoAviso(aviso.data_criacao)}
          </Text>
        </View>

        <View style={styles.chevronBadge}>
          {expandido ? (
            <ChevronDown size={18} color="#191C20" />
          ) : (
            <ChevronLeft size={18} color="#191C20" />
          )}
        </View>
      </View>

      <Text
        variant="bodyMedium"
        style={styles.descricao}
        numberOfLines={expandido ? undefined : 2}
      >
        {aviso.descricao}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F2F4FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C4C6D0',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleBox: {
    flex: 1,
    marginRight: 12,
  },
  titulo: {
    fontWeight: '600',
    color: '#191C20',
    fontSize: 17,
    lineHeight: 22,
  },
  dataPublicacao: {
    color: '#44474E',
    fontSize: 12,
    marginTop: 4,
  },
  chevronBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E6E8EF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descricao: {
    color: '#191C20',
    fontSize: 14,
    lineHeight: 20,
  },
});
