import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Snackbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Search, UserX, X, ChevronRight as ChevronRightIcon } from 'lucide-react-native';

import { representanteService, RepresentanteItem } from '@/services/representanteService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function RepresentantesListScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [representantes, setRepresentantes] = useState<RepresentanteItem[]>([]);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  // Pop-up Estilizado
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

  const carregarRepresentantes = React.useCallback(async () => {
    try {
      const lista = await representanteService.listarRepresentantes(busca);
      setRepresentantes(lista.filter((r: RepresentanteItem) => r.ativo));
    } catch (err) {
      console.warn('Erro ao carregar representantes:', err);
    }
  }, [busca]);

  useFocusEffect(
    React.useCallback(() => {
      carregarRepresentantes();
    }, [carregarRepresentantes])
  );

  const handleRevogar = (rep: RepresentanteItem) => {
    showPopup({
      type: 'warning',
      title: 'Revogar representação?',
      message: 'O discente não terá mais acesso às funções de representante.',
      confirmText: 'Inativar',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: async () => {
        closePopup();
        try {
          await representanteService.revogarRepresentante(rep.id);
          setSnackbarMessage('Representante revogado');
          setSnackbarVisivel(true);
          carregarRepresentantes();
        } catch (err) {
          console.error('Erro ao revogar representação:', err);
        }
      },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Representantes</Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/representantes/cadastrar')}
        >
          <Plus size={20} color="#3e5f90" />
          <Text style={styles.novoText}>Novo</Text>
        </TouchableOpacity>
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
        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Buscar por nome"
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

        {/* Quantidade de Resultados */}
        <Text variant="bodySmall" style={styles.countText}>
          {representantes.length} {representantes.length === 1 ? 'resultado obtido' : 'resultados obtidos'}
        </Text>

        {/* Lista de Representantes */}
        <View style={styles.listSection}>
          {representantes.map((rep) => (
            <View key={rep.id} style={styles.repRow}>
              <View style={styles.repInfo}>
                <Text variant="bodyLarge" style={styles.repName}>{rep.nome}</Text>
                <Text variant="bodySmall" style={styles.repSub}>{rep.instituicao} - {rep.campus}</Text>
              </View>

              <TouchableOpacity onPress={() => handleRevogar(rep)} style={styles.iconBtn}>
                <UserX size={22} color="#333" />
              </TouchableOpacity>
            </View>
          ))}

          {representantes.length === 0 && (
            <Text style={styles.emptyText}>Nenhum representante cadastrado.</Text>
          )}
        </View>

        {/* Paginação Estilizada do Protótipo */}
        {representantes.length > 0 && (
          <View style={styles.paginationRow}>
            <TouchableOpacity style={styles.pageArrow}>
              <ChevronLeft size={18} color="#333" />
            </TouchableOpacity>
            <View style={styles.pageCircleActive}>
              <Text style={styles.pageNumberActive}>1</Text>
            </View>
            <TouchableOpacity style={styles.pageArrow}>
              <ChevronRightIcon size={18} color="#333" />
            </TouchableOpacity>
          </View>
        )}
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
    marginBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  novoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  novoText: {
    color: '#3e5f90',
    fontWeight: 'bold',
    fontSize: 16,
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
  countText: {
    color: '#666',
    marginBottom: 16,
  },
  listSection: {
    gap: 8,
    marginBottom: 32,
  },
  repRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  repInfo: {
    flex: 1,
  },
  repName: {
    fontWeight: '500',
    color: '#333',
  },
  repSub: {
    color: '#666',
    marginTop: 2,
  },
  iconBtn: {
    padding: 6,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  pageArrow: {
    padding: 6,
  },
  pageCircleActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#B3ECEC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageNumberActive: {
    fontWeight: 'bold',
    color: '#004D40',
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
