import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutDashboard, Archive, Bus, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Proteção síncrona no nível do Layout: bloqueia renderização de telas não autorizadas
  if (!user || user.role !== 'ADMINISTRADOR') {
    return <Redirect href="/acesso-negado" />;
  }

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#000',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        height: 80,
        paddingBottom: 12,
        backgroundColor: '#F8F9FF',
        borderTopWidth: 1,
        borderTopColor: '#E0E2EC',
      }
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Painel',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <LayoutDashboard size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cadastros"
        options={{
          title: 'Cadastros',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Archive size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="logistica"
        options={{
          title: 'Logística',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Bus size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: 'Mais',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MoreHorizontal size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="administradores"
        options={{
          href: null,
        }}
      />
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
