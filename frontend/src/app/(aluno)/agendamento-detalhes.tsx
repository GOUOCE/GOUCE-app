import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, WifiOff } from 'lucide-react-native';

import { agendamentoService, DetalhesViagemResponse } from '@/services/agendamentoService';

export default function AgendamentoDetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dataIso?: string; semComplementar?: string }>();

  const dataIso = params.dataIso || '2026-09-01';
  const temComplementar = params.semComplementar !== 'true';

  const [detalhes, setDetalhes] = useState<DetalhesViagemResponse | null>(null);

  const carregarDetalhes = useCallback(async () => {
    const dados = await agendamentoService.obterDetalhesViagem(dataIso, temComplementar);
    setDetalhes(dados);
  }, [dataIso, temComplementar]);

  useEffect(() => {
    carregarDetalhes();
  }, [carregarDetalhes]);

  if (!detalhes) return null;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <View>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {detalhes.dataFormatada.split(' ')[0]}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {detalhes.dataFormatada.split(' ')[1] || '01/09/2026'}
          </Text>
        </View>
      </View>

      {/* Aviso de Cache Offline (FA-002 / Critério 4) */}
      {detalhes.isOffline && (
        <Surface style={styles.offlineBanner} elevation={0}>
          <WifiOff size={16} color="#00639A" />
          <Text style={styles.offlineText}>Visualização Offline (Dados salvos no dispositivo)</Text>
        </Surface>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seção Ida */}
        <Text variant="titleLarge" style={styles.sectionTitle}>
          {detalhes.tipoTrajeto === 'volta' ? 'Volta' : 'Ida'}
        </Text>

        {/* CARD 1: ROTA COMPLEMENTAR (Exibida somente se houver transferência - FA-001 / Critério 3) */}
        {detalhes.temRotaComplementar && detalhes.rotaComplementar && (
          <Surface style={styles.cardComplementar} elevation={1}>
            <Text variant="labelLarge" style={styles.cardCategoryLabel}>
              Rota complementar (obrigatória p/ transferência)
            </Text>
            <Text variant="titleMedium" style={styles.cardHeaderTitle}>
              {detalhes.rotaComplementar.nomeVeiculo}
            </Text>

            <View style={styles.gridRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Ponto de Embarque</Text>
                <Text style={styles.fieldVal}>{detalhes.rotaComplementar.pontoEmbarque}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Ponto de conexão</Text>
                <Text style={styles.fieldVal}>{detalhes.rotaComplementar.pontoConexao}</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.col}>
                <Text style={styles.fieldLabel}>Horário de Saída</Text>
                <Text style={styles.fieldVal}>{detalhes.rotaComplementar.horarioSaida}</Text>
              </View>
            </View>
          </Surface>
        )}

        {/* CARD 2: ROTA PRINCIPAL */}
        <Surface style={styles.cardPrincipal} elevation={1}>
          <Text variant="labelLarge" style={styles.cardCategoryLabel}>
            Rota principal
          </Text>

          <Text variant="titleMedium" style={styles.cardHeaderTitle}>
            {detalhes.rotaPrincipal.veiculo}
          </Text>

          <Text variant="bodySmall" style={styles.cardSubtitle}>
            {detalhes.rotaPrincipal.linha}
          </Text>

          <View style={[styles.gridRow, { marginTop: 16 }]}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Ponto de Embarque</Text>
              <Text style={styles.fieldVal}>{detalhes.rotaPrincipal.pontoEmbarque}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Seu Desembarque (IES)</Text>
              <Text style={styles.fieldVal}>{detalhes.rotaPrincipal.desembarqueIes}</Text>
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Motorista</Text>
              <Text style={styles.fieldVal}>{detalhes.rotaPrincipal.motorista}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Horário de Saída</Text>
              <Text style={styles.fieldVal}>{detalhes.rotaPrincipal.horarioSaida}</Text>
            </View>
          </View>

          {detalhes.rotaPrincipal.realocado && (
            <Surface style={styles.badgeRealocado} elevation={0}>
              <Text style={styles.badgeText}>Realocado</Text>
            </Surface>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 22,
  },
  headerSubtitle: {
    color: '#666',
    fontSize: 14,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C2E7FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  offlineText: {
    color: '#001D36',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 16,
    fontSize: 20,
  },
  cardComplementar: {
    backgroundColor: '#F1F3F9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  cardPrincipal: {
    backgroundColor: '#F1F3F9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 8,
  },
  cardCategoryLabel: {
    color: '#43474E',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardHeaderTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
  },
  cardSubtitle: {
    color: '#43474E',
    fontSize: 14,
    marginBottom: 8,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  col: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#74777F',
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldVal: {
    fontSize: 15,
    fontWeight: '600',
    color: '#191C20',
  },
  badgeRealocado: {
    backgroundColor: '#D3E3FD',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  badgeText: {
    color: '#041E49',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
