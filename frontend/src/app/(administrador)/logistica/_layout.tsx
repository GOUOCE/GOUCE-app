import React from 'react';
import { Stack } from 'expo-router';

export default function LogisticaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="distribuicao" />
      <Stack.Screen name="alocar" />
      <Stack.Screen name="excedentes" />
    </Stack>
  );
}
