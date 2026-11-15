import React from 'react';
import { Stack } from 'expo-router';

export default function AgendarTransporteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="configurar" />
      <Stack.Screen name="sucesso" />
    </Stack>
  );
}
