import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Switch, Snackbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Search, Pencil, Trash2, RotateCcw, X } from 'lucide-react-native';

import { frotaService, OnibusItem } from '@/services/frotaService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function FrotaListScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [onibusLista, setOnibusLista] = useState<OnibusItem[]>([]);
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

  const carregarFrota = React.useCallback(async () => {
    try {
      const lista = await frotaService.listarOnibus(busca);
      setOnibusLista(lista);
    } catch (err) {
      console.warn('Erro ao carregar frota:', err);
    }
  }, [busca]);

  useFocusEffect(
    React.useCallback(() => {
      carregarFrota();
    }, [carregarFrota])
  );

  const handleInativar = (item: OnibusItem) => {
    showPopup({
      type: 'warning',
      title: 'Inativar ônibus?',
      message: 'O ônibus não estará mais disponível para alocações.',
      confirmText: 'Inativar',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: async () => {
        closePopup();
        try {
          await frotaService.inativarOnibus(item.id);
          setSnackbarMessage('Ônibus inativado');
          setSnackbarVisivel(true);
          carregarFrota();
        } catch (error: any) {
          showPopup({
            type: 'error',
            title: 'Inativação Bloqueada',
            message:
              error.message ||
              'Este veículo possui alocações pendentes e não pode ser inativado no momento.',
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const handleReativar = (item: OnibusItem) => {
    showPopup({
      type: 'info',
      title: 'Reativar ônibus?',
      message: 'O ônibus voltará a estar disponível para alocações.',
      confirmText: 'Reativar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        try {
          await frotaService.reativarOnibus(item.id);
          setSnackbarMessage('Ônibus reativado');
          setSnackbarVisivel(true);
          carregarFrota();
        } catch (err) {
          console.error('Erro ao reativar ônibus:', err);
        }
      },
    });
  };

  const ativos = onibusLista.filter((o) => o.ativo);
  const inativos = onibusLista.filter((o) => !o.ativo);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Frota</Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/frota/cadastrar')}
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

        {/* Toggle Mostrar inativos */}
        <View style={styles.toggleRow}>
          <Text variant="bodyLarge" style={styles.toggleLabel}>Mostrar inativos</Text>
          <Switch
            value={mostrarInativos}
            onValueChange={setMostrarInativos}
            color="#3e5f90"
          />
        </View>

        {/* Lista de Ativos */}
        <View style={styles.listSection}>
          {ativos.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text variant="bodyLarge" style={styles.itemName}>
                  {item.identificacao} - {item.placa}
                </Text>
                <Text variant="bodySmall" style={styles.itemSub}>
                  {item.assentos} assentos | No máximo {item.capacidade_em_pe} em pé
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(administrador)/frota/editar',
                      params: { id: String(item.id) },
                    })
                  }
                  style={styles.iconBtn}
                >
                  <Pencil size={20} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleInativar(item)} style={styles.iconBtn}>
                  <Trash2 size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {ativos.length === 0 && (
            <Text style={styles.emptyText}>Nenhum ônibus ativo encontrado.</Text>
          )}
        </View>

        {/* Seção Inativos */}
        {mostrarInativos && inativos.length > 0 && (
          <View style={styles.inativosSection}>
            <Text variant="titleMedium" style={styles.inativosTitle}>Inativos</Text>
            {inativos.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge" style={styles.itemName}>
                    {item.identificacao} - {item.placa}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemSub}>
                    {item.assentos} assentos | No máximo {item.capacidade_em_pe} em pé
                  </Text>
                </View>

                <TouchableOpacity onPress={() => handleReativar(item)} style={styles.iconBtn}>
                  <RotateCcw size={20} color="#333" />
                </TouchableOpacity>
              </View>
            ))}
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleLabel: {
    color: '#333',
    fontWeight: '500',
  },
  listSection: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '500',
    color: '#333',
  },
  itemSub: {
    color: '#666',
    marginTop: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 6,
  },
  inativosSection: {
    marginTop: 32,
    gap: 8,
  },
  inativosTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
