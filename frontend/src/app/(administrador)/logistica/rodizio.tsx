import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Bus } from 'lucide-react-native';

import { rodizioService, PadraoRodizioResponse } from '@/services/rodizioService';

export default function RodizioFrotaScreen() {
  const router = useRouter();

  const [rodizio, setRodizio] = useState<PadraoRodizioResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const carregarRodizio = useCallback(async () => {
    setLoading(true);
    try {
      const res = await rodizioService.obterPadraoAtual();
      setRodizio(res);
    } catch {
      setRodizio(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarRodizio();
    }, [carregarRodizio])
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Rodízio de Frota</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Descrição */}
        <Text variant="bodyMedium" style={styles.descriptionText}>
          O rodízio semanal alterna os veículos entre as rotas para equilibrar a quilometragem percorrida e o desgaste mecânico da frota.
        </Text>

        {/* Título da Seção */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Padrão Atual (Aplicado nesta semana)
        </Text>
        <Text variant="bodySmall" style={styles.subCountText}>
          {rodizio?.totalVeiculos || 3} veículos no ciclo
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3E5F90" />
          </View>
        ) : (
          /* Lista do Ciclo Atual */
          <View style={styles.cycleList}>
            {rodizio?.itens.map((item, idx) => (
              <Surface key={item.onibusId || idx} style={styles.itemCard} elevation={0}>
                <View style={styles.itemRow}>
                  <View style={styles.iconBox}>
                    <Bus size={24} color="#191C20" />
                  </View>
                  <View style={styles.textCol}>
                    <Text variant="titleMedium" style={styles.onibusTitle}>{item.onibusApelido}</Text>
                    <Text variant="bodySmall" style={styles.rotaText}>
                      Atual: {item.rotaAtualNome} ➔ Próx.: {item.proximaRotaNome.replace('Linha 02 - Bairro Novo', 'Linha 02').replace('Linha 03 - Vila Antiga', 'Linha 03')}
                    </Text>
                  </View>
                </View>
              </Surface>
            ))}
          </View>
        )}

        {/* Botão Alterar Padrão */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={() => router.push('/(administrador)/logistica/configurar-rodizio' as any)}
            style={styles.btnAlterar}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
          >
            Alterar padrão de rodízio
          </Button>
        </View>
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
  subCountText: {
    color: '#74777F',
    marginBottom: 20,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  cycleList: {
    gap: 12,
    marginBottom: 40,
  },
  itemCard: {
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingVertical: 14,
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
    marginTop: 20,
  },
  btnAlterar: {
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
  },
});
