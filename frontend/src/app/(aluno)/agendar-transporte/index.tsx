import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { agendamentoService } from '@/services/agendamentoService';
import { AppPopup } from '@/components/ui/AppPopup';

interface DiaSemana {
  sigla: string;
  diaNum: number;
  dataIso: string;
  status: 'disponivel' | 'agendado' | 'feriado' | 'indisponivel';
  nomeExtenso: string;
}

const DATAS_EXEMPLO: DiaSemana[] = [
  { sigla: 'SEG', diaNum: 31, dataIso: '2026-08-31', status: 'disponivel', nomeExtenso: 'Segunda-Feira (31)' },
  { sigla: 'TER', diaNum: 1, dataIso: '2026-09-01', status: 'disponivel', nomeExtenso: 'Terça-Feira (01)' },
  { sigla: 'QUA', diaNum: 2, dataIso: '2026-09-02', status: 'disponivel', nomeExtenso: 'Quarta-Feira (02)' },
  { sigla: 'QUI', diaNum: 3, dataIso: '2026-09-03', status: 'agendado', nomeExtenso: 'Quinta-Feira (03)' },
  { sigla: 'SEX', diaNum: 4, dataIso: '2026-09-04', status: 'disponivel', nomeExtenso: 'Sexta-Feira (04)' },
  { sigla: 'SÁB', diaNum: 5, dataIso: '2026-09-05', status: 'indisponivel', nomeExtenso: 'Sábado (05)' },
  { sigla: 'DOM', diaNum: 6, dataIso: '2026-09-06', status: 'feriado', nomeExtenso: 'Domingo (06)' },
];

export default function SelecaoDiasScreen() {
  const router = useRouter();

  const [dias] = useState<DiaSemana[]>(DATAS_EXEMPLO);
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(() =>
    DATAS_EXEMPLO.filter(d => d.status === 'disponivel').map(d => d.dataIso)
  );
  const [diaParaEditar, setDiaParaEditar] = useState<DiaSemana | null>(null);

  // Popup de Agendamento Existente (FA-001)
  const [popupEditarVisible, setPopupEditarVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    agendamentoService.listarAgendamentosAtivos().catch(() => {
      if (!mounted) return;
    });

    return () => {
      mounted = false;
    };
  }, []);

  const handleToggleDia = (dia: DiaSemana) => {
    if (dia.status === 'indisponivel' || dia.status === 'feriado') return;

    if (dia.status === 'agendado') {
      // FA-001: Alerta de Agendamento já existente
      setDiaParaEditar(dia);
      setPopupEditarVisible(true);
      return;
    }

    if (diasSelecionados.includes(dia.dataIso)) {
      setDiasSelecionados(diasSelecionados.filter(d => d !== dia.dataIso));
    } else {
      setDiasSelecionados([...diasSelecionados, dia.dataIso]);
    }
  };

  const handleConfirmarEdicao = () => {
    setPopupEditarVisible(false);
    if (diaParaEditar) {
      router.push({
        pathname: '/(aluno)/agendar-transporte/configurar',
        params: { datasIso: [diaParaEditar.dataIso].join(','), modoEdicao: 'true' },
      } as any);
    }
  };

  const handleContinuar = () => {
    if (diasSelecionados.length === 0) return;
    router.push({
      pathname: '/(aluno)/agendar-transporte/configurar',
      params: { datasIso: diasSelecionados.join(',') },
    } as any);
  };

  const quimAgendada = dias.find(d => d.status === 'agendado');

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Agendar Transporte</Text>
      </View>

      {/* Popup de Agendamento já Existente (FA-001) */}
      <AppPopup
        visible={popupEditarVisible}
        type="info"
        title="Agendamento já existente"
        message="Deseja editar o agendamento existente?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarEdicao}
        onDismiss={() => setPopupEditarVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Selecione um ou mais dias para agendar o transporte nesta semana.
        </Text>

        {/* Seletor Semanal de Dias */}
        <View style={styles.daysRow}>
          {dias.map((d) => {
            const isSelecionado = diasSelecionados.includes(d.dataIso);
            const isAgendado = d.status === 'agendado';
            const isFeriado = d.status === 'feriado' || d.status === 'indisponivel';

            return (
              <TouchableOpacity
                key={d.dataIso}
                onPress={() => handleToggleDia(d)}
                activeOpacity={isFeriado ? 1 : 0.7}
                style={[
                  styles.dayCard,
                  isSelecionado && styles.dayCardSelected,
                  isAgendado && styles.dayCardAgendado,
                  isFeriado && styles.dayCardDisabled,
                ]}
              >
                <Text style={[
                  styles.daySigla,
                  isSelecionado && styles.textSelected,
                  isAgendado && styles.textAgendado,
                  isFeriado && styles.textDisabled,
                ]}>
                  {d.sigla}
                </Text>
                <Text style={[
                  styles.dayNum,
                  isSelecionado && styles.textSelected,
                  isAgendado && styles.textAgendado,
                  isFeriado && styles.textDisabled,
                ]}>
                  {d.diaNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contador e Avisos */}
        <View style={styles.infoBox}>
          <Text variant="bodyMedium" style={styles.infoTextCount}>
            {diasSelecionados.length} {diasSelecionados.length === 1 ? 'dia selecionado' : 'dias selecionados'}
          </Text>
          {quimAgendada && (
            <Text variant="bodyMedium" style={styles.infoTextAgendada}>
              {quimAgendada.nomeExtenso} já agendada
            </Text>
          )}
        </View>

        {/* Botão Continuar */}
        <Button
          mode="contained"
          onPress={handleContinuar}
          disabled={diasSelecionados.length === 0}
          style={styles.continueButton}
          contentStyle={styles.btnContent}
        >
          Continuar
        </Button>
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
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCard: {
    width: 44,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3E5F90',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayCardSelected: {
    backgroundColor: '#C2E7FF',
    borderColor: '#3E5F90',
  },
  dayCardAgendado: {
    backgroundColor: '#E8DEF8',
    borderColor: '#6750A4',
  },
  dayCardDisabled: {
    backgroundColor: '#F1F3F9',
    borderColor: '#C4C6CF',
    borderStyle: 'dashed',
  },
  daySigla: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  textSelected: {
    color: '#001D36',
  },
  textAgendado: {
    color: '#21005D',
  },
  textDisabled: {
    color: '#8E9199',
  },
  infoBox: {
    marginBottom: 32,
    gap: 4,
  },
  infoTextCount: {
    fontWeight: '600',
    color: '#333',
  },
  infoTextAgendada: {
    color: '#3E5F90',
    fontWeight: '500',
  },
  continueButton: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  btnContent: {
    height: 55,
  },
});
