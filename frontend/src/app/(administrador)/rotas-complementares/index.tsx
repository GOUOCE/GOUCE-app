import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Switch } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Plus, Search, Pencil, Trash2, RotateCcw, X } from 'lucide-react-native';

import { rotaComplementarService, RotaComplementarItem } from '@/services/rotaComplementarService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function RotasComplementaresListScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(false); // Inicia desligada por padrão (AC-01 / AC-09)
  const [rotas, setRotas] = useState<RotaComplementarItem[]>([]);

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

  const fecharSucesso = () => {
    closePopup();
    carregarRotas();
  };

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
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'A rota complementar foi inativada com sucesso.',
            confirmText: 'OK',
            onConfirm: fecharSucesso,
          });
        } catch (error: any) {
          const msg = getErrorMessage(error, 'Erro ao inativar rota complementar.');
          showPopup({
            type: 'error',
            title: msg.startsWith('Erro de conexão') ? 'Erro de Conexão' : 'Inativação Bloqueada',
            message: msg,
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
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'A rota complementar foi reativada com sucesso.',
            confirmText: 'OK',
            onConfirm: fecharSucesso,
          });
        } catch (err) {
          // Ex.: rota principal inativa (#208, item 6): a mensagem da API aparece na tela (#362)
          const msg = getErrorMessage(err, 'Erro ao reativar rota complementar.');
          showPopup({
            type: 'error',
            title: msg.startsWith('Erro de conexão') ? 'Erro de Conexão' : 'Reativação Bloqueada',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const abrirEdicao = (item: RotaComplementarItem) =>
    router.push({
      pathname: '/(administrador)/rotas-complementares/editar',
      params: { id: String(item.id) },
    });

  const ativas = rotas.filter((r) => r.ativo);
  const inativas = rotas.filter((r) => !r.ativo);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(administrador)/cadastros')}>
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
        onDismiss={popup.type === 'success' ? fecharSucesso : closePopup}
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
                <TouchableOpacity onPress={() => abrirEdicao(item)} style={styles.iconBtn} accessibilityLabel={`Editar ${item.nome}`}>
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
                  <Text variant="bodyLarge" style={styles.itemName}>{item.nome} (inativa)</Text>
                  <Text variant="bodySmall" style={styles.itemSub}>
                    Rota: {item.rota_principal_nome}{item.rota_principal_ativa ? '' : ' (inativa)'} | {item.horario_saida}
                  </Text>
                </View>

                {/* A inativa pode ser editada: trocar a rota principal inativa antes de reativar (#362) */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={() => abrirEdicao(item)} style={styles.iconBtn} accessibilityLabel={`Editar ${item.nome}`}>
                    <Pencil size={20} color="#333" />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => handleReativar(item)} style={styles.iconBtn} accessibilityLabel={`Reativar ${item.nome}`}>
                    <RotateCcw size={20} color="#333" />
                  </TouchableOpacity>
                </View>
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
});
