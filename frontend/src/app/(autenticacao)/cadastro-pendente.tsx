import React from 'react';
import { useRouter } from 'expo-router';
import { TelaSucesso } from '@/components/cadastro/TelaSucesso';
import { useAuth } from '@contexts/AuthContext';

export default function CadastroPendenteScreen() {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleVoltar = async () => {
    await signOut();
    router.replace('/(autenticacao)/login');
  };

  return <TelaSucesso onVoltarLogin={handleVoltar} />;
}
