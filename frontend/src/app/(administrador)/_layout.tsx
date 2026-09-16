import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { LayoutDashboard, Archive, Bus, MoreHorizontal } from 'lucide-react-native';

export default function AdminLayout() {
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
          tabBarButton: (props) => (
            <View {...props} pointerEvents="none">
              {props.children}
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
          tabBarButton: (props) => (
            <View {...props} pointerEvents="none">
              {props.children}
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
          tabBarButton: (props) => (
            <View {...props} pointerEvents="none">
              {props.children}
            </View>
          ),
        }}
      />
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
    marginBottom: 4,
  },
  activeIconContainer: {
    backgroundColor: '#C2E7FF',
  },
});
