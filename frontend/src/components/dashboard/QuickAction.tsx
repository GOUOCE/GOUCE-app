import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';

interface QuickActionProps {
  title: string;
  Icone: any;
  onPress?: () => void;
  width?: string | number;
}

export function QuickAction({ title, Icone, onPress, width = '48%' }: QuickActionProps) {
  return (
    <Surface style={[styles.actionCard, { width }]} elevation={0}>
      <TouchableOpacity style={styles.actionButton} onPress={onPress}>
        <Icone size={36} color="#333" strokeWidth={1.2} />
        <Text variant="bodySmall" style={styles.actionLabel}>{title}</Text>
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    height: 120,
    borderRadius: 16,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#E0E2EC',
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  actionLabel: {
    textAlign: 'center',
    color: '#191C20',
    fontWeight: '500',
    fontSize: 14,
  }
});
