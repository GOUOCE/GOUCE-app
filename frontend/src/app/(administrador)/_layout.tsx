import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { LayoutGrid, Archive, Bus, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

const TABS_EXIBIDAS = ['home', 'cadastros', 'logistica', 'mais'];

function AdminTabBar({ state, navigation, descriptors }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        if (!TABS_EXIBIDAS.includes(route.name)) {
          return null;
        }

        const isFocused = state.index === index;
        const { options } = descriptors[route.key] || {};
        const label = options?.title || route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const renderIcon = () => {
          if (route.name === 'home') return <LayoutGrid size={22} color={isFocused ? '#191C20' : '#44474E'} />;
          if (route.name === 'cadastros') return <Archive size={22} color={isFocused ? '#191C20' : '#44474E'} />;
          if (route.name === 'logistica') return <Bus size={22} color={isFocused ? '#191C20' : '#44474E'} />;
          if (route.name === 'mais') return <MoreHorizontal size={22} color={isFocused ? '#191C20' : '#44474E'} />;
          return null;
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
              {renderIcon()}
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.activeTabLabel]}>
              {label}
            </Text>
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

  // Proteção síncrona no nível do Layout
  if (!user || user.role !== 'ADMINISTRADOR') {
    return <Redirect href="/acesso-negado" />;
  }

  return (
    <Tabs
      tabBar={(props) => <AdminTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Painel' }} />
      <Tabs.Screen name="cadastros" options={{ title: 'Cadastros' }} />
      <Tabs.Screen name="logistica" options={{ title: 'Logística' }} />
      <Tabs.Screen name="mais" options={{ title: 'Mais' }} />
      <Tabs.Screen name="administradores" options={{ href: null }} />
      <Tabs.Screen name="solicitacoes" options={{ href: null }} />
      <Tabs.Screen name="cadastrar-administrador" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 80,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#F8F9FF',
    borderTopWidth: 1,
    borderTopColor: '#E0E2EC',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconContainer: {
    backgroundColor: '#C2E7FF',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#44474E',
  },
  activeTabLabel: {
    fontWeight: '700',
    color: '#191C20',
  },
});
