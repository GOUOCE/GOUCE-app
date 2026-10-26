import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar, Snackbar, Portal } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Building2, ChevronDown, X } from 'lucide-react-native';

import { representanteService, AlunoElegivelItem } from '@/services/representanteService';
import { faculdadeService } from '@/services/faculdadeService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarRepresentanteScreen() {
  const router = useRouter();

  const [instituicao, setInstituicao] = useState('UFC - Campus Quixadá');
  const [faculdadesAtivas, setFaculdadesAtivas] = useState<string[]>([
    'UFC - Campus Quixadá',
    'IFCE - Campus Quixadá',
    'UECE - Campus Quixadá',
  ]);
  const [modalInstVisible, setModalInstVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoElegivelItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Snackbar Toast
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  // Pop-up Estilizado (Confirmação)
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
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
    let isMounted = true;
    faculdadeService.listarFaculdades().then((lista) => {
      if (isMounted && lista && lista.length > 0) {
        const ativas = lista.filter((f) => f.ativo !== false).map((f) => `${f.sigla} - ${f.campus}`);
        if (ativas.length > 0) {
          setFaculdadesAtivas(ativas);
          setInstituicao(ativas[0]);
        }
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;
    representanteService.listarAlunosElegiveis(instituicao, busca).then((lista) => {
      if (isMounted) {
        if (lista.length > 0) {
          setAlunoSelecionado(lista[0]);
        } else {
          setAlunoSelecionado(null);
        }
      }
    }).catch((err) => console.warn('Erro ao carregar alunos elegíveis:', err));

    return () => { isMounted = false; };
  }, [instituicao, busca]);

  const handleTornarRepresentante = () => {
    if (!alunoSelecionado) return;

    showPopup({
      type: 'info',
      title: 'Tornar representante?',
      message: 'O discente terá acesso às funcionalidades atribuídas ao representante, como a frequência de alunos.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        setIsLoading(true);
        try {
          await representanteService.atribuirRepresentante(alunoSelecionado.aluno_id || alunoSelecionado.id);
          setIsLoading(false);
          setSnackbarMessage('Representante atribuído com sucesso');
          setSnackbarVisivel(true);
          setTimeout(() => {
            router.replace('/(administrador)/representantes');
          }, 1200);
        } catch (error: any) {
          setIsLoading(false);
          showPopup({
            type: 'error',
            title: 'Aviso',
            message: error.message || 'Erro ao atribuir representante.',
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const getIniciais = (nome: string) => {
    if (!nome) return 'AL';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Cadastrar Representante</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onDismiss={closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Seletor Instituição de Ensino */}
        <View style={styles.inputBox}>
          <TouchableOpacity activeOpacity={0.7} onPress={() => setModalInstVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                label="Instituição de Ensino *"
                mode="outlined"
                value={instituicao}
                editable={false}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={() => setModalInstVisible(true)} />}
                style={styles.input}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Modal de Seleção de Instituição */}
        <Portal>
          <RNModal visible={modalInstVisible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalInstVisible(false)}>
              <View style={styles.modalSelectContent}>
                <Text variant="titleMedium" style={styles.modalSelectTitle}>Instituição de Ensino</Text>
                {faculdadesAtivas.map((inst) => (
                  <TouchableOpacity
                    key={inst}
                    style={styles.optionItem}
                    onPress={() => { setInstituicao(inst); setModalInstVisible(false); }}
                  >
                    <Text style={[styles.optionText, instituicao === inst && { color: '#3E5F90', fontWeight: 'bold' }]}>
                      {inst}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </RNModal>
        </Portal>

        {/* Busca por Discente */}
        <View style={styles.inputBox}>
          <TextInput
            label="Discente *"
            mode="outlined"
            placeholder="Buscar por nome"
            value={busca}
            onChangeText={setBusca}
            left={<TextInput.Icon icon={() => <Search size={20} color="#666" />} />}
            right={busca ? <TextInput.Icon icon={() => <X size={18} color="#666" />} onPress={() => setBusca('')} /> : undefined}
            style={styles.input}
          />
        </View>

        {/* Card do Discente Selecionado */}
        <Text variant="titleMedium" style={styles.sectionTitle}>Discente selecionado</Text>

        {alunoSelecionado ? (
          <Surface style={styles.discenteCard} elevation={1}>
            <Avatar.Text
              size={90}
              label={getIniciais(alunoSelecionado.nome)}
              style={styles.discenteAvatar}
              labelStyle={styles.avatarLabel}
            />
            <View style={styles.discenteInfo}>
              <Text variant="titleMedium" style={styles.discenteName}>{alunoSelecionado.nome}</Text>

              <Text variant="labelSmall" style={styles.infoLabel}>E-mail</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{alunoSelecionado.email}</Text>

              <Text variant="labelSmall" style={styles.infoLabel}>Instituição de Ensino</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {alunoSelecionado.instituicao} - {alunoSelecionado.campus}
              </Text>

              <Text variant="labelSmall" style={styles.infoLabel}>Curso | Semestre</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>
                {alunoSelecionado.curso} | {alunoSelecionado.periodo_ingresso}
              </Text>
            </View>
          </Surface>
        ) : (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyText}>Nenhum discente aprovado e elegível selecionado.</Text>
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleTornarRepresentante}
          disabled={!alunoSelecionado || isLoading}
          loading={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Tornar representante
        </Button>
      </ScrollView>

      {/* Toast Snackbar */}
      <Snackbar
        visible={snackbarVisivel}
        onDismiss={() => setSnackbarVisivel(false)}
        action={{
          label: '',
          icon: () => <X size={20} color="#fff" />,
          onPress: () => setSnackbarVisivel(false),
        }}
        style={styles.snackbar}
      >
        {snackbarMessage}
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
  inputBox: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  discenteCard: {
    backgroundColor: '#F1F3F9',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  discenteAvatar: {
    backgroundColor: '#E0A96D',
  },
  avatarLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 28,
  },
  discenteInfo: {
    flex: 1,
  },
  discenteName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#666',
    marginTop: 4,
  },
  infoValue: {
    color: '#333',
    fontWeight: '500',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    backgroundColor: '#EAECEF',
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyText: {
    color: '#666',
  },
  saveButton: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  buttonContent: {
    height: 55,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalSelectContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
  },
  modalSelectTitle: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  optionText: {
    color: '#333',
    fontSize: 16,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
