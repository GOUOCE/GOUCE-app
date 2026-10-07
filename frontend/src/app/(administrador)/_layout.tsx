import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutGrid, Archive, Bus, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';

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
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#191C20',
        tabBarInactiveTintColor: '#44474E',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarStyle: {
          height: 80,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: '#F8F9FF',
          borderTopWidth: 1,
          borderTopColor: '#E0E2EC',
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Painel',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <LayoutGrid size={22} color={focused ? '#191C20' : '#44474E'} />
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
              <Archive size={22} color={focused ? '#191C20' : '#44474E'} />
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
              <Bus size={22} color={focused ? '#191C20' : '#44474E'} />
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
              <MoreHorizontal size={22} color={focused ? '#191C20' : '#44474E'} />
            </View>
          ),
        }}
      />

      {/* Oculta explicitamente a pasta de administradores */}
      <Tabs.Screen name="administradores" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
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
});
