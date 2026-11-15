import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ListaEmbarqueConteudo } from '@/components/embarque/ListaEmbarqueConteudo';
import { useAuth } from '@contexts/AuthContext';
import { listaEmbarqueService } from '@/services/listaEmbarqueService';

function normalizarIesRepresentante(faculdade?: string, fallback: string = 'UFC'): string {
  const texto = faculdade?.trim();
  if (!texto) return fallback;

  const siglaOuNome = texto.split(' - ')[0].trim();
  if (/universidade federal do cear[aá]|\bufc\b/i.test(siglaOuNome)) {
    return 'UFC';
  }
  if (/estadual do cear[aá]|\buece\b/i.test(siglaOuNome)) {
    return 'UECE';
  }
  if (/instituto federal|\bifce\b/i.test(siglaOuNome)) {
    return 'IFCE';
  }
  if (/cat[oó]lica|unicat[oó]lica/i.test(siglaOuNome)) {
    return 'Católica';
  }
  return siglaOuNome;
}

export default function RepresentativeHomeScreen() {
  const { user } = useAuth();
  const [rotaPadrao, setRotaPadrao] = useState<{
    rotaId: number;
    rotaNome: string;
    iesResponsavel: string;
  } | null>(null);

  useEffect(() => {
    let ativo = true;

    listaEmbarqueService
      .obterRotaPadraoRepresentante()
      .then((dados) => {
        if (ativo) {
          setRotaPadrao(dados);
        }
      })
      .catch(() => {
        if (ativo) {
          setRotaPadrao({
            rotaId: 1,
            rotaNome: 'Linha 01 - Centro',
            iesResponsavel: 'UFC',
          });
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  if (!rotaPadrao) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3E5F90" testID="loading-representante-embarque" />
      </View>
    );
  }

  const iesResponsavel = normalizarIesRepresentante(
    user?.faculdade,
    rotaPadrao.iesResponsavel
  );

  return (
    <ListaEmbarqueConteudo
      perfil="MOTORISTA"
      nomeEmissor={user?.name}
      iesResponsavel={iesResponsavel}
      rotaFixaId={rotaPadrao.rotaId}
      modoFixoInicial
      exibirBotaoVoltar={false}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
