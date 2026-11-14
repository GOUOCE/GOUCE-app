import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, Bus, User } from 'lucide-react-native';

import { logisticaService, OpcaoSelect } from '@/services/logisticaService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function AlocarRotaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linhaId?: string; dataIso?: string }>();

  const linhaId = params.linhaId || '1';
  const dataIso = params.dataIso || '2026-09-02';

  const [onibusId, setOnibusId] = useState<string>('');
  const [motoristaId, setMotoristaId] = useState<string>('');

  const [opcoes, setOpcoes] = useState<{ onibusOptions: OpcaoSelect[]; motoristaOptions: OpcaoSelect[] }>({
    onibusOptions: [],
    motoristaOptions: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  // Modais de Dropdown Picker
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

  // Modal de Confirmação AppPopup (HU-016 / HU-017)
  const [modalConfirmarVisible, setModalConfirmarVisible] = useState(false);

  // Modal de Resultado (Sucesso/Erro)
  const [popupResultado, setPopupResultado] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    carregarOpcoes();
  }, [linhaId, dataIso]);

  const carregarOpcoes = async () => {
    const res = await logisticaService.obterOpcoesAlocacao(linhaId, dataIso);
    setOpcoes(res);
  };

  const abrirPicker = (title: string, options: OpcaoSelect[], onSelect: (val: string) => void) => {
    setModalPicker({ visible: true, title, options, onSelect });
  };

  const getLabelPorValor = (options: OpcaoSelect[], val: string) => {
    if (!val) return 'Selecionar';
    const achado = options.find(o => o.value === val);
    return achado ? achado.label : 'Selecionar';
  };

  const isLinhaSuperlotada = linhaId === '3';
  const qtdAlunos = isLinhaSuperlotada ? 53 : 38;
  const sentados = isLinhaSuperlotada ? 42 : 32;
  const emPe = isLinhaSuperlotada ? 11 : 6;
  const maxSentados = isLinhaSuperlotada ? 42 : 42;
  const maxEmPe = 8;

  const estaDentroDaCapacidade = emPe <= maxEmPe;

  const handleIniciarAlocacao = () => {
    if (!onibusId || !motoristaId) {
      setPopupResultado({
        visible: true,
        type: 'warning',
        title: 'Campos Obrigatórios',
        message: 'Por favor, selecione um ônibus e um motorista para confirmar a alocação.',
      });
      return;
    }
    setModalConfirmarVisible(true);
  };

  const handleConfirmarAlocacao = async () => {
    setModalConfirmarVisible(false);
    setIsLoading(true);

    try {
      await logisticaService.confirmarAlocacao({
        linhaId,
        dataIso,
        onibusId,
        motoristaId,
      });

      setPopupResultado({
        visible: true,
        type: 'success',
        title: 'Alocação Confirmada',
        message: 'Alocação confirmada com sucesso.',
      });
    } catch {
      setPopupResultado({
        visible: true,
        type: 'error',
        title: 'Erro na Alocação',
        message: 'Não foi possível confirmar a alocação. Verifique os dados e tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {linhaId === '3' ? 'Linha 03 - Vila Antiga' : 'Linha 01 - Centro'}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            02/09/2026 • UFC, Católica, UECE
          </Text>
        </View>
      </View>

      {/* Pop-up de Confirmação */}
      <AppPopup
        visible={modalConfirmarVisible}
        type="warning"
        title="Confirmar alocação?"
        message={`O motorista e o ônibus serão associados à esta rota (Linha ${linhaId}) em 02/09/2026 com ${qtdAlunos} alunos alocados atualmente.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarAlocacao}
        onDismiss={() => setModalConfirmarVisible(false)}
      />

      {/* Pop-up de Resultado */}
      <AppPopup
        visible={popupResultado.visible}
        type={popupResultado.type}
        title={popupResultado.title}
        message={popupResultado.message}
        confirmText="Entendido"
        onConfirm={() => {
          setPopupResultado(prev => ({ ...prev, visible: false }));
          if (popupResultado.type === 'success') {
            router.back();
          }
        }}
        onDismiss={() => setPopupResultado(prev => ({ ...prev, visible: false }))}
      />

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
        {/* Campo Ônibus Vinculado */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Ônibus Vinculado *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => abrirPicker('Selecione o Ônibus', opcoes.onibusOptions, setOnibusId)}
          >
            <View style={styles.selectLeftRow}>
              <Bus size={20} color="#191C20" />
              <Text style={styles.selectText}>{getLabelPorValor(opcoes.onibusOptions, onibusId)}</Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>

          {/* Aviso do Rodízio de Frotas (HU-016) */}
          <Text style={styles.rodizioNotice}>
            Caso o ônibus mude de rota mesmo sendo associado à outra no <Text style={{ fontWeight: 'bold' }}>rodízio de frotas</Text>, ele será alterado apenas para esse dia em específico e voltará para a rota designada no rodízio no dia seguinte.
          </Text>
        </View>

        {/* Campo Motorista */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Motorista *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => abrirPicker('Selecione o Motorista', opcoes.motoristaOptions, setMotoristaId)}
          >
            <View style={styles.selectLeftRow}>
              <User size={20} color="#191C20" />
              <Text style={styles.selectText}>{getLabelPorValor(opcoes.motoristaOptions, motoristaId)}</Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Prévia da Distribuição */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Prévia da distribuição</Text>
        <Surface style={styles.previewCard} elevation={0}>
          <Text variant="titleMedium" style={[styles.previaQtdTitle, !estaDentroDaCapacidade && styles.previaAlertText]}>
            {qtdAlunos} alunos alocados
          </Text>

          <View style={styles.previewGridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Quantidade Atual</Text>
              <Text style={styles.gridValue}>{sentados} sentados + {emPe} em pé</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Capacidade Máxima</Text>
              <Text style={styles.gridValue}>{maxSentados} sentados + {maxEmPe} em pé</Text>
            </View>
          </View>

          <View style={styles.previewGridRow}>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Horário de Saída</Text>
              <Text style={styles.gridValue}>06:40</Text>
            </View>
            <View style={styles.gridCol}>
              <Text style={styles.gridLabel}>Horário de Volta</Text>
              <Text style={styles.gridValue}>17:40</Text>
            </View>
          </View>

          {/* Status Tag */}
          <Text style={[styles.capacityTag, estaDentroDaCapacidade ? styles.capacityOk : styles.capacityOver]}>
            {estaDentroDaCapacidade ? 'Dentro da Capacidade' : 'Fora da Capacidade'}
          </Text>
        </Surface>

        {/* Botões de Ação */}
        <View style={styles.actionsContainer}>
          {!estaDentroDaCapacidade && (
            <Button
              mode="outlined"
              onPress={() => router.push({
                pathname: '/(administrador)/logistica/excedentes',
                params: { linhaId, dataIso },
              } as any)}
              style={styles.btnRealocar}
              contentStyle={styles.btnContent}
              textColor="#00639A"
            >
              Realocar alunos excedentes
            </Button>
          )}

          <Button
            mode="contained"
            onPress={handleIniciarAlocacao}
            loading={isLoading}
            disabled={isLoading}
            style={styles.btnConfirmar}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
          >
            Confirmar alocação
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
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 20,
  },
  headerSubtitle: {
    color: '#74777F',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  },
  selectText: {
    fontSize: 15,
    color: '#191C20',
  },
  rodizioNotice: {
    fontSize: 12,
    color: '#43474E',
    marginTop: 8,
    lineHeight: 18,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginTop: 8,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  previaQtdTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
  },
  previaAlertText: {
    color: '#8B261D',
  },
  previewGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridCol: {
    width: '48%',
  },
  gridLabel: {
    fontSize: 12,
    color: '#74777F',
    marginBottom: 2,
  },
  gridValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#191C20',
  },
  capacityTag: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 4,
  },
  capacityOk: {
    color: '#00639A',
  },
  capacityOver: {
    color: '#8B261D',
  },
  actionsContainer: {
    marginTop: 32,
    gap: 12,
  },
  btnRealocar: {
    borderRadius: 24,
    borderColor: '#00639A',
  },
  btnConfirmar: {
    borderRadius: 24,
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
