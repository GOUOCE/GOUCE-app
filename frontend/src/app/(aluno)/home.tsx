import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { CalendarPlus, ClipboardList, Megaphone, Contact } from 'lucide-react-native';
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

  return (
    <View style={styles.tripTrecho}>
      <Text variant="titleMedium" style={styles.busName}>
        {principal.nomeLinha}
      </Text>
      <Text variant="bodyMedium" style={styles.routeDetails}>
        {trecho.sentido === 'ida' ? 'Saída' : 'Retorno'} {principal.horarioSaida}
        {principal.veiculo ? ` • ${principal.veiculo}` : ''}
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

      // /meus já traz os dados completos por trecho e é a mesma fonte do cache
      // offline da Agenda (FA-002); evita uma consulta extra só para o resumo.
      agendamentoService
        .listarAgendamentosAtivos()
        .then((dados) => {
          if (!ativo) return;
          const agendamento = dados.agendamentos.find((item) => item.data === hoje);
          setViagemHoje(agendamento ? mapearDetalhe(agendamento) : null);
        })
        .catch(async (erro: any) => {
          // Recusa do servidor não deve reutilizar dados locais como se fossem atuais.
          if (erro?.response) {
            if (ativo) setViagemHoje(null);
            return;
          }
          const cache = await agendamentoService.listarAgendamentosCache();
          if (!ativo) return;
          const agendamentos = Array.isArray(cache?.agendamentos)
            ? cache!.agendamentos
            : [];
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
      {/* Saudação */}
      <View style={styles.header}>
        <Text variant="displaySmall" style={styles.greeting}>
          Olá, {user?.name?.split(' ')[0] || 'Aluno'}!
        </Text>
      </View>

      {/* Sua viagem hoje: exibida apenas quando há reserva real para a data local */}
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

      {/* Acesso Rápido */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Acesso Rápido</Text>
        <View style={styles.actionGrid}>
          <QuickAction
            title="Agendar Transporte"
            Icone={CalendarPlus}
            onPress={() => router.push('/(aluno)/agenda')}
          />
          <QuickAction
            title="Meus Agendamentos"
            Icone={ClipboardList}
            onPress={() => router.push('/(aluno)/agenda')}
          />
          <QuickAction
            title="Mural de Avisos"
            Icone={Megaphone}
            onPress={() => router.push('/(aluno)/avisos')}
          />
          <QuickAction
            title="Carteirinha Digital"
            Icone={Contact}
            onPress={() => router.push('/(aluno)/carteirinha-digital')}
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
    gap: 4,
  },
  busName: {
    fontWeight: 'bold',
    color: '#191C20',
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
