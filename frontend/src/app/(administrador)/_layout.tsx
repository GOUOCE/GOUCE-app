import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LayoutGrid, Archive, Bus, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

// Únicas abas exibidas na barra (na ordem do protótipo).
// Qualquer outra rota dentro de (administrador) continua navegável, mas NUNCA vira botão.
const ABAS = [
  { name: 'home', title: 'Painel', Icon: LayoutGrid },
  { name: 'cadastros', title: 'Cadastros', Icon: Archive },
  { name: 'logistica', title: 'Logística', Icon: Bus },
  { name: 'mais', title: 'Mais', Icon: MoreHorizontal },
] as const;

function AdminTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedKey = state.routes[state.index]?.key;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {ABAS.map(({ name, title, Icon }) => {
        const route = state.routes.find((r) => r.name === name);
        if (!route) return null;

        const focused = route.key === focusedKey;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        return (
          <TouchableOpacity
            key={name}
            style={styles.item}
            activeOpacity={0.7}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={title}
          >
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Icon size={24} color={focused ? '#191C20' : '#44474E'} />
            </View>
            <Text style={[styles.label, focused && styles.labelActive]}>{title}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Proteção de acesso no nível do Layout
  if (!user || user.role !== 'ADMINISTRADOR') {
    return <Redirect href="/acesso-negado" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AdminTabBar {...props} />}
    >
      {ABAS.map(({ name, title }) => (
        <Tabs.Screen key={name} name={name} options={{ title }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  // Protótipo: barra de 80px, pílula 64x32 no topo (12px), rótulo 12px logo abaixo
  bar: {
    flexDirection: 'row',
    paddingTop: 12,
    backgroundColor: '#ECEDF4',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  iconPill: {
    width: 64,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPillActive: {
    backgroundColor: '#C2E7FF',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: '#44474E',
  },
  labelActive: {
    fontWeight: '700',
    color: '#191C20',
  },
});
