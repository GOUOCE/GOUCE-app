import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Surface, Text } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, Bus, ChevronLeft, RefreshCcw } from 'lucide-react-native';

import {
  ContextoRodizio,
  ItemConfiguracaoRodizio,
  rodizioService,
} from '@/services/rodizioService';
import { getErrorMessage } from '@/utils/errorUtils';

function formatarData(dataIso: string): string {
  return new Date(`${dataIso}T12:00:00`).toLocaleDateString('pt-BR');
}

export default function RodizioFrotaScreen() {
  const router = useRouter();
  const [contexto, setContexto] = useState<ContextoRodizio | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');
    try {
      setContexto(await rodizioService.obterContexto());
    } catch (error) {
      setContexto(null);
      setErro(getErrorMessage(error, 'Não foi possível carregar o rodízio de frota.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  const nomeRota = (rotaId: number) =>
    contexto?.rotas.find((rota) => rota.id === rotaId)?.nome ?? `Rota ${rotaId}`;

  const descricaoOnibus = (placa: string) => {
    const onibus = contexto?.onibus.find((item) => item.placa === placa);
    return onibus ? `${onibus.apelido} • ${onibus.placa}` : placa;
  };

  const itens = contexto?.configuracao?.itens ?? [];
  const ItensOrdenados: ItemConfiguracaoRodizio[] = [...itens].sort(
    (a, b) => a.rota_id - b.rota_id || a.turno.localeCompare(b.turno),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <ChevronLeft size={32} color="#191C20" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Rodízio de Frota</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="bodyMedium" style={styles.descriptionText}>
          O rodízio semanal alterna os veículos entre as rotas para equilibrar a quilometragem percorrida e o desgaste mecânico da frota.
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3E5F90" />
          </View>
        ) : erro ? (
          <View style={styles.errorBox}>
            <AlertCircle size={24} color="#BA1A1A" />
            <Text style={styles.errorText}>{erro}</Text>
            <Button mode="outlined" onPress={() => void carregar()}>Tentar novamente</Button>
          </View>
        ) : (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Padrão vigente</Text>
            <Text variant="bodySmall" style={styles.subCountText}>
              {contexto?.configuracao
                ? `Vigente desde ${formatarData(contexto.configuracao.data_inicio)} • ${contexto.configuracao.semanas} semanas`
                : 'Nenhum rodízio configurado'}
            </Text>

            <View style={styles.cycleList}>
              {ItensOrdenados.length > 0 ? (
                ItensOrdenados.map((item) => (
                  <Surface key={`${item.rota_id}-${item.turno}`} style={styles.itemCard} elevation={0}>
                    <View style={styles.itemRow}>
                      <View style={styles.iconBox}>
                        <Bus size={24} color="#191C20" />
                      </View>
                      <View style={styles.textCol}>
                        <Text variant="titleMedium" style={styles.onibusTitle}>
                          {nomeRota(item.rota_id)}
                        </Text>
                        <Text variant="bodySmall" style={styles.rotaText}>
                          {item.turno === 'ida' ? 'Ida' : 'Volta'} • {descricaoOnibus(item.onibus_id)}
                        </Text>
                      </View>
                    </View>
                  </Surface>
                ))
              ) : (
                <Surface style={styles.emptyCard} elevation={0}>
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    Configure o rodízio para definir o veículo de cada rota e turno.
                  </Text>
                </Surface>
              )}
            </View>

            <Text variant="titleMedium" style={[styles.sectionTitle, styles.routesTitle]}>
              Rotas ativas
            </Text>
            <View style={styles.cycleList}>
              {(contexto?.rotas ?? []).map((rota) => (
                <Surface key={rota.id} style={styles.itemCard} elevation={0}>
                  <Text variant="bodyMedium" style={styles.routeName}>{rota.nome}</Text>
                </Surface>
              ))}
            </View>
          </>
        )}

        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={() => router.push('/(administrador)/logistica/configurar-rodizio' as any)}
            style={styles.btnAlterar}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
            icon={() => <RefreshCcw size={20} color="#FFF" />}
          >
            Configurar Rodízio
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  descriptionText: {
    color: '#43474E',
    lineHeight: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginBottom: 4,
  },
  routesTitle: {
    marginTop: 12,
  },
  subCountText: {
    color: '#74777F',
    marginBottom: 20,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
  },
  cycleList: {
    gap: 12,
    marginBottom: 24,
  },
  itemCard: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  emptyCard: {
    backgroundColor: '#FFF',
    padding: 18,
    borderRadius: 8,
  },
  emptyText: {
    color: '#74777F',
    textAlign: 'center',
  },
  routeName: {
    color: '#191C20',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 32,
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  onibusTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 16,
    marginBottom: 2,
  },
  rotaText: {
    color: '#43474E',
    fontSize: 13,
  },
  actionContainer: {
    marginTop: 12,
  },
  btnAlterar: {
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
  },
});
