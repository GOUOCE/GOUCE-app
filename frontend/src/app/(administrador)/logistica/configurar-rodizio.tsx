import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronDown, Bus, RefreshCcw, RefreshCw } from 'lucide-react-native';

import { rodizioService, PadraoRodizioResponse, OpcaoSelect } from '@/services/rodizioService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function ConfigurarRodizioScreen() {
  const router = useRouter();

  const [proximaRotaId, setProximaRotaId] = useState<string>('2');
  const [opcoesRotas, setOpcoesRotas] = useState<OpcaoSelect[]>([]);
  const [previa, setPrevia] = useState<PadraoRodizioResponse | null>(null);
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

  useEffect(() => {
    carregarOpcoesEPrevia();
  }, [proximaRotaId]);

  const carregarOpcoesEPrevia = async () => {
    const opts = await rodizioService.obterOpcoesAlternancia();
    setOpcoesRotas(opts.rotasDisponiveis || []);

    const prev = await rodizioService.gerarPreviaRodizio('204', proximaRotaId);
    setPrevia(prev);
  };

  const getLabelRota = (val: string) => {
    const achado = opcoesRotas.find(r => r.value === val);
    return achado ? achado.label : 'Linha 02 - Bairro Novo';
  };

  const handleIniciarSalvar = () => {
    setModalConfirmarVisible(true);
  };

  const handleConfirmarSalvar = async () => {
    setModalConfirmarVisible(false);
    setIsLoading(true);

    try {
      await rodizioService.salvarPadraoRodizio({
        onibusId: '204',
        proximaRotaId,
        dataInicioIso: '2026-09-07',
      });

      setPopupResultado({
        visible: true,
        type: 'success',
        title: 'Rodízio Confirmado',
        message: 'Rodízio de frota confirmado com sucesso.',
      });
    } catch {
      setPopupResultado({
        visible: true,
        type: 'error',
        title: 'Erro no Rodízio',
        message: 'Não foi possível salvar o padrão de rodízio. Tente novamente.',
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Configurar Rodízio</Text>
      </View>

      {/* Pop-up de Confirmação */}
      <AppPopup
        visible={modalConfirmarVisible}
        type="warning"
        title="Confirmar rodízio de frota?"
        message="As novas rotas serão aplicadas a toda a frota a partir de 07/09/2026. Esta ação atualizará as alocações diárias automáticas."
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarSalvar}
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
            <Text variant="titleMedium" style={styles.modalTitle}>Selecione a Próxima Rota</Text>
            {opcoesRotas.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  setProximaRotaId(opt.value);
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
        {/* Título & Descrição */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Configurar alternância</Text>
        <Text variant="bodyMedium" style={styles.descriptionText}>
          Defina a rota do primeiro veículo para girar o restante da frota automaticamente.
        </Text>

        {/* Dropdown Field */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.inputLabel}>Ônibus 04 ➔ próxima rota *</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() => setModalPickerVisible(true)}
          >
            <View style={styles.selectLeftRow}>
              <RefreshCw size={20} color="#191C20" />
              <Text style={styles.selectText}>{getLabelRota(proximaRotaId)}</Text>
            </View>
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Prévia do Novo Ciclo */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Prévia do novo ciclo (ativo a partir de 07/09)
        </Text>

        {/* Alerta de Capacidade Dotted Badge */}
        <Surface style={styles.alertNoticeBadge} elevation={0}>
          <Text style={styles.alertNoticeText}>
            {previa?.totalVeiculos || 3} veículos no ciclo • {previa?.alertaTotal || 1} alerta de capacidade na prévia
          </Text>
        </Surface>

        {/* Lista da Prévia */}
        <View style={styles.previaList}>
          {previa?.itens.map((item, idx) => (
            <Surface key={item.onibusId || idx} style={styles.itemCard} elevation={0}>
              <View style={styles.itemRow}>
                <View style={styles.iconBox}>
                  <Bus size={24} color="#191C20" />
                </View>
                <View style={styles.textCol}>
                  <View style={styles.onibusHeaderRow}>
                    <Text variant="titleMedium" style={styles.onibusTitle}>{item.onibusApelido}</Text>
                    {item.alertaCapacidade && (
                      <Text style={styles.alertaTextCard}>
                        Atenção: capacidade (sentado+em pé) pode não atender
                      </Text>
                    )}
                  </View>
                  <Text variant="bodySmall" style={styles.rotaText}>
                    De: {item.rotaAtualNome} ➔ Para: {item.proximaRotaNome}
                  </Text>
                </View>
              </View>
            </Surface>
          ))}
        </View>

        {/* Botão Salvar Padrão */}
        <View style={styles.actionContainer}>
          <Button
            mode="contained"
            onPress={handleIniciarSalvar}
            loading={isLoading}
            disabled={isLoading}
            style={styles.btnSalvar}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
            icon={() => <RefreshCcw size={20} color="#FFF" />}
          >
            Salvar novo padrão de rodízio
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
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginBottom: 8,
  },
  descriptionText: {
    color: '#43474E',
    lineHeight: 20,
    marginBottom: 20,
  },
  inputBox: {
    marginBottom: 28,
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
  alertNoticeBadge: {
    borderWidth: 1.5,
    borderColor: '#B5651D',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFF8F0',
  },
  alertNoticeText: {
    color: '#8A5200',
    fontWeight: 'bold',
    fontSize: 13,
  },
  previaList: {
    gap: 12,
    marginBottom: 36,
  },
  itemCard: {
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  iconBox: {
    width: 32,
    paddingTop: 2,
    alignItems: 'center',
  },
  textCol: {
    flex: 1,
  },
  onibusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  onibusTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 16,
  },
  alertaTextCard: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#8B261D',
    maxWidth: '55%',
    textAlign: 'right',
  },
  rotaText: {
    color: '#43474E',
    fontSize: 13,
  },
  actionContainer: {
    marginTop: 12,
  },
  btnSalvar: {
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
    flexDirection: 'row',
    gap: 8,
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
