import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Switch, Snackbar } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Search, Pencil, Trash2, RotateCcw, X } from 'lucide-react-native';

import { bairroService, BairroItem } from '@/services/bairroService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function BairrosListScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false); // Inicia desligada por padrão (AC-01 / AC-09)
  const [bairros, setBairros] = useState<BairroItem[]>([]);
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

  const carregarBairros = React.useCallback(async () => {
    try {
      const lista = await bairroService.listarBairros(busca);
      setBairros(lista);
    } catch (err) {
      const msg = getErrorMessage(err, 'Erro ao carregar listagem de bairros.');
      showPopup({
        type: 'error',
        title: 'Erro de Conexão',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  }, [busca, showPopup]);

  useFocusEffect(
    React.useCallback(() => {
      carregarBairros();
    }, [carregarBairros])
  );

  const handleInativar = (bairro: BairroItem) => {
    showPopup({
      type: 'warning',
      title: 'Inativar bairro?',
      message: 'O bairro e seus pontos ficarão inativos no sistema.',
      confirmText: 'Inativar',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: async () => {
        closePopup();
        try {
          await bairroService.inativarBairro(bairro.id);
          setSnackbarMessage(`Bairro ${bairro.nome} inativado`);
          setSnackbarVisivel(true);
          carregarBairros();
        } catch (error: any) {
          showPopup({
            type: 'error',
            title: 'Inativação Bloqueada',
            message:
              error.message ||
              'Este bairro não pode ser inativado pois pertence a uma rota ativa. Remova-o da rota antes de continuar.',
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const handleReativar = (bairro: BairroItem) => {
    showPopup({
      type: 'info',
      title: 'Reativar bairro?',
      message: 'O bairro voltará a estar disponível para rotas e agendamentos.',
      confirmText: 'Reativar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        try {
          await bairroService.reativarBairro(bairro.id);
          setSnackbarMessage(`Bairro ${bairro.nome} reativado`);
          setSnackbarVisivel(true);
          carregarBairros();
        } catch (err) {
          const msg = getErrorMessage(err, 'Erro ao reativar bairro.');
          showPopup({
            type: 'error',
            title: 'Erro ao reativar',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const ativos = bairros.filter((b) => b.ativo);
  const inativos = bairros.filter((b) => !b.ativo);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(administrador)/cadastros')}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Bairros e Pontos</Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/bairros/cadastrar')}
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
            placeholder="Buscar por bairro"
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
          {ativos.map((bairro) => {
            const pontosAtivosNomes = bairro.pontos
              .filter((p) => p.ativo !== false)
              .map((p) => p.nome)
              .join(', ');
            const textoPontos = pontosAtivosNomes || 'Nenhum ponto registrado';

            return (
              <View key={bairro.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge" style={styles.itemName}>{bairro.nome}</Text>
                  <Text variant="bodySmall" style={styles.itemSub} numberOfLines={1}>
                    {textoPontos}
                  </Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      router.push({
                        pathname: '/(administrador)/bairros/editar',
                        params: { id: String(bairro.id) },
                      })
                    }
                    style={styles.iconBtn}
                  >
                    <Pencil size={20} color="#333" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleInativar(bairro)} style={styles.iconBtn}>
                    <Trash2 size={20} color="#333" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {ativos.length === 0 && (
            <Text style={styles.emptyText}>Nenhum bairro ativo encontrado.</Text>
          )}
        </View>

        {/* Seção Inativos */}
        {mostrarInativos && inativos.length > 0 && (
          <View style={styles.inativosSection}>
            <Text variant="titleMedium" style={styles.inativosTitle}>Inativos</Text>
            {inativos.map((bairro) => {
              const pontosNomes = bairro.pontos.map((p) => p.nome).join(', ');
              const textoPontos = pontosNomes || 'Nenhum ponto registrado';

              return (
                <View key={bairro.id} style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text variant="bodyLarge" style={styles.itemName}>{bairro.nome}</Text>
                    <Text variant="bodySmall" style={styles.itemSub} numberOfLines={1}>
                      {textoPontos}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => handleReativar(bairro)} style={styles.iconBtn}>
                    <RotateCcw size={20} color="#333" />
                  </TouchableOpacity>
                </View>
              );
            })}
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
