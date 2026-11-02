import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';

import { AgendamentoDia } from '@/services/agendamentoService';

export default function AgendamentoSucessoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ agendamentosJson?: string }>();

  let agendamentos: AgendamentoDia[] = [];
  try {
    if (params.agendamentosJson) {
      agendamentos = JSON.parse(params.agendamentosJson);
    }
  } catch (_err) {
    agendamentos = [];
  }

  // Se nao veio via params, gera lista mockada equivalente ao prototipo para exibicao
  if (agendamentos.length === 0) {
    agendamentos = [
      { dataIso: '2026-08-31', usaIda: true, horarioIda: '06:40', usaVolta: true, horarioVolta: '17:30' },
      { dataIso: '2026-09-02', usaIda: true, horarioIda: '06:40', usaVolta: false },
      { dataIso: '2026-09-03', usaIda: false, usaVolta: true, horarioVolta: '17:30' },
      { dataIso: '2026-09-04', usaIda: true, horarioIda: '06:40', usaVolta: true, horarioVolta: '17:30' },
    ];
  }

  const formatarResumoDia = (item: AgendamentoDia) => {
    const rotuloData = item.dataIso === '2026-08-31' ? 'Seg, 31/08' :
                       item.dataIso === '2026-09-01' ? 'Ter, 01/09' :
                       item.dataIso === '2026-09-02' ? 'Qua, 02/09' :
                       item.dataIso === '2026-09-03' ? 'Qui, 03/09' :
                       item.dataIso === '2026-09-04' ? 'Sex, 04/09' : item.dataIso;

    if (item.usaIda && item.usaVolta) {
      return {
        titulo: rotuloData,
        descricao: `Ida às ${item.horarioIda || '06:40'} e volta às ${item.horarioVolta || '17:30'}`,
      };
    }
    if (item.usaIda) {
      return {
        titulo: rotuloData,
        descricao: `Somente ida - ${item.horarioIda || '06:40'}`,
      };
    }
    if (item.usaVolta) {
      return {
        titulo: rotuloData,
        descricao: `Somente volta - ${item.horarioVolta || '17:30'}`,
      };
    }
    return {
      titulo: rotuloData,
      descricao: 'Nenhum ônibus selecionado',
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Ícone de Sucesso */}
        <View style={styles.iconContainer}>
          <CheckCircle2 size={96} color="#00639A" strokeWidth={1.5} />
        </View>

        {/* Título */}
        <Text variant="headlineSmall" style={styles.title}>
          {agendamentos.length} {agendamentos.length === 1 ? 'agendamento realizado' : 'agendamentos realizados'} com sucesso!
        </Text>

        {/* Lista Resumo */}
        <View style={styles.summaryList}>
          {agendamentos.map((item, idx) => {
            const resumo = formatarResumoDia(item);
            return (
              <Surface key={idx} style={styles.summaryCard} elevation={0}>
                <Text variant="titleMedium" style={styles.dayTitle}>{resumo.titulo}</Text>
                <Text variant="bodyMedium" style={styles.dayDesc}>{resumo.descricao}</Text>
              </Surface>
            );
          })}
        </View>

        {/* Botões de Ação */}
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={() => router.replace('/(aluno)/home' as any)}
            style={styles.btnHome}
            contentStyle={styles.btnContent}
            textColor="#00639A"
          >
            Voltar à tela inicial
          </Button>

          <Button
            mode="contained"
            onPress={() => router.replace('/(aluno)/agenda' as any)}
            style={styles.btnAgenda}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
          >
            Ver meus agendamentos
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginVertical: 32,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#191C20',
    marginBottom: 32,
  },
  summaryList: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#F8F9FF',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
  },
  dayTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 4,
  },
  dayDesc: {
    color: '#43474E',
    fontSize: 14,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  btnHome: {
    borderRadius: 24,
    borderColor: '#00639A',
  },
  btnAgenda: {
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
  },
});
