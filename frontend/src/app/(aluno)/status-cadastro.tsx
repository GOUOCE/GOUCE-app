import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, CheckCircle2, Clock } from 'lucide-react-native';

import { useAuth } from '@contexts/AuthContext';

// HU-031 (AC-01, AC-02, AC-08 e FA-001): consulta do status do cadastro para o aluno já aprovado.
// O reprovado é levado à tela de motivos/reenvio e o pendente à tela de análise (ver AuthContext e _layout).
export default function StatusCadastroScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const status = (user?.status || '').toLowerCase();
  const aprovado = status === 'ativado' || status === 'aprovado';

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(aluno)/(tabs)/perfil' as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={voltar}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Status do Cadastro</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Surface style={[styles.statusBadge, !aprovado && styles.statusBadgeOutro]} elevation={0}>
          <Text style={[styles.statusText, !aprovado && styles.statusTextOutro]}>
            Status do Cadastro: {aprovado ? 'Aprovado' : 'Em análise'}
          </Text>
        </Surface>

        <View style={styles.iconContainer}>
          {aprovado ? (
            <CheckCircle2 size={80} color="#2E7D32" strokeWidth={1.5} />
          ) : (
            <Clock size={80} color="#E65100" strokeWidth={1.5} />
          )}
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          {aprovado ? 'Tudo certo com seus documentos!' : 'Seu cadastro está em análise'}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {aprovado
            ? 'Não há pendências no seu cadastro. Todos os seus documentos foram analisados e aprovados!'
            : 'Sua solicitação será avaliada pela coordenação. Você será notificado quando houver uma resposta.'}
        </Text>
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
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#E1F5FE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusBadgeOutro: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    color: '#0288D1',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusTextOutro: {
    color: '#E65100',
  },
  iconContainer: {
    marginVertical: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
    marginBottom: 32,
  },
});
