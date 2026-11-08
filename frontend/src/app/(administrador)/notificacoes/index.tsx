import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Plus, Search, X } from 'lucide-react-native';

import { avisoService, AvisoItem } from '@/services/avisoService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { CardAviso } from '@/components/avisos/CardAviso';

export default function GerenciarAvisosScreen() {
  const router = useRouter();

  const [busca, setBusca] = useState('');
  const [avisos, setAvisos] = useState<AvisoItem[]>([]);

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

  const carregarAvisos = React.useCallback(async () => {
    try {
      const lista = await avisoService.listarAvisos(busca);
      setAvisos(lista);
    } catch (err) {
      const msg = getErrorMessage(err, 'Erro ao carregar o mural de avisos.');
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
      carregarAvisos();
    }, [carregarAvisos])
  );

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(administrador)/mais')}>
          <ArrowLeft size={26} color="#191C20" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Gerenciar Avisos
        </Text>
        <TouchableOpacity
          style={styles.novoButton}
          onPress={() => router.push('/(administrador)/notificacoes/cadastrar' as any)}
        >
          <Plus size={20} color="#3E5F90" />
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra de Busca */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Buscar por título"
            value={busca}
            onChangeText={setBusca}
            mode="outlined"
            dense
            outlineStyle={styles.searchOutline}
            right={
              busca ? (
                <TextInput.Icon
                  icon={() => <X size={18} color="#44474E" />}
                  onPress={() => setBusca('')}
                />
              ) : (
                <TextInput.Icon
                  icon={() => <Search size={20} color="#44474E" />}
                />
              )
            }
            style={styles.searchInput}
          />
        </View>

        {/* Lista de Avisos em Cards Expansíveis */}
        <View style={styles.listSection}>
          {avisos.map((aviso, index) => (
            <CardAviso
              key={aviso.id}
              aviso={aviso}
              inicialmenteExpandido={index === 0}
            />
          ))}

          {avisos.length === 0 && (
            <Text style={styles.emptyText}>
              Nenhum aviso publicado encontrado.
            </Text>
          )}
        </View>
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
    fontWeight: '400',
    color: '#191C20',
    flex: 1,
    fontSize: 24,
  },
  novoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  novoText: {
    color: '#3E5F90',
    fontWeight: '600',
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#E9EBF4',
    borderRadius: 28,
  },
  searchOutline: {
    borderRadius: 28,
    borderWidth: 0,
  },
  listSection: {
    gap: 14,
  },
  emptyText: {
    color: '#74777F',
    textAlign: 'center',
    marginVertical: 32,
  },
});
