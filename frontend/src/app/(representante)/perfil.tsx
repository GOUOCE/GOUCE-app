import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Surface, Text } from 'react-native-paper';
import { ArrowLeftRight, LogOut } from 'lucide-react-native';

import { useAuth } from '@contexts/AuthContext';
import { api } from '@/api/api';
import { userService } from '@/services/userService';
import { formatarInstituicao } from '@/utils/formatarInstituicao';
import { formatarCelular } from '@/utils/formatarTelefone';
import { calcularStatusAluno } from '@/utils/statusAluno';

function getIniciais(nome?: string): string {
  if (!nome) return 'RP';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return 'RP';
  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function getStatusConfig(statusBruto?: string): {
  label: string;
  bg: string;
  color: string;
} {
  const status = (statusBruto || '').toLowerCase();
  if (status === 'expirado' || status === 'vencido') {
    return {
      label: 'Vínculo expirado',
      bg: '#FFEBEE',
      color: '#B00020',
    };
  }
  if (status === 'analise_renovacao' || status === 'pendente') {
    return {
      label: 'Pendente: vínculo em análise',
      bg: '#FFF3E0',
      color: '#E65100',
    };
  }
  if (status === 'rejeitado') {
    return {
      label: 'Reprovado',
      bg: '#FFEBEE',
      color: '#B00020',
    };
  }
  return {
    label: 'Aprovado',
    bg: '#BCEEFF',
    color: '#004D67',
  };
}

/**
 * Tela de perfil do Representante da Universidade ([Geral] 59 - Perfil de Representante),
 * exibindo seus dados de vínculo estudantil e permitindo alternar para a visão de aluno ou sair.
 */
export default function RepresentativePerfilScreen() {
  const { user, token, signOut, updateUser, switchRole } = useAuth();
  const [modalTrocarVisaoVisivel, setModalTrocarVisaoVisivel] = useState(false);
  const [modalSairVisivel, setModalSairVisivel] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function carregarPerfil() {
      try {
        const perfilApi = await userService.getProfile();
        if (perfilApi && ativo) {
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
        console.warn('Erro ao atualizar perfil do representante:', err);
      }
    }

    void carregarPerfil();
    return () => {
      ativo = false;
    };
  }, [updateUser]);

  const baseUrl = api?.defaults?.baseURL || 'http://192.168.0.3:8000';
  const fotoUri = user?.foto_perfil
    ? user.foto_perfil.startsWith('http')
      ? user.foto_perfil
      : `${baseUrl}/arquivos/${user.foto_perfil}/view?token=${token || ''}`
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

  const showAvatarImage = Boolean(imageSource && !imageError);
  const statusConfig = getStatusConfig(user?.status);
  const instituicaoExibida =
    typeof user?.faculdade === 'string' && !/^\d+$/.test(user.faculdade.trim())
      ? user.faculdade.trim()
      : '-';

  const handleConfirmarTrocaVisao = async () => {
    setModalTrocarVisaoVisivel(false);
    await switchRole('ALUNO', 'Visão trocada para perfil de aluno');
  };

  const handleConfirmarSair = async () => {
    setModalSairVisivel(false);
    await signOut();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          {showAvatarImage ? (
            <Avatar.Image size={116} source={imageSource!} onError={() => setImageError(true)} />
          ) : (
            <Avatar.Text
              size={116}
              label={getIniciais(user?.name)}
              style={{ backgroundColor: '#3E5F90' }}
              labelStyle={{ color: '#FFFFFF', fontSize: 34, fontWeight: '700' }}
            />
          )}
          <Text style={styles.userName} testID="nome-perfil-representante">
            {user?.name || 'Representante'}
          </Text>
          <Surface style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]} elevation={0}>
            <Text style={[styles.statusText, { color: statusConfig.color }]} testID="badge-status-representante">
              {statusConfig.label}
            </Text>
          </Surface>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações Gerais</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>E-mail</Text>
              <Text style={styles.infoValue} testID="perfil-rep-email">
                {user?.email || '-'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Telefone (WhatsApp)</Text>
              <Text style={styles.infoValue} testID="perfil-rep-telefone">
                {formatarCelular(user?.telefone) || '-'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Instituição - Campus</Text>
              <Text style={styles.infoValue} testID="perfil-rep-instituicao">
                {instituicaoExibida}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Curso</Text>
              <Text style={styles.infoValue} testID="perfil-rep-curso">
                {user?.curso || '-'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Período de Ingresso</Text>
              <Text style={styles.infoValue} testID="perfil-rep-periodo">
                {user?.periodo_ingresso || '-'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Turno</Text>
              <Text style={styles.infoValue} testID="perfil-rep-turno">
                {user?.turno || '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.acoesFooter}>
          <TouchableOpacity
            style={styles.botaoTrocarVisao}
            activeOpacity={0.8}
            onPress={() => setModalTrocarVisaoVisivel(true)}
            accessibilityRole="button"
            accessibilityLabel="Trocar para a visão de aluno"
            testID="botao-trocar-visao-aluno"
          >
            <ArrowLeftRight size={18} color="#7C5800" />
            <Text style={styles.botaoTrocarVisaoTexto}>Trocar para a visão de aluno</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botaoSair}
            activeOpacity={0.8}
            onPress={() => setModalSairVisivel(true)}
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            testID="botao-sair-conta-representante"
          >
            <LogOut size={18} color="#904A43" />
            <Text style={styles.botaoSairTexto}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
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
              Tem certeza de que quer trocar a visão do aplicativo para sua conta de aluno?
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogActionBtn}
                onPress={() => setModalTrocarVisaoVisivel(false)}
                accessibilityRole="button"
                testID="botao-cancelar-troca-visao"
              >
                <Text style={styles.dialogCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogActionBtn}
                onPress={handleConfirmarTrocaVisao}
                accessibilityRole="button"
                testID="botao-confirmar-troca-visao"
              >
                <Text style={styles.dialogConfirmSwitchText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalSairVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalSairVisivel(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogCard}>
            <Text style={styles.dialogTitle}>Sair da conta?</Text>
            <Text style={styles.dialogMessage}>
              Você precisará fazer login novamente para registrar as chamadas.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={styles.dialogActionBtn}
                onPress={() => setModalSairVisivel(false)}
                accessibilityRole="button"
                testID="botao-cancelar-sair-representante"
              >
                <Text style={styles.dialogCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dialogActionBtn}
                onPress={handleConfirmarSair}
                accessibilityRole="button"
                testID="botao-confirmar-sair-representante"
              >
                <Text style={styles.dialogConfirmExitText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    paddingTop: 56,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#191C20',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  userName: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#191C20',
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#191C20',
    marginBottom: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  infoItem: {
    width: '48%',
    marginBottom: 18,
  },
  infoLabel: {
    fontSize: 11.5,
    color: '#5F6368',
    marginBottom: 3,
  },
  infoValue: {
    fontSize: 13.5,
    color: '#191C20',
    fontWeight: '500',
  },
  acoesFooter: {
    paddingHorizontal: 24,
    marginTop: 28,
    gap: 12,
  },
  botaoTrocarVisao: {
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
  botaoTrocarVisaoTexto: {
    color: '#7C5800',
    fontSize: 14,
    fontWeight: '600',
  },
  botaoSair: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#904A43',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  botaoSairTexto: {
    color: '#904A43',
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
  dialogConfirmSwitchText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#006A6A',
  },
  dialogConfirmExitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#904A43',
  },
});
