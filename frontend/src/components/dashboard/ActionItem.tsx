import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ChevronRight } from 'lucide-react-native';

interface ActionItemProps {
  title: string;
  subtitle?: string;
  Icone: any;
  badgeCount?: number;
  onPress?: () => void;
}

export function ActionItem({ title, subtitle, Icone, badgeCount, onPress }: ActionItemProps) {
  return (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.actionIconBox}>
        <Icone size={28} color="#000" strokeWidth={1.5} />
      </View>
      <View style={styles.actionContent}>
        <Text variant="bodyLarge" style={styles.actionTitle}>{title}</Text>
        {subtitle && <Text variant="bodySmall" style={styles.actionSubtitle}>{subtitle}</Text>}
      </View>
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badgeCount}</Text>
        </View>
      )}
      <ChevronRight size={24} color="#999" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionIconBox: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontWeight: '500',
    color: '#191C20',
    fontSize: 16,
  },
  actionSubtitle: {
    color: '#43474E',
  },
  badge: {
    backgroundColor: '#904a45',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  }
});
