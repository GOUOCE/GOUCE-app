import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Home, ClipboardList, Megaphone, UserCircle } from 'lucide-react-native';

export default function StudentLayout() {
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
          title: 'Início',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Home size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <ClipboardList size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
          tabBarButton: ({ children, style }) => (
            <View style={style} pointerEvents="none">
              {children}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="avisos"
        options={{
          title: 'Avisos',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <Megaphone size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
          tabBarButton: ({ children, style }) => (
            <View style={style} pointerEvents="none">
              {children}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <UserCircle size={24} color={focused ? '#000' : '#666'} />
            </View>
          ),
          tabBarButton: ({ children, style }) => (
            <View style={style} pointerEvents="none">
              {children}
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
