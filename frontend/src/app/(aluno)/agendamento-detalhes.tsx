import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { agendamentoService } from '@/services/agendamentoService';

export default function AgendamentoDetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dataIso?: string; idAgendamento?: string }>();

  const [detalhe, setDetalhe] = useState<any>(null);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        if (params.idAgendamento) {
          const dados = await agendamentoService.detalharAgendamento(Number(params.idAgendamento));
          if (ativo) {
            setDetalhe(dados);
            setCarregado(true);
          }
        } else {
          // Tenta buscar nos agendamentos do aluno para a data
          const lista = await agendamentoService.listarAgendamentosAtivos();
          const achado = lista.find((a: any) => a.dataIso === params.dataIso || a.data === params.dataIso);
          if (achado && achado.idAgendamento) {
            const dados = await agendamentoService.detalharAgendamento(Number(achado.idAgendamento));
            if (ativo) {
              setDetalhe(dados);
              setCarregado(true);
            }
          } else {
            if (ativo) {
              setDetalhe(achado);
              setCarregado(true);
            }
          }
        }
      } catch {
        if (ativo) {
          setDetalhe(null);
          setCarregado(true);
        }
      }
    }
    carregar();
    return () => {
      ativo = false;
    };
  }, [params.idAgendamento, params.dataIso]);

  const formatarData = (dataStr?: string) => {
    if (!dataStr) return 'Detalhes da Viagem';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Viagem {formatarData(detalhe?.data || params.dataIso)}
        </Text>
      </View>

      {!carregado ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3E5F90" />
        </View>
      ) : !detalhe ? (
        <View style={styles.emptyBox}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Não foi possível carregar os detalhes desta reserva.
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.btnVoltar}>
            Voltar
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* SEÇÃO IDA */}
          {detalhe.usa_ida && (
            <Surface style={styles.cardSection} elevation={1}>
              <Text variant="titleLarge" style={styles.cardTitle}>Trecho de Ida</Text>

              <View style={styles.gridRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Ponto de Embarque</Text>
                  <Text style={styles.fieldVal}>{detalhe.ponto_embarque_nome || 'Ponto cadastrado'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>IES de Destino</Text>
                  <Text style={styles.fieldVal}>{detalhe.ies_destino_nome || 'Campus contratado'}</Text>
                </View>
              </View>

              {detalhe.rota_complementar_ida_nome && (
                <View style={styles.gridRow}>
                  <View style={styles.colFull}>
                    <Text style={styles.fieldLabel}>Rota Complementar</Text>
                    <Text style={styles.fieldVal}>{detalhe.rota_complementar_ida_nome}</Text>
                  </View>
                </View>
              )}
            </Surface>
          )}

          {/* SEÇÃO VOLTA */}
          {detalhe.usa_volta && (
            <Surface style={styles.cardSection} elevation={1}>
              <Text variant="titleLarge" style={styles.cardTitle}>Trecho de Volta</Text>

              <View style={styles.gridRow}>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>IES de Origem</Text>
                  <Text style={styles.fieldVal}>{detalhe.ies_origem_nome || 'Campus contratado'}</Text>
                </View>
                <View style={styles.col}>
                  <Text style={styles.fieldLabel}>Ponto de Desembarque</Text>
                  <Text style={styles.fieldVal}>{detalhe.ponto_desembarque_nome || 'Ponto cadastrado'}</Text>
                </View>
              </View>

              {detalhe.rota_complementar_volta_nome && (
                <View style={styles.gridRow}>
                  <View style={styles.colFull}>
                    <Text style={styles.fieldLabel}>Rota Complementar</Text>
                    <Text style={styles.fieldVal}>{detalhe.rota_complementar_volta_nome}</Text>
                  </View>
                </View>
              )}
            </Surface>
          )}
        </ScrollView>
      )}
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
    fontSize: 20,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  btnVoltar: {
    backgroundColor: '#3E5F90',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  cardSection: {
    backgroundColor: '#F1F3F9',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 8,
    fontSize: 18,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  col: {
    width: '48%',
  },
  colFull: {
    width: '100%',
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
