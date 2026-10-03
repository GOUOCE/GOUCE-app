import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Avatar, Surface, useTheme, Portal, Modal, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LogOut, UserCircle, CreditCard, RefreshCw, ChevronRight, Pencil, Mail, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@contexts/AuthContext';
import { userService } from '@services/userService';
import { api } from '../../api/api';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function PerfilScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token, signOut, updateUser } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const perfilApi = await userService.getProfile();
        if (perfilApi) {
          await updateUser({
            name: perfilApi.nome || perfilApi.nome_completo,
            email: perfilApi.email,
            telefone: perfilApi.telefone,
            faculdade: perfilApi.faculdade_id,
            bairro: perfilApi.bairro_id,
            curso: perfilApi.curso,
            periodo_ingresso: perfilApi.periodo_ingresso,
            turno: perfilApi.turno_curso,
            foto_perfil: perfilApi.id_foto_aluno || perfilApi.foto_perfil,
            status: perfilApi.status_cadastro,
          });
        }
      } catch (err) {
        console.warn('Erro ao atualizar perfil:', err);
      }
    }
    carregarPerfil();
  }, []);

  const handleSignOut = async () => {
    setModalSairVisivel(false);
    await signOut();
  };

  const baseUrl = api.defaults.baseURL || 'http://192.168.0.3:8000';
  const fotoUri = user?.foto_perfil
    ? (user.foto_perfil.startsWith('http')
        ? user.foto_perfil
        : `${baseUrl}/arquivos/${user.foto_perfil}/view?token=${token || ''}`)
    : null;

  const imageSource = fotoUri
    ? {
        uri: fotoUri,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'ngrok-skip-browser-warning': 'true',
        },
      }
    : { uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop' };

  // Mapeamento dos badges de status
  const renderStatusBadge = () => {
    const status = (user?.status || '').toLowerCase();

    if (status === 'expirado' || status === 'vencido') {
      return (
        <Surface style={[styles.statusBadge, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <Text style={[styles.statusText, { color: '#B00020' }]}>
            Vinculo expirado - renovação necessária
          </Text>
        </Surface>
      );
    }

    if (status === 'analise_renovacao' || status === 'pendente') {
      return (
        <Surface style={[styles.statusBadge, { backgroundColor: '#FFF3E0' }]} elevation={0}>
          <Text style={[styles.statusText, { color: '#E65100' }]}>
            Pendente: vínculo em análise
          </Text>
        </Surface>
      );
    }

    return (
      <Surface style={[styles.statusBadge, { backgroundColor: '#E1F5FE' }]} elevation={0}>
        <Text style={[styles.statusText, { color: '#0288D1' }]}>
          Aprovado
        </Text>
      </Surface>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={() => setModalSairVisivel(true)}>
          <LogOut size={20} color="#904a45" />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Foto e Nome */}
        <View style={styles.profileSection}>
          <Avatar.Image
            size={120}
            source={imageSource}
          />
          <Text variant="headlineSmall" style={styles.userName}>{user?.name || 'João Neves'}</Text>
          {renderStatusBadge()}
        </View>

        {/* Informações Gerais */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Informações Gerais</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>E-mail</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.email || 'joao@email.com'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Telefone (WhatsApp)</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.telefone || '(88) 9 9999-9999'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Instituição - Campus</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.faculdade || 'UFC - Campus Quixadá'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Curso</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.curso || 'Engenharia de Software'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Período de Ingresso</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.periodo_ingresso || '2024.1'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Turno</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.turno || 'Noturno'}</Text>
            </View>
          </View>
        </View>

        {/* Ações da Conta */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Ações da Conta</Text>

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/editar-perfil')}>
            <Pencil size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Editar perfil</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/alterar-email')}>
            <Mail size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Alterar endereço de e-mail</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/carteirinha-digital')}>
            <CreditCard size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Ver carteirinha digital</Text>
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>

          <Divider style={styles.divider} />

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/renovar-vinculo')}>
            <RefreshCw size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Renovar vínculo institucional</Text>
            {user?.status === 'vencido' || user?.status === 'expirado' ? (
              <AlertCircle size={20} color="#B00020" style={{ marginRight: 4 }} />
            ) : null}
            <ChevronRight size={20} color="#999" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Sair do Aplicativo */}
      <AppPopup
        visible={modalSairVisivel}
        type="warning"
        title="Sair do aplicativo?"
        message="Você precisará fazer login novamente para agendar transportes."
        confirmText="Sim, sair"
        cancelText="Continuar"
        confirmColor="#904a45"
        onConfirm={handleSignOut}
        onDismiss={() => setModalSairVisivel(false)}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#904a45',
    fontWeight: '500',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  userName: {
    marginTop: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 13,
  },
  section: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 20,
  },
  infoLabel: {
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    color: '#333',
    fontWeight: '500',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  actionText: {
    flex: 1,
    color: '#333',
  },
  divider: {
    backgroundColor: '#E0E2EC',
  },
});
