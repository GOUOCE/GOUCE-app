import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ListaEmbarqueConteudo } from '@/components/embarque/ListaEmbarqueConteudo';
import { useAuth } from '@/contexts/AuthContext';

const primeiroParam = (valor?: string | string[]): string | undefined =>
  Array.isArray(valor) ? valor[0] : valor;

export default function AdminListaEmbarqueScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    rotaId?: string | string[];
    rotaNome?: string | string[];
    modoFixo?: string | string[];
    dataIso?: string | string[];
  }>();

  const rotaIdBruto = primeiroParam(params.rotaId);
  const rotaNomeBruto = primeiroParam(params.rotaNome)?.trim();
  const modoFixoBruto = primeiroParam(params.modoFixo);
  const dataIsoBruta = primeiroParam(params.dataIso)?.trim();

  const rotaIdNumerico = rotaIdBruto ? Number(rotaIdBruto) : NaN;
  const rotaFixaId =
    Number.isFinite(rotaIdNumerico) && rotaIdNumerico > 0 ? rotaIdNumerico : undefined;
  const rotaFixaNome = rotaNomeBruto || undefined;
  const dataOperacaoIso =
    dataIsoBruta && /^\d{4}-\d{2}-\d{2}$/.test(dataIsoBruta) ? dataIsoBruta : undefined;
  const modoFixoInicial =
    modoFixoBruto === 'true' || (modoFixoBruto !== 'false' && rotaFixaId !== undefined);

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
      rotaFixaNome={rotaFixaNome}
      dataOperacaoIso={dataOperacaoIso}
      modoFixoInicial={modoFixoInicial}
      exibirBotaoVoltar
      onVoltar={handleVoltar}
    />
  );
}
