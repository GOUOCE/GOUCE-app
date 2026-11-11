import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@contexts/AuthContext';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Proteção de acesso no nível do Layout
  if (!user) {
    return <Redirect href="/(autenticacao)/login" />;
  }

  if (user.role !== 'ADMINISTRADOR') {
    return <Redirect href="/acesso-negado" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="administradores" />
      <Stack.Screen name="solicitacoes" />
      <Stack.Screen name="bairros" />
      <Stack.Screen name="faculdades" />
      <Stack.Screen name="frota" />
      <Stack.Screen name="motoristas" />
      <Stack.Screen name="representantes" />
      <Stack.Screen name="rotas-principais" />
      <Stack.Screen name="rotas-complementares" />
      <Stack.Screen name="cadastrar-administrador" />
    </Stack>
  );
}
