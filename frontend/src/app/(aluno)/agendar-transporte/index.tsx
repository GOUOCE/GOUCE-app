import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { AppPopup } from '@/components/ui/AppPopup';

interface DiaSemana {
  sigla: string;
  diaNum: number;
  dataIso: string;
  agendado?: boolean;
  disabled?: boolean;
}

const DIAS_SEMANA_DEMO: DiaSemana[] = [
  { sigla: 'SEG', diaNum: 31, dataIso: '2026-08-31', agendado: true },
  { sigla: 'TER', diaNum: 1, dataIso: '2026-09-01', agendado: true },
  { sigla: 'QUA', diaNum: 2, dataIso: '2026-09-02', agendado: false },
  { sigla: 'QUI', diaNum: 3, dataIso: '2026-09-03', agendado: true },
  { sigla: 'SEX', diaNum: 4, dataIso: '2026-09-04', agendado: false },
  { sigla: 'SÁB', diaNum: 5, dataIso: '2026-09-05', disabled: true },
  { sigla: 'DOM', diaNum: 6, dataIso: '2026-09-06', disabled: true },
];

export default function AgendarTransporteIndexScreen() {
  const router = useRouter();
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>(['2026-09-02']);
  const [popupExistenteVisible, setPopupExistenteVisible] = useState(false);
  const [diaExistenteIso, setDiaExistenteIso] = useState('');

  const toggleDia = (dia: DiaSemana) => {
    if (dia.disabled) return;

    if (dia.agendado) {
      setDiaExistenteIso(dia.dataIso);
      setPopupExistenteVisible(true);
      return;
    }

    if (diasSelecionados.includes(dia.dataIso)) {
      setDiasSelecionados(diasSelecionados.filter(d => d !== dia.dataIso));
    } else {
      setDiasSelecionados([...diasSelecionados, dia.dataIso]);
    }
  };

  const handleConfirmarEdicaoExistente = () => {
    setPopupExistenteVisible(false);
    router.push({
      pathname: '/(aluno)/agendar-transporte/configurar',
      params: { datasIso: diaExistenteIso, modoEdicao: 'true' },
    } as any);
  };

  const handleContinuar = () => {
    if (diasSelecionados.length === 0) return;
    router.push({
      pathname: '/(aluno)/agendar-transporte/configurar',
      params: { datasIso: diasSelecionados.join(',') },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Agendar Transporte</Text>
      </View>

      {/* Popup de Agendamento Existente (HU-013 / FA-001) */}
      <AppPopup
        visible={popupExistenteVisible}
        type="warning"
        title="Agendamento já existente"
        message="Deseja editar o agendamento existente?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarEdicaoExistente}
        onDismiss={() => setPopupExistenteVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Selecione um ou mais dias para agendar o transporte nesta semana.
        </Text>

        {/* Grade de Seleção Semanal */}
        <View style={styles.weekGrid}>
          {DIAS_SEMANA_DEMO.map((dia) => {
            const isSelected = diasSelecionados.includes(dia.dataIso);
            const isAgendado = dia.agendado;
            const isDisabled = dia.disabled;

            return (
              <TouchableOpacity
                key={dia.dataIso}
                onPress={() => toggleDia(dia)}
                disabled={isDisabled}
                style={[
                  styles.dayCard,
                  isSelected && styles.dayCardSelected,
                  isAgendado && styles.dayCardAgendado,
                  isDisabled && styles.dayCardDisabled,
                ]}
              >
                <Text style={[
                  styles.siglaText,
                  isSelected && styles.textSelected,
                  isAgendado && styles.textAgendado,
                  isDisabled && styles.textDisabled,
                ]}>{dia.sigla}</Text>
                <Text style={[
                  styles.diaNumText,
                  isSelected && styles.textSelected,
                  isAgendado && styles.textAgendado,
                  isDisabled && styles.textDisabled,
                ]}>{dia.diaNum}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contador de Dias Selecionados */}
        <Text variant="bodyMedium" style={styles.selectedCountText}>
          {diasSelecionados.length} {diasSelecionados.length === 1 ? 'dia selecionado' : 'dias selecionados'}
        </Text>

        {/* Botão Continuar */}
        <Button
          mode="contained"
          onPress={handleContinuar}
          disabled={diasSelecionados.length === 0}
          style={styles.continueBtn}
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
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  subtitle: {
    color: '#43474E',
    marginBottom: 24,
    lineHeight: 20,
  },
  weekGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayCard: {
    width: 44,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E0E2EC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayCardSelected: {
    backgroundColor: '#C2E7FF',
    borderWidth: 1.5,
    borderColor: '#00639A',
  },
  dayCardAgendado: {
    backgroundColor: '#E8F0FE',
    borderWidth: 1,
    borderColor: '#3E5F90',
  },
  dayCardDisabled: {
    backgroundColor: '#F1F3F9',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderStyle: 'dashed',
  },
  siglaText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#43474E',
  },
  diaNumText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#191C20',
  },
  textSelected: {
    color: '#001D36',
  },
  textAgendado: {
    color: '#00639A',
  },
  textDisabled: {
    color: '#C4C6CF',
  },
  selectedCountText: {
    color: '#43474E',
    marginBottom: 24,
  },
  continueBtn: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  btnContent: {
    height: 52,
  },
});
