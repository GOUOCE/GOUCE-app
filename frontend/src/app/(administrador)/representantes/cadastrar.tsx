import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar, Portal } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Search, Building2, ChevronDown, X } from 'lucide-react-native';

import { representanteService, AlunoElegivelItem } from '@/services/representanteService';
import { faculdadeService, FaculdadeItem } from '@/services/faculdadeService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarRepresentanteScreen() {
  const router = useRouter();

  const [faculdades, setFaculdades] = useState<FaculdadeItem[]>([]);
  const [instituicaoSelecionadaId, setInstituicaoSelecionadaId] = useState<number | null>(null);
  const [instituicaoTexto, setInstituicaoTexto] = useState('Selecione uma instituição');
  const [modalInstVisible, setModalInstVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoElegivelItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pop-up Estilizado (Confirmação)
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
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

  // Reseta estado ao focar/desfocar a tela para evitar dados residuais
  useFocusEffect(
    React.useCallback(() => {
      setFaculdades([]);
      setInstituicaoSelecionadaId(null);
      setInstituicaoTexto('Selecione uma instituição');
      setBusca('');
      setAlunoSelecionado(null);

      faculdadeService.listarFaculdades().then((lista) => {
        const ativas = lista.filter((f) => f.ativo !== false);
        setFaculdades(ativas);
        if (ativas.length > 0) {
          setInstituicaoSelecionadaId(ativas[0].id);
          setInstituicaoTexto(`${ativas[0].sigla} - ${ativas[0].campus}`);
        }
      }).catch((err) => {
        const msg = getErrorMessage(err, 'Erro ao carregar faculdades.');
        showPopup({
          type: 'error',
          title: 'Erro de Conexão',
          message: msg,
          confirmText: 'Entendido',
        });
      });

      return () => {
        setFaculdades([]);
        setInstituicaoSelecionadaId(null);
        setInstituicaoTexto('Selecione uma instituição');
        setBusca('');
        setAlunoSelecionado(null);
      };
    }, [])
  );

  useEffect(() => {
    if (!instituicaoSelecionadaId) return;
    let isMounted = true;
    representanteService.listarAlunosElegiveis(instituicaoTexto, busca).then((lista) => {
      if (isMounted) {
        if (lista.length > 0) {
          setAlunoSelecionado(lista[0]);
        } else {
          setAlunoSelecionado(null);
        }
      }
    }).catch((err) => {
      const msg = getErrorMessage(err, 'Erro ao carregar discentes elegíveis.');
      console.warn(msg);
    });

    return () => { isMounted = false; };
  }, [instituicaoSelecionadaId, instituicaoTexto, busca]);

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/representantes');
  };

  const handleTornarRepresentante = () => {
    if (!alunoSelecionado || !instituicaoSelecionadaId) return;

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
          await representanteService.atribuirRepresentante(
            alunoSelecionado.aluno_id || alunoSelecionado.id,
            instituicaoSelecionadaId
          );
          setIsLoading(false);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'O representante foi atribuído com sucesso.',
            confirmText: 'OK',
            onConfirm: voltarParaListagem,
          });
        } catch (error: any) {
          setIsLoading(false);
          const msg = getErrorMessage(error, 'Erro ao atribuir representante.');
          showPopup({
            type: 'error',
            title: 'Aviso',
            message: msg,
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
        <TouchableOpacity onPress={voltarParaListagem}>
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
        confirmColor={popup.confirmColor}
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
                value={instituicaoTexto}
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
                {faculdades.map((fac) => {
                  const labelFac = `${fac.sigla} - ${fac.campus}`;
                  return (
                    <TouchableOpacity
                      key={fac.id}
                      style={styles.optionItem}
                      onPress={() => {
                        setInstituicaoSelecionadaId(fac.id);
                        setInstituicaoTexto(labelFac);
                        setModalInstVisible(false);
                      }}
                    >
                      <Text style={[styles.optionText, instituicaoSelecionadaId === fac.id && { color: '#3E5F90', fontWeight: 'bold' }]}>
                        {labelFac}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
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
          disabled={!alunoSelecionado || !instituicaoSelecionadaId || isLoading}
          loading={isLoading}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
        >
          Tornar representante
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
});
