import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Switch } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Search, Pencil, Trash2, RotateCcw, X } from 'lucide-react-native';

import { motoristaService, MotoristaItem } from '@/services/motoristaService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function MotoristasListScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false); // Inicia desligada por padrão (AC-01 / AC-09)
  const [motoristas, setMotoristas] = useState<MotoristaItem[]>([]);

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

  const carregarMotoristas = React.useCallback(async () => {
    try {
      const lista = await motoristaService.listarMotoristas(busca, mostrarInativos);
      setMotoristas(lista);
    } catch (err) {
      const msg = getErrorMessage(err, 'Erro ao carregar listagem de motoristas.');
      showPopup({
        type: 'error',
        title: 'Erro de Conexão',
        message: msg,
        confirmText: 'Entendido',
      });
    }
  }, [busca, mostrarInativos]);

  useFocusEffect(
    React.useCallback(() => {
      carregarMotoristas();
    }, [carregarMotoristas])
  );

  const handleInativar = (mot: MotoristaItem) => {
    showPopup({
      type: 'warning',
      title: 'Inativar motorista?',
      message: 'O motorista não estará mais disponível para alocações.',
      confirmText: 'Inativar',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: async () => {
        closePopup();
        try {
          await motoristaService.inativarMotorista(mot.id);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'O motorista foi inativado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
              closePopup();
              carregarMotoristas();
            },
          });
        } catch (error: any) {
          const msg = getErrorMessage(
            error,
            'Este profissional possui alocações pendentes e não pode ser inativado no momento.'
          );
          showPopup({
            type: 'error',
            title: 'Inativação Bloqueada',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const handleReativar = (mot: MotoristaItem) => {
    showPopup({
      type: 'info',
      title: 'Reativar motorista?',
      message: 'O motorista voltará a estar disponível para alocações.',
      confirmText: 'Reativar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        try {
          await motoristaService.reativarMotorista(mot.id);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'O motorista foi reativado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
              closePopup();
              carregarMotoristas();
            },
          });
        } catch (err) {
          const msg = getErrorMessage(err, 'Erro ao reativar profissional.');
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

  const ativos = motoristas.filter((m) => m.ativo);
  const inativos = motoristas.filter((m) => !m.ativo);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(administrador)/cadastros')}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Motoristas</Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/motoristas/cadastrar')}
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
          {ativos.map((mot) => (
            <View key={mot.id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text variant="bodyLarge" style={styles.itemName}>{mot.nome}</Text>
                <Text variant="bodySmall" style={styles.itemSub}>{mot.telefone}</Text>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(administrador)/motoristas/editar',
                      params: { id: String(mot.id) },
                    })
                  }
                  style={styles.iconBtn}
                >
                  <Pencil size={20} color="#333" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleInativar(mot)} style={styles.iconBtn}>
                  <Trash2 size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {ativos.length === 0 && (
            <Text style={styles.emptyText}>Nenhum motorista ativo encontrado.</Text>
          )}
        </View>

        {/* Seção Inativos */}
        {mostrarInativos && inativos.length > 0 && (
          <View style={styles.inativasSection}>
            <Text variant="titleMedium" style={styles.inativasTitle}>Inativas</Text>
            {inativos.map((mot) => (
              <View key={mot.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text variant="bodyLarge" style={styles.itemName}>{mot.nome}</Text>
                  <Text variant="bodySmall" style={styles.itemSub}>{mot.telefone}</Text>
                </View>

                <TouchableOpacity onPress={() => handleReativar(mot)} style={styles.iconBtn}>
                  <RotateCcw size={20} color="#333" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
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
  inativasSection: {
    marginTop: 32,
    gap: 8,
  },
  inativasTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },
});
