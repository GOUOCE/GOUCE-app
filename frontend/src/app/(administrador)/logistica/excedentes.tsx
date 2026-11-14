import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Surface, Checkbox, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, Bus } from 'lucide-react-native';

import { logisticaService, AlunoExcedente, OpcaoSelect } from '@/services/logisticaService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function RealocarExcedentesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linhaId?: string; dataIso?: string }>();

  const linhaId = params.linhaId || '3';
  const dataIso = params.dataIso || '2026-09-02';

  const [alunos, setAlunos] = useState<AlunoExcedente[]>([]);
  const [onibusDestinoId, setOnibusDestinoId] = useState<string>('201');
  const [onibusOptions, setOnibusOptions] = useState<OpcaoSelect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modal Dropdown
  const [modalPickerVisible, setModalPickerVisible] = useState(false);

  // AppPopup de Confirmação
  const [modalConfirmarVisible, setModalConfirmarVisible] = useState(false);

  // AppPopup de Resultado (Sucesso/Erro)
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

  const carregarExcedentes = useCallback(async () => {
    const list = await logisticaService.listarAlunosExcedentes(linhaId, dataIso);
    setAlunos(list);

    const opts = await logisticaService.obterOpcoesAlocacao(linhaId, dataIso);
    setOnibusOptions(opts.onibusOptions || []);
  }, [linhaId, dataIso]);

  useEffect(() => {
    carregarExcedentes();
  }, [carregarExcedentes]);

  const toggleAluno = (id: number | string) => {
    setAlunos(prev => prev.map(a => a.id === id ? { ...a, selecionado: !a.selecionado } : a));
  };

  const alunosSelecionados = alunos.filter(a => a.selecionado);

  const getLabelOnibus = (val: string) => {
    const achado = onibusOptions.find(o => o.value === val);
    return achado ? achado.label : 'Ônibus 07 (28 vagas)';
  };

  const handleIniciarRealocacao = () => {
    if (alunosSelecionados.length === 0) {
      setPopupResultado({
        visible: true,
        type: 'warning',
        title: 'Nenhum Aluno Selecionado',
        message: 'Selecione ao menos um aluno para realizar a realocação.',
      });
      return;
    }
    setModalConfirmarVisible(true);
  };

  const handleConfirmarRealocacao = async () => {
    setModalConfirmarVisible(false);
    setIsLoading(true);

    try {
      await logisticaService.confirmarRealocacao({
        linhaOrigemId: linhaId,
        dataIso,
        onibusDestinoId,
        alunosIds: alunosSelecionados.map(a => a.id),
      });

      setPopupResultado({
        visible: true,
        type: 'success',
        title: 'Realocação Confirmada',
        message: 'Realocação confirmada com sucesso.',
      });
    } catch {
      setPopupResultado({
        visible: true,
        type: 'error',
        title: 'Erro na Realocação',
        message: 'Não foi possível confirmar a realocação. Verifique a conexão e tente novamente.',
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
          <Text variant="headlineSmall" style={styles.headerTitle}>Alunos Excedentes</Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>02/09/2026</Text>
        </View>
      </View>

      {/* Pop-up de Confirmação */}
      <AppPopup
        visible={modalConfirmarVisible}
        type="warning"
        title="Confirmar realocação dos alunos?"
        message={`Os ${alunosSelecionados.length} alunos da Linha 03 - Vila Antiga serão realocados para o ônibus 07 atribuído à Linha 02 - Bairro Novo.`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarRealocacao}
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
      <Modal visible={modalPickerVisible} transparent animationType="fade" onRequestClose={() => setModalPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalPickerVisible(false)}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>Selecione o Ônibus de Destino</Text>
            {onibusOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  setOnibusDestinoId(opt.value);
                  setModalPickerVisible(false);
                }}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Descrição Superior */}
        <Text variant="bodyMedium" style={styles.descriptionText}>
          3 alunos da Linha 03 - Vila Antiga ultrapassam a capacidade do ônibus 12. Selecione o ônibus de destino ou mantenha em pé.
        </Text>

        {/* Lista de Alunos com Checkboxes */}
        <View style={styles.alunosList}>
          {alunos.map((aluno) => (
            <Surface key={aluno.id} style={styles.alunoCard} elevation={0}>
              <View style={styles.alunoRow}>
                <Avatar.Text size={42} label={aluno.iniciais} style={styles.avatarBg} labelStyle={styles.avatarLabel} />
                <View style={styles.alunoTextCol}>
                  <Text variant="titleMedium" style={styles.alunoNome}>{aluno.nome}</Text>
                  <Text variant="bodySmall" style={styles.alunoTrajeto}>{aluno.trajetoText}</Text>
                </View>
                <Checkbox
                  status={aluno.selecionado ? 'checked' : 'unchecked'}
                  onPress={() => toggleAluno(aluno.id)}
                  color="#00639A"
                />
              </View>
            </Surface>
          ))}
        </View>

        {/* Seção Realocar Para */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Realocar para:</Text>
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Ônibus Vinculado *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setModalPickerVisible(true)}
          >
            <View style={styles.selectLeftRow}>
              <Bus size={20} color="#191C20" />
              <Text style={styles.selectText}>{getLabelOnibus(onibusDestinoId)}</Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>

          <Text style={styles.vinculoNotice}>
            Este ônibus atualmente está vinculado à Linha 02 - Bairro Novo.
          </Text>
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.btnManterEmPe}
            contentStyle={styles.btnContent}
            textColor="#00639A"
          >
            Manter em pé no Ônibus 12
          </Button>

          <Button
            mode="contained"
            onPress={handleIniciarRealocacao}
            loading={isLoading}
            disabled={isLoading}
            style={styles.btnConfirmarRealocacao}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
          >
            Confirmar realocação
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
  descriptionText: {
    color: '#43474E',
    lineHeight: 20,
    marginBottom: 20,
  },
  alunosList: {
    gap: 12,
    marginBottom: 28,
  },
  alunoCard: {
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingVertical: 12,
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBg: {
    backgroundColor: '#3E5F90',
  },
  avatarLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alunoTextCol: {
    flex: 1,
  },
  alunoNome: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 16,
  },
  alunoTrajeto: {
    color: '#74777F',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 12,
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
  vinculoNotice: {
    fontSize: 12,
    color: '#74777F',
    marginTop: 8,
  },
  actionsContainer: {
    marginTop: 24,
    gap: 12,
  },
  btnManterEmPe: {
    borderRadius: 24,
    borderColor: '#00639A',
  },
  btnConfirmarRealocacao: {
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
