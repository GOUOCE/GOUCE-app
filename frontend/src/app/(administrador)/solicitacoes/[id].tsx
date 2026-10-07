import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, Surface, Avatar, Button, TextInput, Snackbar, Portal } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, ExternalLink, X, CheckSquare, Square } from 'lucide-react-native';

import { solicitacaoService, DetalhesSolicitacaoItem } from '@/services/solicitacaoService';
import { useAuth } from '@contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { api } from '@/api/api';

export default function AnalisarSolicitacaoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [aluno, setAluno] = useState<DetalhesSolicitacaoItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modais de Aprovação e Reprovação
  const [modalAprovarVisible, setModalAprovarVisible] = useState(false);
  const [modalReprovarVisible, setModalReprovarVisible] = useState(false);

  // Campos de recusa
  const [docMatriculaChecked, setDocMatriculaChecked] = useState(false);
  const [docResidenciaChecked, setDocResidenciaChecked] = useState(false);
  const [docFotoChecked, setDocFotoChecked] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [erroMotivo, setErroMotivo] = useState(false);

  // Toast / Snackbar
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showPopup = (config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    async function carregarDetalhes() {
      if (!id) return;
      setIsLoading(true);
      try {
        const dados = await solicitacaoService.obterDetalhes(Number(id));
        setAluno(dados);
      } catch (error: any) {
        const msg = getErrorMessage(error, 'Erro ao carregar detalhes do aluno.');
        showPopup({
          type: 'error',
          title: 'Erro',
          message: msg,
          confirmText: 'Voltar',
          onConfirm: () => { closePopup(); router.back(); },
        });
      } finally {
        setIsLoading(false);
      }
    }
    carregarDetalhes();
  }, [id, router]);

  const handleAprovar = async () => {
    setModalAprovarVisible(false);
    setIsLoading(true);
    try {
      await solicitacaoService.aprovarSolicitacao(Number(id));
      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Solicitação Aprovada',
        message: 'O cadastro do aluno foi aprovado com sucesso!',
        confirmText: 'Voltar à Fila',
        onConfirm: () => {
          closePopup();
          router.replace('/(administrador)/solicitacoes');
        },
      });
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao aprovar cadastro.');
      showPopup({
        type: 'error',
        title: 'Falha na Aprovação',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  const handleReprovar = async () => {
    if (!motivoRecusa || motivoRecusa.trim().length < 5) {
      setErroMotivo(true);
      return;
    }
    setErroMotivo(false);
    setModalReprovarVisible(false);
    setIsLoading(true);

    const documentosReenvio: { tipo: string; motivo: string }[] = [];
    if (docMatriculaChecked) documentosReenvio.push({ tipo: 'comprovante_matricula', motivo: motivoRecusa });
    if (docResidenciaChecked) documentosReenvio.push({ tipo: 'comprovante_residencia', motivo: motivoRecusa });
    if (docFotoChecked) documentosReenvio.push({ tipo: 'foto_perfil', motivo: motivoRecusa });

    if (documentosReenvio.length === 0) {
      documentosReenvio.push({ tipo: 'comprovante_matricula', motivo: motivoRecusa });
    }

    try {
      await solicitacaoService.reprovarSolicitacao(Number(id), motivoRecusa, documentosReenvio);
      setIsLoading(false);
      showPopup({
        type: 'success',
        title: 'Solicitação Recusada',
        message: 'A solicitação foi recusada com sucesso e o aluno foi notificado para ajuste.',
        confirmText: 'Voltar à Fila',
        onConfirm: () => {
          closePopup();
          router.replace('/(administrador)/solicitacoes');
        },
      });
    } catch (error: any) {
      setIsLoading(false);
      const msg = getErrorMessage(error, 'Erro ao reprovar cadastro.');
      showPopup({
        type: 'error',
        title: 'Falha na Reprovação',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  };

  const baseUrl = api.defaults.baseURL || 'http://192.168.0.4:8000';
  const idFoto = aluno?.id_foto_aluno;
  const fotoUri = idFoto
    ? (idFoto.startsWith('http')
        ? idFoto
        : `${baseUrl}/arquivos/${idFoto}/view?token=${token || ''}`)
    : null;

  const imageSource = fotoUri
    ? {
        uri: fotoUri,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': 'true',
        },
      }
    : { uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop' };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Analisar Solicitação</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        onConfirm={popup.onConfirm}
        onDismiss={closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Foto e Status */}
        <View style={styles.profileSection}>
          <Avatar.Image size={110} source={imageSource} style={styles.avatar} />
          <Text variant="titleLarge" style={styles.userName}>{aluno?.nome || 'Carregando...'}</Text>
          <Surface style={styles.statusBadge} elevation={0}>
            <Text style={styles.statusText}>Pendente: vínculo em análise</Text>
          </Surface>
        </View>

        {/* Dados Informados */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Dados Informados</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>E-mail</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.email || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Telefone (WhatsApp)</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.telefone || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Instituição - Campus</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {aluno?.faculdade_id || 'UFC'} - {aluno?.campus || 'Quixadá'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Curso</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.curso || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Período de Ingresso</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.periodo_ingresso || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Turno</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.turno_curso || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Data de Nascimento</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.data_nascimento || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Bairro</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{aluno?.bairro_id || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Documentos Anexados */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Documentos Anexados</Text>
          <View style={styles.docsGrid}>
            <Surface style={styles.docCard} elevation={1}>
              <ExternalLink size={20} color="#3E5F90" style={styles.docIcon} />
              <Text variant="bodyMedium" style={styles.docTitle}>Comprovante de Matrícula</Text>
            </Surface>
            <Surface style={styles.docCard} elevation={1}>
              <ExternalLink size={20} color="#3E5F90" style={styles.docIcon} />
              <Text variant="bodyMedium" style={styles.docTitle}>Comprovante de Residência</Text>
            </Surface>
          </View>
        </View>

        {/* Botões de Ação */}
        <View style={styles.actionButtonsBox}>
          <TouchableOpacity onPress={() => setModalReprovarVisible(true)}>
            <Text style={styles.reprovarText}>Reprovar cadastro</Text>
          </TouchableOpacity>

          <Button
            mode="contained"
            onPress={() => setModalAprovarVisible(true)}
            loading={isLoading}
            disabled={isLoading}
            style={styles.aprovarButton}
            contentStyle={styles.btnContent}
          >
            Aprovar cadastro
          </Button>
        </View>
      </ScrollView>

      {/* Modal de Confirmação de Aprovação */}
      <Portal>
        <RNModal visible={modalAprovarVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Aprovar cadastro?</Text>
              <Text variant="bodyLarge" style={styles.modalText}>Essa ação não poderá ser desfeita.</Text>
              <View style={styles.modalButtons}>
                <Button mode="text" onPress={() => setModalAprovarVisible(false)} style={styles.modalBtn}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleAprovar} style={[styles.modalBtn, { backgroundColor: '#3E5F90' }]}>
                  Confirmar
                </Button>
              </View>
            </View>
          </View>
        </RNModal>
      </Portal>

      {/* Modal de Detalhar Recusa / Reprovação */}
      <Portal>
        <RNModal visible={modalReprovarVisible} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { maxHeight: '90%' }]}>
              <Text variant="headlineSmall" style={styles.modalTitle}>Detalhar Recusa</Text>
              <Text variant="bodySmall" style={{ color: '#666', marginBottom: 16 }}>
                Selecione quais partes apresentaram inconsistências e informe o motivo.
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setDocMatriculaChecked(!docMatriculaChecked)}>
                  {docMatriculaChecked ? <CheckSquare size={22} color="#3E5F90" /> : <Square size={22} color="#666" />}
                  <Text style={styles.checkboxLabel}>Comprovante de Matrícula</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setDocResidenciaChecked(!docResidenciaChecked)}>
                  {docResidenciaChecked ? <CheckSquare size={22} color="#3E5F90" /> : <Square size={22} color="#666" />}
                  <Text style={styles.checkboxLabel}>Comprovante de Residência</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.checkboxRow} onPress={() => setDocFotoChecked(!docFotoChecked)}>
                  {docFotoChecked ? <CheckSquare size={22} color="#3E5F90" /> : <Square size={22} color="#666" />}
                  <Text style={styles.checkboxLabel}>Foto de Perfil</Text>
                </TouchableOpacity>

                <View style={{ marginTop: 16 }}>
                  <TextInput
                    label="Motivo da recusa *"
                    mode="outlined"
                    placeholder="ex.: Documento ilegível ou desatualizado."
                    value={motivoRecusa}
                    onChangeText={setMotivoRecusa}
                    multiline
                    numberOfLines={3}
                    error={erroMotivo}
                    style={{ backgroundColor: '#fff' }}
                  />
                  {erroMotivo && <Text style={styles.errorText}>Informe um motivo com pelo menos 5 caracteres.</Text>}
                </View>
              </ScrollView>

              <View style={[styles.modalButtons, { marginTop: 24 }]}>
                <Button mode="text" onPress={() => setModalReprovarVisible(false)} style={styles.modalBtn}>
                  Cancelar
                </Button>
                <Button mode="contained" onPress={handleReprovar} style={[styles.modalBtn, { backgroundColor: '#B00020' }]}>
                  Reprovar cadastro
                </Button>
              </View>
            </View>
          </View>
        </RNModal>
      </Portal>

      {/* Toast Snackbar */}
      <Snackbar
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
        action={{
          label: '',
          icon: () => <X size={20} color="#fff" />,
          onPress: () => setToastVisible(false),
        }}
        style={styles.snackbar}
      >
        {toastMessage}
      </Snackbar>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#E3EFFF',
  },
  userName: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    marginTop: 8,
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#E65100',
    fontWeight: '600',
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 16,
  },
  infoLabel: {
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    color: '#333',
    fontWeight: '500',
  },
  docsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  docCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E2EC',
  },
  docIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  docTitle: {
    textAlign: 'center',
    color: '#333',
    fontSize: 12,
    marginTop: 12,
  },
  actionButtonsBox: {
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
  },
  reprovarText: {
    color: '#B00020',
    fontWeight: 'bold',
    fontSize: 16,
    paddingVertical: 8,
  },
  aprovarButton: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  btnContent: {
    height: 55,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalText: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    borderRadius: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  checkboxLabel: {
    color: '#333',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
