import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, WifiOff } from 'lucide-react-native';

import {
  agendamentoService,
  DetalhesViagemResponse,
  TrechoDetalhesViagem,
  extrairMensagemErro,
} from '@/services/agendamentoService';

function CardRotaComplementar({ trecho }: { trecho: TrechoDetalhesViagem }) {
  const rota = trecho.rotaComplementar!;
  return (
    <Surface style={styles.cardComplementar} elevation={1}>
      <Text variant="labelLarge" style={styles.cardCategoryLabel}>
        Rota complementar (obrigatória p/ transferência)
      </Text>
      <Text variant="titleMedium" style={styles.cardHeaderTitle}>
        {rota.nomeLinha}
      </Text>

      <View style={styles.gridRow}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Ponto de Embarque</Text>
          <Text style={styles.fieldVal}>{rota.pontoEmbarque}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Ponto de conexão</Text>
          <Text style={styles.fieldVal}>{rota.pontoConexao}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Horário de Saída</Text>
          <Text style={styles.fieldVal}>{rota.horarioSaida}</Text>
        </View>
      </View>
    </Surface>
  );
}

function CardRotaPrincipal({ trecho }: { trecho: TrechoDetalhesViagem }) {
  const rota = trecho.rotaPrincipal;
  return (
    <Surface style={styles.cardPrincipal} elevation={1}>
      <Text variant="labelLarge" style={styles.cardCategoryLabel}>
        Rota principal
      </Text>

      <Text variant="titleMedium" style={styles.cardHeaderTitle}>
        {rota.nomeLinha}
      </Text>

      {rota.faculdadesAtendidas.length > 0 && (
        <Text variant="bodySmall" style={styles.cardSubtitle}>
          Atende: {rota.faculdadesAtendidas.join(', ')}
        </Text>
      )}

      <View style={[styles.gridRow, { marginTop: 16 }]}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Ponto de Embarque</Text>
          <Text style={styles.fieldVal}>{rota.pontoEmbarque}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>
            {trecho.sentido === 'ida' ? 'Seu Desembarque (IES)' : 'Origem (IES)'}
          </Text>
          <Text style={styles.fieldVal}>{rota.pontoDesembarque}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Veículo</Text>
          <Text style={styles.fieldVal}>{rota.veiculo ?? 'A definir'}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Motorista</Text>
          <Text style={styles.fieldVal}>{rota.motorista ?? 'A definir'}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Horário de Saída</Text>
          <Text style={styles.fieldVal}>{rota.horarioSaida}</Text>
        </View>
      </View>
    </Surface>
  );
}

function TelaErro({
  mensagem,
  onTentarNovamente,
}: {
  mensagem: string;
  onTentarNovamente?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={[styles.container, styles.center]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <ChevronLeft size={32} color="#333" />
      </TouchableOpacity>
      <Text variant="titleMedium" style={styles.erroTitulo}>
        Não foi possível carregar a viagem
      </Text>
      <Text variant="bodyMedium" style={styles.erroTexto}>
        {mensagem}
      </Text>
      {onTentarNovamente && (
        <TouchableOpacity style={styles.tentarNovamente} onPress={onTentarNovamente}>
          <Text style={styles.tentarNovamenteTexto}>Tentar novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AgendamentoDetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dataIso?: string }>();

  const dataIso = params.dataIso || '';

  const [detalhes, setDetalhes] = useState<DetalhesViagemResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const executarBusca = useCallback(async () => {
    try {
      const dados = await agendamentoService.obterDetalhesViagem(dataIso);
      setDetalhes(dados);
    } catch (e) {
      setErro(extrairMensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, [dataIso]);

  useFocusEffect(
    useCallback(() => {
      if (!dataIso) return;
      executarBusca();
    }, [executarBusca])
  );

  const tentarNovamente = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    executarBusca();
  }, [executarBusca]);

  if (!dataIso) {
    return <TelaErro mensagem="Data da viagem não informada." />;
  }

  if (carregando) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator animating color="#00639A" />
      </View>
    );
  }

  if (erro || !detalhes) {
    return (
      <TelaErro
        mensagem={erro || 'Nenhum agendamento ativo para esta data.'}
        onTentarNovamente={tentarNovamente}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <View>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {detalhes.diaSemana}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {detalhes.dataFormatada}
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
        {detalhes.trechos.map((trecho) => (
          <View key={trecho.sentido}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {trecho.sentido === 'ida' ? 'Ida' : 'Volta'}
            </Text>

            {/* CARD 1: ROTA COMPLEMENTAR (somente quando há transferência - FA-001 / Critério 3) */}
            {trecho.rotaComplementar && <CardRotaComplementar trecho={trecho} />}

            {/* CARD 2: ROTA PRINCIPAL */}
            <CardRotaPrincipal trecho={trecho} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  erroTitulo: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 8,
  },
  erroTexto: {
    color: '#43474E',
    textAlign: 'center',
    marginBottom: 24,
  },
  tentarNovamente: {
    backgroundColor: '#3E5F90',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  tentarNovamenteTexto: {
    color: '#FFF',
    fontWeight: '600',
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
});
