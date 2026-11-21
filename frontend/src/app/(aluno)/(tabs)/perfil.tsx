import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Avatar, Surface, useTheme, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import {
  ArrowLeftRight,
  LogOut,
  CreditCard,
  RefreshCw,
  ChevronRight,
  Pencil,
  Mail,
  AlertCircle,
  ClipboardCheck,
} from 'lucide-react-native';

import { useAuth } from '@contexts/AuthContext';
import { userService } from '@/services/userService';
import { api } from '@/api/api';
import { AppPopup } from '@/components/ui/AppPopup';
import { formatarCelular } from '@/utils/formatarTelefone';
import { calcularStatusAluno } from '@/utils/statusAluno';
import { formatarInstituicao } from '@/utils/formatarInstituicao';

export default function PerfilScreen() {
  const _theme = useTheme();
  const router = useRouter();
  const { user, token, signOut, updateUser, switchRole } = useAuth();
  const [modalSairVisivel, setModalSairVisivel] = useState(false);
  const [modalTrocarVisaoVisivel, setModalTrocarVisaoVisivel] = useState(false);
  const [imageError, setImageError] = useState(false);
  const ehRepresentante = Boolean(user?.roles?.includes('MOTORISTA'));

  const handleConfirmarTrocaVisao = async () => {
    setModalTrocarVisaoVisivel(false);
    await switchRole('MOTORISTA', 'Visão trocada para perfil de representante');
  };

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const perfilApi = await userService.getProfile();
        if (perfilApi) {
          await updateUser({
            name: perfilApi.nome || perfilApi.nome_completo,
            email: perfilApi.email,
            telefone: perfilApi.telefone,
            faculdade: formatarInstituicao(perfilApi),
            bairro: perfilApi.bairro_id,
            curso: perfilApi.curso,
            periodo_ingresso: perfilApi.periodo_ingresso,
            turno: perfilApi.turno_curso,
            foto_perfil: perfilApi.id_foto_aluno || perfilApi.foto_perfil,
            status: calcularStatusAluno(perfilApi.status_cadastro, perfilApi.acesso_expirado),
          });
        }
      } catch (err) {
        console.warn('Erro ao atualizar perfil:', err);
      }
    }
    carregarPerfil();
  }, [updateUser]);

  const handleSignOut = async () => {
    setModalSairVisivel(false);
    await signOut();
  };

  const baseUrl = api?.defaults?.baseURL || 'http://192.168.0.3:8000';
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
    : null;

  const showAvatarImage = imageSource && !imageError;

  // Sem foto cadastrada, mostra as iniciais
  const getIniciais = (nome?: string) => {
    if (!nome) return 'AL';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  // Mapeamento dos badges de status
  const renderStatusBadge = () => {
    const status = (user?.status || '').toLowerCase();

    if (status === 'expirado' || status === 'vencido') {
      return (
        <Surface style={[styles.statusBadge, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <Text style={[styles.statusText, { color: '#B00020' }]}>
            Vínculo expirado - renovação necessária
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

    if (status === 'rejeitado') {
      return (
        <Surface style={[styles.statusBadge, { backgroundColor: '#FFEBEE' }]} elevation={0}>
          <Text style={[styles.statusText, { color: '#B00020' }]}>
            Reprovado - Cadastro recusado
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
          {showAvatarImage ? (
            <Avatar.Image size={120} source={imageSource} onError={() => setImageError(true)} />
          ) : (
            <Avatar.Text
              size={120}
              label={getIniciais(user?.name)}
              style={{ backgroundColor: '#3E5F90' }}
              labelStyle={{ color: '#FFF', fontSize: 36, fontWeight: 'bold' }}
            />
          )}
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
              <Text variant="bodyMedium" style={styles.infoValue}>{formatarCelular(user?.telefone)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text variant="labelSmall" style={styles.infoLabel}>Instituição - Campus</Text>
              <Text variant="bodyMedium" style={styles.infoValue}>{user?.faculdade || '-'}</Text>
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

          <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(aluno)/status-cadastro' as any)}>
            <ClipboardCheck size={24} color="#333" />
            <Text variant="bodyLarge" style={styles.actionText}>Status do cadastro</Text>
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

        {ehRepresentante && (
          <View style={styles.switchRoleSection}>
            <TouchableOpacity
              style={styles.botaoTrocarRepresentante}
              activeOpacity={0.8}
              onPress={() => setModalTrocarVisaoVisivel(true)}
              accessibilityRole="button"
              accessibilityLabel="Trocar para a visão de representante"
              testID="botao-trocar-visao-representante"
            >
              <ArrowLeftRight size={18} color="#7C5800" />
              <Text style={styles.botaoTrocarRepresentanteTexto}>
                Trocar para a visão de representante
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalTrocarVisaoVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalTrocarVisaoVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Trocar visão?</Text>
            <Text style={styles.dialogMessage}>
              Tem certeza de que quer trocar a visão do aplicativo para sua conta de representante?
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogActionBtn}
                onPress={() => setModalTrocarVisaoVisivel(false)}
                accessibilityRole="button"
                testID="botao-cancelar-troca-visao-representante"
              >
                <Text style={styles.dialogCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogActionBtn}
                onPress={handleConfirmarTrocaVisao}
                accessibilityRole="button"
                testID="botao-confirmar-troca-visao-representante"
              >
                <Text style={styles.dialogConfirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  switchRoleSection: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  botaoTrocarRepresentante: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7C5800',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  botaoTrocarRepresentanteTexto: {
    color: '#7C5800',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ECEEF4',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#191C20',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 14,
    color: '#44474E',
    lineHeight: 20,
    marginBottom: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 18,
  },
  dialogActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  dialogCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3E5F90',
  },
  dialogConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006A6A',
  },
});
