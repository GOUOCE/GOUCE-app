import React from 'react';
import { ListaEmbarqueConteudo } from '@/components/embarque/ListaEmbarqueConteudo';
import { useAuth } from '@contexts/AuthContext';

export default function RepresentativeHomeScreen() {
  const { user } = useAuth();

  return (
    <ListaEmbarqueConteudo
      perfil="MOTORISTA"
      nomeEmissor={user?.name}
      modoFixoInicial
      exibirBotaoVoltar={false}
    />
  );
}
