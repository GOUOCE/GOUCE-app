import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Surface, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, Calendar, Filter } from 'lucide-react-native';

import { OpcaoSelect } from '@/services/relatorioService';

const TIPOS_RELATORIO = [
  { label: 'Geral (Consolidado + Motoristas + Trajetos)', value: 'geral' },
  { label: 'Agendamentos e embarques por rota', value: 'agendamentos' },
  { label: 'Alocação e dias trabalhados por motorista', value: 'motoristas' },
];

const FACULDADES_OPCOES = [
  { label: 'Todas as faculdades', value: 'todas' },
  { label: 'UFC - Campus Quixadá', value: '1' },
  { label: 'IFCE - Campus Quixadá', value: '2' },
  { label: 'UECE - FECLEISC Quixadá', value: '3' },
];

const BAIRROS_OPCOES = [
  { label: 'Todos os bairros', value: 'todos' },
  { label: 'Centro', value: '1' },
  { label: 'Campo Novo', value: '2' },
  { label: 'Alto da Brasília', value: '3' },
];

export default function FiltrosRelatorioScreen() {
  const router = useRouter();

  const [tipo, setTipo] = useState('geral');
  const [dataInicial, setDataInicial] = useState('01/09/2026');
  const [dataFinal, setDataFinal] = useState('20/10/2026');
  const [faculdadeId, setFaculdadeId] = useState('todas');
  const [bairroId, setBairroId] = useState('todos');

  const [erroData, setErroData] = useState<string | null>(null);

  // Modal Dropdown
  const [modalPicker, setModalPicker] = useState<{
    visible: boolean;
    title: string;
    options: OpcaoSelect[];
    onSelect: (val: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    onSelect: () => {},
  });

  const abrirPicker = (title: string, options: OpcaoSelect[], onSelect: (val: string) => void) => {
    setModalPicker({ visible: true, title, options, onSelect });
  };

  const getLabelPorValor = (options: OpcaoSelect[], val: string) => {
    const achado = options.find(o => o.value === val);
    return achado ? achado.label : 'Selecionar';
  };

  const converterParaDate = (strData: string) => {
    // Suporta DD/MM/YYYY ou YYYY-MM-DD
    if (strData.includes('/')) {
      const [dia, mes, ano] = strData.split('/').map(Number);
      return new Date(ano, mes - 1, dia);
    }
    if (strData.includes('-')) {
      const [ano, mes, dia] = strData.split('-').map(Number);
      return new Date(ano, mes - 1, dia);
    }
    return new Date();
  };

  const converterParaIso = (strData: string) => {
    if (strData.includes('/')) {
      const [dia, mes, ano] = strData.split('/');
      return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }
    return strData;
  };

  const handleGerarRelatorio = () => {
    setErroData(null);

    const dInicio = converterParaDate(dataInicial);
    const dFim = converterParaDate(dataFinal);

    // Critério 5 / FA-002: Inserir uma data final anterior à data inicial bloqueia o processamento
    if (dFim.getTime() < dInicio.getTime()) {
      setErroData('Data final não pode ser anterior à data inicial');
      return;
    }

    router.push({
      pathname: '/(administrador)/relatorios/resultado',
      params: {
        tipo,
        dataInicial: converterParaIso(dataInicial),
        dataFinal: converterParaIso(dataFinal),
        faculdadeId,
        bairroId,
      },
    } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Relatórios</Text>
      </View>

      {/* Modal Dropdown Picker */}
      <Modal visible={modalPicker.visible} transparent animationType="fade" onRequestClose={() => setModalPicker(prev => ({ ...prev, visible: false }))}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalPicker(prev => ({ ...prev, visible: false }))}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>{modalPicker.title}</Text>
            {modalPicker.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  modalPicker.onSelect(opt.value);
                  setModalPicker(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="headlineSmall" style={styles.pageTitle}>Relatório Quantitativo</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Selecione o tipo de relatório e os parâmetros de filtro desejados para gerar a análise consolidada.
        </Text>

        {/* Tipo de Relatório */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Tipo de Relatório *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => abrirPicker('Selecione o Tipo de Relatório', TIPOS_RELATORIO, setTipo)}
          >
            <View style={styles.selectLeftRow}>
              <Filter size={20} color="#191C20" />
              <Text style={styles.selectText} numberOfLines={1}>{getLabelPorValor(TIPOS_RELATORIO, tipo)}</Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Período de Datas (Data Inicial e Data Final) */}
        <View style={styles.datesRow}>
          <View style={styles.dateCol}>
            <Text variant="labelMedium" style={styles.inputLabel}>Data Inicial *</Text>
            <TextInput
              mode="outlined"
              value={dataInicial}
              onChangeText={(text) => { setDataInicial(text); setErroData(null); }}
              placeholder="01/09/2026"
              style={styles.dateInput}
              outlineColor={erroData ? '#BA1A1A' : '#74777F'}
              activeOutlineColor={erroData ? '#BA1A1A' : '#3E5F90'}
              left={<TextInput.Icon icon={() => <Calendar size={18} color="#666" />} />}
            />
          </View>

          <View style={styles.dateCol}>
            <Text variant="labelMedium" style={styles.inputLabel}>Data Final *</Text>
            <TextInput
              mode="outlined"
              value={dataFinal}
              onChangeText={(text) => { setDataFinal(text); setErroData(null); }}
              placeholder="20/10/2026"
              style={styles.dateInput}
              outlineColor={erroData ? '#BA1A1A' : '#74777F'}
              activeOutlineColor={erroData ? '#BA1A1A' : '#3E5F90'}
              left={<TextInput.Icon icon={() => <Calendar size={18} color="#666" />} />}
            />
          </View>
        </View>

        {/* Erro de Data Final Anterior à Inicial (Critério 5 / FA-002) */}
        {erroData && (
          <Text style={styles.errorTextDate}>{erroData}</Text>
        )}

        {/* Faculdade (IES) */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Faculdade (IES) *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => abrirPicker('Selecione a Faculdade', FACULDADES_OPCOES, setFaculdadeId)}
          >
            <Text style={styles.selectText}>{getLabelPorValor(FACULDADES_OPCOES, faculdadeId)}</Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Localidade / Bairro */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Localidade / Bairro *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => abrirPicker('Selecione o Bairro', BAIRROS_OPCOES, setBairroId)}
          >
            <Text style={styles.selectText}>{getLabelPorValor(BAIRROS_OPCOES, bairroId)}</Text>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Botão Gerar Relatório */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleGerarRelatorio}
            style={styles.btnGerar}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
          >
            Gerar Relatório
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
    marginBottom: 16,
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
  pageTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 22,
    marginBottom: 8,
  },
  subtitle: {
    color: '#43474E',
    lineHeight: 20,
    marginBottom: 24,
  },
  inputBox: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#43474E',
    marginBottom: 6,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 8,
  },
  selectLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  selectText: {
    fontSize: 15,
    color: '#191C20',
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateCol: {
    width: '48%',
  },
  dateInput: {
    backgroundColor: '#FFF',
  },
  errorTextDate: {
    color: '#BA1A1A',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 4,
  },
  actionContainer: {
    marginTop: 28,
  },
  btnGerar: {
    borderRadius: 8,
  },
  btnContent: {
    height: 52,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 16,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
  },
  optionText: {
    fontSize: 16,
    color: '#191C20',
  },
});
