import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Switch, Snackbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Search, Pencil, Trash2, RotateCcw, X } from 'lucide-react-native';

import { rotaComplementarService, RotaComplementarItem } from '@/services/rotaComplementarService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function RotasComplementaresListScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [rotas, setRotas] = useState<RotaComplementarItem[]>([]);
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

  const showPopup = React.useCallback((config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  }, []);

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const carregarRotas = React.useCallback(async () => {
    try {
      const lista = await rotaComplementarService.listarRotasComplementares(busca);
      setRotas(lista);
    } catch (err) {
      showPopup({
        type: 'error',
        title: 'Erro de Conexão',
        message: getErrorMessage(err, 'Erro ao carregar listagem de rotas complementares.'),
        confirmText: 'Entendido',
      });
    }
  }, [busca, showPopup]);

  useFocusEffect(
    React.useCallback(() => {
      carregarRotas();
    }, [carregarRotas])
  );

  const handleInativar = (item: RotaComplementarItem) => {
    showPopup({
      type: 'warning',
      title: 'Inativar rota complementar?',
      message: 'A rota complementar não estará mais disponível para agendamentos.',
      confirmText: 'Inativar',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: async () => {
        closePopup();
        try {
          await rotaComplementarService.inativarRotaComplementar(item.id);
          setSnackbarMessage('Rota complementar inativada');
          setSnackbarVisivel(true);
          carregarRotas();
        } catch (error: any) {
          showPopup({
            type: 'error',
            title: 'Inativação Bloqueada',
            message:
              error.message ||
              'Esta rota possui agendamentos pendentes de alunos. Não é possível inativar no momento.',
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const handleReativar = (item: RotaComplementarItem) => {
    showPopup({
      type: 'info',
      title: 'Reativar rota complementar?',
      message: 'A rota complementar voltará a estar disponível para agendamentos.',
      confirmText: 'Reativar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        try {
          await rotaComplementarService.reativarRotaComplementar(item.id);
          setSnackbarMessage('Rota complementar reativada');
          setSnackbarVisivel(true);
          carregarRotas();
        } catch (err) {
          console.error('Erro ao reativar rota complementar:', err);
        }
      },
    });
  };

  const ativas = rotas.filter((r) => r.ativo);
  const inativas = rotas.filter((r) => !r.ativo);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Rotas Complementares</Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/rotas-complementares/cadastrar')}
        >
          <Plus size={20} color="#3e5f90" />
          <Text style={styles.novoText}>Nova</Text>
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

        {/* Lista de Ativas */}
        <View style={styles.listSection}>
          {ativas.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text variant="bodyLarge" style={styles.itemName}>{item.nome}</Text>
                <Text variant="bodySmall" style={styles.itemSub}>
                  Rota: {item.rota_principal_nome} | {item.horario_saida}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(administrador)/rotas-complementares/editar',
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

          {ativas.length === 0 && (
            <Text style={styles.emptyText}>Nenhuma rota complementar ativa encontrada.</Text>
          )}
        </View>

        {/* Seção Inativas */}
        {mostrarInativos && inativas.length > 0 && (
          <View style={styles.inativosSection}>
            <Text variant="titleMedium" style={styles.inativosTitle}>Inativos</Text>
            {inativas.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge" style={styles.itemName}>{item.nome}</Text>
                  <Text variant="bodySmall" style={styles.itemSub}>(inativa)</Text>
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
