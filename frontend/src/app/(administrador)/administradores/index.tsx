import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput, Switch, Surface, Avatar, Snackbar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, Plus, Search, Pencil, Trash2, RotateCcw, X } from 'lucide-react-native';

import { adminService, AdministradorItem } from '@/services/adminService';
import { useAuth } from '@contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function AdministradoresListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [busca, setBusca] = useState('');
  const [mostrarInativos, setMostrarInativos] = useState(true);
  const [administradores, setAdministradores] = useState<AdministradorItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  // Pop-up estilizado
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

  const carregarAdministradores = async () => {
    setIsLoading(true);
    try {
      const lista = await adminService.listarAdministradores();
      setAdministradores(lista);
    } catch (error) {
      console.warn('Erro ao carregar administradores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarAdministradores();
  }, []);

  const getIniciais = (nome: string) => {
    if (!nome) return 'AD';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const handleInativar = (admin: AdministradorItem) => {
    // Validação de auto-inativação (AC-06 / FA-002)
    if (String(admin.id) === String(user?.id)) {
      showPopup({
        type: 'error',
        title: 'Ação Bloqueada',
        message: 'Não é possível inativar a conta atualmente em uso.',
        confirmText: 'Entendido',
      });
      return;
    }

    showPopup({
      type: 'warning',
      title: 'Inativar administrador?',
      message: 'O administrador perderá o acesso restrito ao sistema.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      confirmColor: '#B00020',
      onConfirm: async () => {
        closePopup();
        try {
          await adminService.inativarAdministrador(admin.id);
          setSnackbarMessage('Administrador inativado');
          setSnackbarVisivel(true);
          carregarAdministradores();
        } catch (error: any) {
          const msg = getErrorMessage(error, 'Erro ao inativar administrador.');
          showPopup({
            type: 'error',
            title: 'Erro',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const handleReativar = (admin: AdministradorItem) => {
    const primeiroNome = admin.nome ? admin.nome.split(' ')[0] : 'o administrador';

    showPopup({
      type: 'info',
      title: `Reativar ${primeiroNome}?`,
      message: 'O administrador voltará a ter acesso ao sistema.',
      confirmText: 'Reativar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        try {
          await adminService.reativarAdministrador(admin.id, admin.nome, admin.email);
          setSnackbarMessage('Administrador reativado');
          setSnackbarVisivel(true);
          carregarAdministradores();
        } catch (error: any) {
          const msg = getErrorMessage(error, 'Erro ao reativar administrador.');
          showPopup({
            type: 'error',
            title: 'Erro',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const administradoresFiltrados = administradores.filter((item) => {
    const q = busca.toLowerCase().trim();
    if (!q) return true;
    return item.nome?.toLowerCase().includes(q) || item.email?.toLowerCase().includes(q);
  });

  const ativos = administradoresFiltrados.filter((a) => a.ativo);
  const inativos = administradoresFiltrados.filter((a) => !a.ativo);

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Administradores</Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/administradores/cadastrar')}
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
          {ativos.map((admin) => (
            <View key={admin.id} style={styles.adminRow}>
              <Avatar.Text
                size={48}
                label={getIniciais(admin.nome)}
                style={styles.avatarCircle}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.adminInfo}>
                <Text variant="bodyLarge" style={styles.adminName}>{admin.nome}</Text>
                <Text variant="bodySmall" style={styles.adminEmail}>{admin.email}</Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() =>
                    router.push({
                      pathname: '/(administrador)/administradores/editar',
                      params: { id: String(admin.id), nome: admin.nome, email: admin.email },
                    })
                  }
                  style={styles.iconBtn}
                >
                  <Pencil size={20} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleInativar(admin)} style={styles.iconBtn}>
                  <Trash2 size={20} color="#333" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {ativos.length === 0 && (
            <Text style={styles.emptyText}>Nenhum administrador ativo encontrado.</Text>
          )}
        </View>

        {/* Seção Inativos */}
        {mostrarInativos && inativos.length > 0 && (
          <View style={styles.inativosSection}>
            <Text variant="titleMedium" style={styles.inativosTitle}>Inativos</Text>
            {inativos.map((admin) => (
              <View key={admin.id} style={styles.adminRow}>
                <Avatar.Text
                  size={48}
                  label={getIniciais(admin.nome)}
                  style={[styles.avatarCircle, { backgroundColor: '#4C607A' }]}
                  labelStyle={styles.avatarLabel}
                />
                <View style={styles.adminInfo}>
                  <Text variant="bodyLarge" style={styles.adminName}>{admin.nome}</Text>
                  <Text variant="bodySmall" style={styles.adminEmail}>{admin.email}</Text>
                </View>
                <TouchableOpacity onPress={() => handleReativar(admin)} style={styles.iconBtn}>
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
    gap: 16,
  },
  adminRow: {
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
  adminInfo: {
    flex: 1,
  },
  adminName: {
    fontWeight: '500',
    color: '#333',
  },
  adminEmail: {
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
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
    marginVertical: 16,
  },
  snackbar: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    marginHorizontal: 16,
  },
});
