import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ListaEmbarqueConteudo } from '@/components/embarque/ListaEmbarqueConteudo';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminListaEmbarqueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { rotaId, modoFixo } = useLocalSearchParams<{
    rotaId?: string;
    modoFixo?: string;
  }>();

  const rotaIdNumerico = rotaId ? Number(rotaId) : NaN;
  const rotaFixaId =
    Number.isFinite(rotaIdNumerico) && rotaIdNumerico > 0 ? rotaIdNumerico : undefined;

  const handleVoltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(administrador)/(tabs)/logistica' as any);
    }
  };

  return (
    <ListaEmbarqueConteudo
      perfil="ADMINISTRADOR"
      nomeEmissor={user?.name}
      rotaFixaId={rotaFixaId}
      modoFixoInicial={modoFixo === 'true'}
      exibirBotaoVoltar
      onVoltar={handleVoltar}
    />
  );
}
