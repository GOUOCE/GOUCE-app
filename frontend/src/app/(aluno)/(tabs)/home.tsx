import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { AlertTriangle, CalendarPlus, ClipboardList, Megaphone, Contact } from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { useAuth } from '@contexts/AuthContext';
import { QuickAction } from '@/components/dashboard/QuickAction';
import {
  agendamentoService,
  DetalhesViagemResponse,
  TrechoDetalhesViagem,
  mapearDetalhe,
} from '@/services/agendamentoService';

function dataLocalIso(): string {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
    hoje.getDate()
  ).padStart(2, '0')}`;
}

function ResumoTrecho({ trecho }: { trecho: TrechoDetalhesViagem }) {
  const principal = trecho.rotaPrincipal;
  const complementar = trecho.rotaComplementar;
  const aguardandoPrincipal = principal.statusAlocacao === 'AGUARDANDO_ALOCACAO';

  return (
    <View style={styles.tripTrecho}>
      <View style={styles.tripTrechoHeader}>
        <Text variant="titleMedium" style={styles.busName}>
          {trecho.sentido === 'ida' ? 'Ida' : 'Volta'} — {principal.nomeLinha}
        </Text>
        <View
          style={[
            styles.statusBadge,
            aguardandoPrincipal ? styles.statusBadgeAguardando : styles.statusBadgeConfirmada,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeTexto,
              aguardandoPrincipal
                ? styles.statusBadgeTextoAguardando
                : styles.statusBadgeTextoConfirmada,
            ]}
            testID={`home-status-alocacao-${trecho.sentido}`}
          >
            {principal.statusAlocacaoLabel}
          </Text>
        </View>
      </View>

      {principal.realocado && principal.mensagemRealocacao && (
        <View
          style={styles.alertaRealocacaoBox}
          testID={`home-alerta-realocacao-${trecho.sentido}`}
        >
          <AlertTriangle size={14} color="#92400E" />
          <Text style={styles.alertaRealocacaoTexto}>{principal.mensagemRealocacao}</Text>
        </View>
      )}

      {principal.veiculo && (
        <Text variant="bodyMedium" style={styles.vehicleDetails}>
          {principal.veiculo}
          {principal.motorista ? ` • Motorista: ${principal.motorista}` : ''}
        </Text>
      )}

      <Text variant="bodyMedium" style={styles.routeDetails}>
        {trecho.sentido === 'ida' ? 'Saída' : 'Retorno'} {principal.horarioSaida}
      </Text>

      {complementar && (
        <Text variant="bodySmall" style={styles.connectionDetails}>
          Complementar: {complementar.nomeLinha} • Conexão: {complementar.pontoConexao}
        </Text>
      )}
    </View>
  );
}

export default function StudentHomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [viagemHoje, setViagemHoje] = useState<DetalhesViagemResponse | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      const hoje = dataLocalIso();

      agendamentoService
        .listarAgendamentosAtivos()
        .then((dados) => {
          if (!ativo) return;
          const agendamento = dados.agendamentos.find((item) => item.data === hoje);
          setViagemHoje(agendamento ? mapearDetalhe(agendamento) : null);
        })
        .catch(async (erro: any) => {
          if (erro?.response) {
            if (ativo) setViagemHoje(null);
            return;
          }
          const cache = await agendamentoService.listarAgendamentosCache();
          if (!ativo) return;
          const agendamentos = Array.isArray(cache?.agendamentos) ? cache!.agendamentos : [];
          const agendamento = agendamentos.find((item) => item.data === hoje);
          setViagemHoje(
            agendamento ? { ...mapearDetalhe(agendamento), isOffline: true } : null
          );
        });

      return () => {
        ativo = false;
      };
    }, [])
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, {user?.name?.split(' ')[0] || 'Aluno'}!
        </Text>
      </View>

      {viagemHoje && viagemHoje.trechos.length > 0 && (
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Sua viagem hoje</Text>
          <Surface style={styles.tripCard} elevation={1}>
            <View style={styles.tripInfo}>
              {viagemHoje.trechos.map((trecho) => (
                <ResumoTrecho key={trecho.sentido} trecho={trecho} />
              ))}
            </View>
            <Button
              mode="contained"
              onPress={() =>
                router.push({
                  pathname: '/(aluno)/agendamento-detalhes',
                  params: { dataIso: viagemHoje.dataIso },
                } as any)
              }
              style={styles.detailsBtn}
              buttonColor="#3e5f90"
            >
              Ver detalhes
            </Button>
          </Surface>
        </View>
      )}

      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Acesso Rápido</Text>
        <View style={styles.actionGrid}>
          <QuickAction
            title="Agendar Transporte"
            Icone={CalendarPlus}
            onPress={() => router.push('/(aluno)/agendar-transporte' as any)}
          />
          <QuickAction
            title="Meus Agendamentos"
            Icone={ClipboardList}
            onPress={() => router.push('/(aluno)/(tabs)/agenda' as any)}
          />
          <QuickAction
            title="Mural de Avisos"
            Icone={Megaphone}
            onPress={() => router.push('/(aluno)/avisos' as any)}
          />
          <QuickAction
            title="Carteirinha Digital"
            Icone={Contact}
            onPress={() => router.push('/(aluno)/carteirinha-digital' as any)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  greeting: {
    fontWeight: '400',
    color: '#333',
    fontSize: 32,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#333',
    fontWeight: '600',
    fontSize: 18,
  },
  tripCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F1F3F9',
    gap: 12,
  },
  tripInfo: {
    gap: 12,
  },
  tripTrecho: {
    gap: 6,
  },
  tripTrechoHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  busName: {
    fontWeight: 'bold',
    color: '#191C20',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeConfirmada: {
    backgroundColor: '#BCEEFF',
  },
  statusBadgeAguardando: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusBadgeTexto: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadgeTextoConfirmada: {
    color: '#004D67',
  },
  statusBadgeTextoAguardando: {
    color: '#92400E',
  },
  alertaRealocacaoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  alertaRealocacaoTexto: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
  },
  vehicleDetails: {
    color: '#191C20',
    fontWeight: '600',
  },
  routeDetails: {
    color: '#43474E',
  },
  connectionDetails: {
    color: '#03537D',
    fontWeight: '600',
  },
  detailsBtn: {
    alignSelf: 'flex-end',
    borderRadius: 20,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  }
});
