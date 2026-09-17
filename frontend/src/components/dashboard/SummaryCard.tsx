import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Surface } from 'react-native-paper';

interface SummaryCardProps {
  value: string | number;
  label: string;
}

export function SummaryCard({ value, label }: SummaryCardProps) {
  return (
    <Surface style={styles.summaryCard} elevation={1}>
      <Text variant="displaySmall" style={styles.summaryValue}>{value}</Text>
      <Text variant="bodySmall" style={styles.summaryLabel}>{label}</Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    flex: 1,
    padding: 24,
    borderRadius: 16,
    backgroundColor: '#F1F3F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 4,
    fontSize: 32,
  },
  summaryLabel: {
    textAlign: 'center',
    color: '#43474E',
    lineHeight: 16,
    fontSize: 14,
  }
});
