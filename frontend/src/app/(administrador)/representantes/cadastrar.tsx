import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal as RNModal } from 'react-native';
import { Text, TextInput, Button, Surface, Avatar, Portal } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Search, Building2, ChevronDown, X } from 'lucide-react-native';

import { representanteService, AlunoBuscaItem, MSG_JA_REPRESENTANTE } from '@/services/representanteService';
import { faculdadeService, FaculdadeItem } from '@/services/faculdadeService';
import { getErrorMessage } from '@/utils/errorUtils';
import { atribuirRepresentanteSchema } from '@/schemas/representanteSchema';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

// Rótulo da faculdade no seletor: nome e campus vindos da API (#262)
const rotuloFaculdade = (fac: FaculdadeItem) => `${fac.nome} - ${fac.campus}`;

// Quantos discentes a busca mostra de uma vez; o resto aparece refinando o nome
const MAX_RESULTADOS = 5;

// Campo fechado: o nome completo não cabe e cortava o campus; usa sigla e campus, como em Faculdades
const rotuloCampo = (fac: FaculdadeItem) =>
  fac.sigla ? `${fac.sigla} - ${fac.campus}` : rotuloFaculdade(fac);

export default function CadastrarRepresentanteScreen() {
  const router = useRouter();

  const [faculdades, setFaculdades] = useState<FaculdadeItem[]>([]);
  const [instituicaoSelecionadaId, setInstituicaoSelecionadaId] = useState<number | null>(null);
  const [instituicaoTexto, setInstituicaoTexto] = useState('Selecione uma instituição');
  const [erroInstituicao, setErroInstituicao] = useState('');
  const [modalInstVisible, setModalInstVisible] = useState(false);
  const [busca, setBusca] = useState('');
  const [resultado, setResultado] = useState<{ termo: string; lista: AlunoBuscaItem[] } | null>(null);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoBuscaItem | null>(null);
  const [erroDiscente, setErroDiscente] = useState('');
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
      setErroInstituicao('');
      setBusca('');
      setResultado(null);
      setMostrarLista(false);
      setAlunoSelecionado(null);
      setErroDiscente('');

      faculdadeService.listarFaculdades().then((lista) => {
        const ativas = lista.filter((f) => f.ativo !== false);
        setFaculdades(ativas);
        if (ativas.length === 0) {
          setInstituicaoTexto('Nenhuma instituição ativa cadastrada');
        }
      }).catch((err) => {
        showPopup({
          type: 'error',
          title: err?.response ? 'Aviso' : 'Erro de Conexão',
          message: getErrorMessage(err, 'Erro ao carregar faculdades.'),
          confirmText: 'Entendido',
        });
      });

      return () => {
        setFaculdades([]);
        setInstituicaoSelecionadaId(null);
        setInstituicaoTexto('Selecione uma instituição');
        setErroInstituicao('');
        setBusca('');
        setResultado(null);
        setMostrarLista(false);
        setAlunoSelecionado(null);
        setErroDiscente('');
      };
    }, [])
  );

  // O discente só é escolhido pelo administrador, tocando em um dos resultados da busca
  useEffect(() => {
    const termo = busca.trim();
    if (!termo) {
      setResultado(null);
      return;
    }
    let isMounted = true;
    // A instituição do representante pode ser diferente da matrícula (PO na #207, item 6b):
    // os discentes não são filtrados pela instituição escolhida
    representanteService.buscarAlunos(termo).then((lista) => {
      if (isMounted) setResultado({ termo, lista });
    }).catch((err) => {
      if (!isMounted) return;
      setResultado(null);
      showPopup({
        type: 'error',
        title: err?.response ? 'Aviso' : 'Erro de Conexão',
        message: getErrorMessage(err, 'Erro ao carregar discentes elegíveis.'),
        confirmText: 'Entendido',
      });
    });

    return () => { isMounted = false; };
  }, [busca]);

  // Resultado só vale para o texto que está na busca; enquanto carrega, não mostra nada
  const resultadoAtual = resultado && resultado.termo === busca.trim() ? resultado.lista : null;

  const alterarBusca = (texto: string) => {
    setBusca(texto);
    setAlunoSelecionado(null);
    setErroDiscente('');
    setMostrarLista(true);
  };

  const limparBusca = () => {
    setBusca('');
    setAlunoSelecionado(null);
    setMostrarLista(false);
  };

  const selecionarDiscente = (aluno: AlunoBuscaItem) => {
    // Quem já é representante ativo não pode receber a função de novo (FA-003)
    if (aluno.situacao === 'ativo') {
      setAlunoSelecionado(null);
      setErroDiscente(MSG_JA_REPRESENTANTE);
      return;
    }
    setAlunoSelecionado(aluno);
    setBusca(aluno.nome);
    setErroDiscente('');
    setMostrarLista(false);
  };

  const voltarParaListagem = () => {
    closePopup();
    router.replace('/(administrador)/representantes');
  };

  const handleTornarRepresentante = () => {
    // Instituição e discente são obrigatórios: o campo vazio é destacado e a atribuição é bloqueada (AC-12)
    const validacao = atribuirRepresentanteSchema.safeParse({
      instituicao: instituicaoSelecionadaId ? String(instituicaoSelecionadaId) : '',
      alunoId: alunoSelecionado ? alunoSelecionado.aluno_id || alunoSelecionado.id : undefined,
    });
    if (!validacao.success) {
      const mensagemDe = (campo: string) =>
        validacao.error.issues.find((i) => i.path[0] === campo)?.message ?? '';
      setErroInstituicao(mensagemDe('instituicao'));
      setErroDiscente(mensagemDe('alunoId'));
      return;
    }
    const { alunoId, instituicao } = validacao.data;

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
          await representanteService.atribuirRepresentante(alunoId, Number(instituicao));
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
          // Sem resposta da API é falha de conexão; com resposta, a regra vem da API
          showPopup({
            type: 'error',
            title: error?.response ? 'Aviso' : 'Erro de Conexão',
            message: getErrorMessage(error, 'Erro ao atribuir representante.'),
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
                error={!!erroInstituicao}
                left={<TextInput.Icon icon={() => <Building2 size={20} color="#666" />} />}
                right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={() => setModalInstVisible(true)} />}
                style={styles.input}
              />
            </View>
          </TouchableOpacity>
          {!!erroInstituicao && <Text style={styles.errorText}>{erroInstituicao}</Text>}
        </View>

        {/* Modal de Seleção de Instituição */}
        <Portal>
          <RNModal visible={modalInstVisible} transparent={true} animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalInstVisible(false)}>
              <View style={styles.modalSelectContent}>
                <Text variant="titleMedium" style={styles.modalSelectTitle}>Instituição de Ensino</Text>
                {faculdades.map((fac) => {
                  const labelFac = rotuloFaculdade(fac);
                  return (
                    <TouchableOpacity
                      key={fac.id}
                      style={styles.optionItem}
                      onPress={() => {
                        setInstituicaoSelecionadaId(fac.id);
                        setInstituicaoTexto(rotuloCampo(fac));
                        setErroInstituicao('');
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
            onChangeText={alterarBusca}
            error={!!erroDiscente}
            left={<TextInput.Icon icon={() => <Search size={20} color="#666" />} />}
            right={busca ? <TextInput.Icon icon={() => <X size={18} color="#666" />} onPress={limparBusca} /> : undefined}
            style={styles.input}
          />
          {!!erroDiscente && <Text style={styles.errorText}>{erroDiscente}</Text>}

          {/* Resultados da busca: o discente só é selecionado ao tocar em um deles */}
          {mostrarLista && resultadoAtual && (
            <Surface style={styles.resultadosBox} elevation={1}>
              {resultadoAtual.length === 0 ? (
                <Text style={styles.resultadoVazio}>Nenhum aluno encontrado.</Text>
              ) : (
                resultadoAtual.slice(0, MAX_RESULTADOS).map((aluno) => (
                  <TouchableOpacity key={aluno.id} style={styles.resultadoItem} onPress={() => selecionarDiscente(aluno)}>
                    <View style={styles.resultadoLinha}>
                      <Text style={styles.resultadoNome}>{aluno.nome}</Text>
                      {aluno.situacao === 'ativo' && (
                        <View style={styles.etiquetaAtivo}>
                          <Text style={styles.etiquetaAtivoTexto}>Representante ativo</Text>
                        </View>
                      )}
                      {aluno.situacao === 'revogado' && (
                        <View style={styles.etiquetaRevogado}>
                          <Text style={styles.etiquetaRevogadoTexto}>Revogado</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.resultadoEmail}>{aluno.email}</Text>
                  </TouchableOpacity>
                ))
              )}
              {resultadoAtual.length > MAX_RESULTADOS && (
                <Text style={styles.resultadoDica}>Refine a busca para ver mais resultados.</Text>
              )}
            </Surface>
          )}
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
                {[alunoSelecionado.instituicao, alunoSelecionado.campus].filter(Boolean).join(' - ')}
              </Text>

              {/* A API de discentes não envia curso nem semestre: só mostra se vierem (#300) */}
              {(alunoSelecionado.curso || alunoSelecionado.periodo_ingresso) && (
                <>
                  <Text variant="labelSmall" style={styles.infoLabel}>Curso | Semestre</Text>
                  <Text variant="bodyMedium" style={styles.infoValue}>
                    {[alunoSelecionado.curso, alunoSelecionado.periodo_ingresso].filter(Boolean).join(' | ')}
                  </Text>
                </>
              )}
            </View>
          </Surface>
        ) : (
          <Surface style={styles.emptyCard} elevation={0}>
            <Text style={styles.emptyText}>Nenhum discente selecionado.</Text>
          </Surface>
        )}

        <Button
          mode="contained"
          onPress={handleTornarRepresentante}
          disabled={isLoading}
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
  resultadosBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  resultadoItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resultadoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  etiquetaAtivo: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  etiquetaAtivoTexto: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: 'bold',
  },
  etiquetaRevogado: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  etiquetaRevogadoTexto: {
    color: '#C62828',
    fontSize: 11,
    fontWeight: 'bold',
  },
  resultadoNome: {
    color: '#333',
    fontWeight: '500',
  },
  resultadoEmail: {
    color: '#666',
    fontSize: 12,
  },
  resultadoVazio: {
    color: '#666',
    padding: 16,
  },
  resultadoDica: {
    color: '#888',
    fontSize: 12,
    padding: 12,
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
