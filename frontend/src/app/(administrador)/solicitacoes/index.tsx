import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Avatar, Chip, Snackbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, ChevronRight, X } from 'lucide-react-native';

import { solicitacaoService, SolicitacaoItem } from '@/services/solicitacaoService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function FilaSolicitacoesScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | 'novos' | 'renovacoes'>('todos');
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  // Pop-up
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

  const carregarSolicitacoes = async () => {
    setIsLoading(true);
    try {
      const lista = await solicitacaoService.listarSolicitacoes('pendente');
      setSolicitacoes(lista);
    } catch (error: any) {
      const msg = getErrorMessage(error, 'Erro ao carregar fila de solicitações.');
      showPopup({
        type: 'error',
        title: 'Erro',
        message: msg,
        confirmText: 'Entendido',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    solicitacaoService.listarSolicitacoes('pendente').then((lista) => {
      if (isMounted) setSolicitacoes(lista);
    }).catch((err) => console.warn('Erro ao carregar solicitações:', err));
    return () => { isMounted = false; };
  }, []);

  const getIniciais = (nome: string) => {
    if (!nome) return 'AL';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const solicitacoesFiltradas = solicitacoes.filter((item) => {
    const q = busca.toLowerCase().trim();
    const matchBusca = !q || item.nome?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);

    if (!matchBusca) return false;

    const isRenovacao = item.status_cadastro === 'analise_renovacao';
    if (filtro === 'novos') return !isRenovacao;
    if (filtro === 'renovacoes') return isRenovacao;
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Fila de Solicitações</Text>
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
        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Buscar por aluno"
            value={busca}
            onChangeText={setBusca}
            mode="outlined"
            dense
            outlineStyle={styles.searchOutline}
            left={<TextInput.Icon icon={() => <Search size={20} color="#666" />} />}
            right={busca ? <TextInput.Icon icon={() => <X size={18} color="#666" />} onPress={() => setBusca('')} /> : undefined}
            style={styles.searchInput}
          />
        </View>

        {/* Filtros / Chips */}
        <View style={styles.chipRow}>
          <Chip
            selected={filtro === 'todos'}
            onPress={() => setFiltro('todos')}
            style={[styles.chip, filtro === 'todos' && styles.chipSelected]}
            textStyle={filtro === 'todos' ? styles.chipTextSelected : styles.chipText}
          >
            Todos
          </Chip>
          <Chip
            selected={filtro === 'novos'}
            onPress={() => setFiltro('novos')}
            style={[styles.chip, filtro === 'novos' && styles.chipSelected]}
            textStyle={filtro === 'novos' ? styles.chipTextSelected : styles.chipText}
          >
            Novos
          </Chip>
          <Chip
            selected={filtro === 'renovacoes'}
            onPress={() => setFiltro('renovacoes')}
            style={[styles.chip, filtro === 'renovacoes' && styles.chipSelected]}
            textStyle={filtro === 'renovacoes' ? styles.chipTextSelected : styles.chipText}
          >
            Renovações
          </Chip>
        </View>

        {/* Lista de Solicitações */}
        <View style={styles.listSection}>
          {solicitacoesFiltradas.map((sol) => {
            const isRenovacao = sol.status_cadastro === 'analise_renovacao';
            const subtitulo = isRenovacao ? 'renovação semestral' : 'cadastro novo';

            return (
              <TouchableOpacity
                key={sol.id}
                style={styles.solRow}
                onPress={() =>
                  router.push({
                    pathname: '/(administrador)/solicitacoes/[id]',
                    params: { id: String(sol.id) },
                  })
                }
              >
                <Avatar.Text
                  size={48}
                  label={getIniciais(sol.nome)}
                  style={styles.avatarCircle}
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.solInfo}>
                  <Text variant="bodyLarge" style={styles.solName}>{sol.nome}</Text>
                  <Text variant="bodySmall" style={styles.solSub}>{subtitulo}</Text>
                </View>
                <ChevronRight size={20} color="#666" />
              </TouchableOpacity>
            );
          })}

          {solicitacoesFiltradas.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma solicitação pendente encontrada.</Text>
          )}
        </View>
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
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#EAECEF',
    borderRadius: 28,
  },
  searchOutline: {
    borderRadius: 28,
    borderWidth: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  chip: {
    backgroundColor: '#EAECEF',
  },
  chipSelected: {
    backgroundColor: '#3E5F90',
  },
  chipText: {
    color: '#333',
  },
  chipTextSelected: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  listSection: {
    gap: 12,
  },
  solRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 16,
  },
  avatarCircle: {
    backgroundColor: '#3E5F90',
  },
  avatarLabel: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  solInfo: {
    flex: 1,
  },
  solName: {
    fontWeight: '500',
    color: '#333',
  },
  solSub: {
    color: '#666',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 32,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
