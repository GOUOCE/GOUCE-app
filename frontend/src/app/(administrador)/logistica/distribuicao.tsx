import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, ChevronRight, Pencil, ClipboardList, Users, User, Bus } from 'lucide-react-native';

import { logisticaService, LinhaDistribuicao } from '@/services/logisticaService';

export default function DistribicaoLogisticaScreen() {
  const router = useRouter();

  const [tipoTab, setTipoTab] = useState<'proximos' | 'historico'>('proximos');
  const [dataIsoSelecionada, setDataIsoSelecionada] = useState<string>('2026-09-01');
  const [linhas, setLinhas] = useState<LinhaDistribuicao[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarLinhas = useCallback(async (data: string, tab: 'proximos' | 'historico') => {
    setLoading(true);
    try {
      const res = await logisticaService.listarDistribuicaoLogistica(data, tab);
      setLinhas(res);
    } catch {
      setLinhas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarLinhas(dataIsoSelecionada, tipoTab);
    }, [carregarLinhas, dataIsoSelecionada, tipoTab])
  );

  const handleNavegarSemana = (delta: number) => {
    // Alterna semana demo
    if (delta > 0) {
      setDataIsoSelecionada('2026-09-08');
    } else {
      setDataIsoSelecionada('2026-09-01');
    }
  };

  const DIAS_SEMANA = [
    { sigla: 'SEG', diaNum: 31, dataIso: '2026-08-31', badge: 0 },
    { sigla: 'TER', diaNum: 1, dataIso: '2026-09-01', badge: 3 },
    { sigla: 'QUA', diaNum: 2, dataIso: '2026-09-02', badge: 0 },
    { sigla: 'QUI', diaNum: 3, dataIso: '2026-09-03', badge: 0 },
    { sigla: 'SEX', diaNum: 4, dataIso: '2026-09-04', badge: 0 },
    { sigla: 'SÁB', diaNum: 5, dataIso: '2026-09-05', badge: 0, disabled: true },
    { sigla: 'DOM', diaNum: 6, dataIso: '2026-09-06', badge: 0, disabled: true },
  ];

  const renderBadgeStatus = (status: LinhaDistribuicao['status']) => {
    if (status === 'alocada') {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#C2E7FF' }]}>
          <Text style={[styles.badgeText, { color: '#001D36' }]}>Alocada</Text>
        </View>
      );
    }
    if (status === 'superlotada') {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#FFDAD6' }]}>
          <Text style={[styles.badgeText, { color: '#410002' }]}>Superlotada</Text>
        </View>
      );
    }
    return (
      <View style={[styles.badgeContainer, { backgroundColor: '#FFDCC2' }]}>
        <Text style={[styles.badgeText, { color: '#2E1500' }]}>Pendente</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Distribuição Logística</Text>
      </View>

      {/* Tabs Superiores (Próximos / Histórico) */}
      <View style={styles.topTabsContainer}>
        <TouchableOpacity
          style={[styles.topTabBtn, tipoTab === 'proximos' && styles.topTabBtnActive]}
          onPress={() => setTipoTab('proximos')}
        >
          <Text style={[styles.topTabText, tipoTab === 'proximos' && styles.topTabTextActive]}>Próximos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.topTabBtn, tipoTab === 'historico' && styles.topTabBtnActive]}
          onPress={() => setTipoTab('historico')}
        >
          <Text style={[styles.topTabText, tipoTab === 'historico' && styles.topTabTextActive]}>Histórico</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Faixa da Semana */}
        <View style={styles.weekHeaderRow}>
          <Text style={styles.weekRangeText}>31 de Agosto - 06 de Setembro de 2026</Text>
          <View style={styles.arrowsRow}>
            <TouchableOpacity onPress={() => handleNavegarSemana(-1)} style={styles.arrowPad}>
              <ChevronLeft size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleNavegarSemana(1)} style={styles.arrowPad}>
              <ChevronRight size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pílulas dos Dias */}
        <View style={styles.daysPillRow}>
          {DIAS_SEMANA.map((dia) => {
            const isSelected = dia.dataIso === dataIsoSelecionada;

            return (
              <TouchableOpacity
                key={dia.dataIso}
                onPress={() => !dia.disabled && setDataIsoSelecionada(dia.dataIso)}
                disabled={dia.disabled}
                style={[
                  styles.dayPill,
                  isSelected && styles.dayPillSelected,
                  dia.disabled && styles.dayPillDisabled,
                ]}
              >
                {dia.badge > 0 && (
                  <View style={styles.pillNotificationBadge}>
                    <Text style={styles.badgeCountText}>{dia.badge}</Text>
                  </View>
                )}
                <Text style={[
                  styles.pillSigla,
                  isSelected && styles.pillTextSelected,
                  dia.disabled && styles.pillTextDisabled,
                ]}>{dia.sigla}</Text>
                <Text style={[
                  styles.pillNum,
                  isSelected && styles.pillTextSelected,
                  dia.disabled && styles.pillTextDisabled,
                ]}>{dia.diaNum}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subtítulo da Data Selecionada */}
        <Text variant="titleMedium" style={styles.dateSubTitle}>
          Terça-feira, 01 de Setembro de 2026
        </Text>

        {/* Lista de Linhas */}
        <View style={styles.linhasList}>
          {linhas.map((linha) => (
            <Surface key={linha.id} style={styles.linhaCard} elevation={1}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.linhaInfoCol}>
                  <Text variant="titleMedium" style={styles.linhaTitle}>{linha.nomeLinha}</Text>
                  <Text variant="bodySmall" style={styles.linhaFaculdades}>
                    {linha.faculdades.join(', ')}
                  </Text>
                </View>

                <View style={styles.headerRightCol}>
                  <Text style={styles.horariosText}>{linha.horarioSaida}</Text>
                  <Text style={styles.horariosText}>{linha.horarioVolta}</Text>
                  {renderBadgeStatus(linha.status)}
                </View>
              </View>

              <View style={styles.cardBodyRow}>
                <View style={styles.detailsCol}>
                  {/* Qtd Alunos */}
                  <View style={styles.detailRow}>
                    <Users size={18} color="#191C20" />
                    <Text style={styles.detailText}>{linha.alunosAgendados} alunos agendados</Text>
                  </View>

                  {/* Motorista */}
                  <View style={styles.detailRow}>
                    <User size={18} color={linha.motoristaNome ? '#191C20' : '#BA1A1A'} />
                    <Text style={[styles.detailText, !linha.motoristaNome && styles.alertText]}>
                      {linha.motoristaNome || 'Sem motorista alocado'}
                    </Text>
                  </View>

                  {/* Ônibus */}
                  <View style={styles.detailRow}>
                    <Bus size={18} color={linha.onibusApelido ? '#191C20' : '#BA1A1A'} />
                    <Text style={[styles.detailText, !linha.onibusApelido && styles.alertText]}>
                      {linha.onibusApelido || 'Sem ônibus alocado'}
                    </Text>
                  </View>
                </View>

                {/* Ações da Linha */}
                <View style={styles.actionsCol}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => router.push({
                      pathname: '/(administrador)/logistica/alocar',
                      params: { linhaId: String(linha.id), dataIso: dataIsoSelecionada },
                    } as any)}
                  >
                    <Pencil size={20} color="#191C20" />
                  </TouchableOpacity>

                  {linha.status === 'superlotada' && (
                    <TouchableOpacity
                      style={styles.actionIconBtn}
                      onPress={() => router.push({
                        pathname: '/(administrador)/logistica/excedentes',
                        params: { linhaId: String(linha.id), dataIso: dataIsoSelecionada },
                      } as any)}
                    >
                      <ClipboardList size={20} color="#B00020" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </Surface>
          ))}
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
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 22,
  },
  topTabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  topTabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  topTabBtnActive: {
    borderBottomColor: '#00639A',
  },
  topTabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#74777F',
  },
  topTabTextActive: {
    color: '#00639A',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekRangeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#43474E',
  },
  arrowsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  arrowPad: {
    padding: 4,
  },
  daysPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  dayPill: {
    width: 44,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#E0E2EC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    gap: 4,
  },
  dayPillSelected: {
    backgroundColor: '#C2E7FF',
    borderWidth: 1.5,
    borderColor: '#00639A',
  },
  dayPillDisabled: {
    backgroundColor: '#F1F3F9',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderStyle: 'dashed',
  },
  pillNotificationBadge: {
    position: 'absolute',
    top: -6,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#B00020',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pillSigla: {
    fontSize: 12,
    fontWeight: '500',
    color: '#43474E',
  },
  pillNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#191C20',
  },
  pillTextSelected: {
    color: '#001D36',
  },
  pillTextDisabled: {
    color: '#C4C6CF',
  },
  dateSubTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 20,
    fontSize: 18,
  },
  linhasList: {
    gap: 16,
  },
  linhaCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  linhaInfoCol: {
    flex: 1,
    paddingRight: 12,
  },
  linhaTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginBottom: 4,
  },
  linhaFaculdades: {
    color: '#74777F',
    fontSize: 13,
  },
  headerRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  horariosText: {
    fontSize: 12,
    color: '#43474E',
  },
  badgeContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsCol: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#191C20',
  },
  alertText: {
    color: '#BA1A1A',
  },
  actionsCol: {
    gap: 16,
    alignItems: 'center',
  },
  actionIconBtn: {
    padding: 8,
  },
});
