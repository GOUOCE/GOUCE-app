import { Redirect } from 'expo-router';

export default function Index() {
  // Por padrão, redireciona para a tela de login
  return <Redirect href="/(auth)/login" />;
}
