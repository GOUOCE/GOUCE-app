import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@contexts/AuthContext';

export default function StudentLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Proteção no nível do layout: decide antes de desenhar qualquer tela do grupo
  if (!user) {
    return <Redirect href="/(autenticacao)/login" />;
  }

  if (user.role !== 'ALUNO') {
    return <Redirect href="/acesso-negado" />;
  }

  const statusAluno = (user.status || '').toLowerCase();
  if (statusAluno === 'pendente') {
    return <Redirect href="/(autenticacao)/cadastro-pendente" />;
  }
  if (statusAluno === 'rejeitado') {
    return <Redirect href="/(autenticacao)/cadastro-rejeitado" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="agendar-transporte" />
      <Stack.Screen name="editar-perfil" />
      <Stack.Screen name="alterar-email" />
      <Stack.Screen name="carteirinha-digital" />
      <Stack.Screen name="renovar-vinculo" />
    </Stack>
  );
}
