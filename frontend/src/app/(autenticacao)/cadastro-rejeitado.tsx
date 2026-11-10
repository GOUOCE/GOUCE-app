import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';

import { userService } from '@/services/userService';
import { useAuth } from '@contexts/AuthContext';

export default function CadastroRejeitadoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [documentosReenvio, setDocumentosReenvio] = useState<{ tipo: string; motivo: string }[]>([]);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  const isAprovado = (user?.status || '').toLowerCase() === 'ativado' || (user?.status || '').toLowerCase() === 'aprovado';

  useEffect(() => {
    async function carregarReenvio() {
      setErroCarregamento(false);
      try {
        const res = await userService.getReenvioDocumento();
        if (res && res.documentos_rejeitados && res.documentos_rejeitados.length > 0) {
          setDocumentosReenvio(res.documentos_rejeitados);
        } else if (res && res.documentos && res.documentos.length > 0) {
          setDocumentosReenvio(res.documentos);
        } else {
          setDocumentosReenvio([]);
        }
      } catch (err) {
        console.warn('Erro ao carregar reenvio de documento:', err);
        if (!isAprovado) {
          setErroCarregamento(true);
        } else {
          setDocumentosReenvio([]);
        }
      }
    }
    carregarReenvio();
  }, [isAprovado]);

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'comprovante_matricula') return 'Comprovante de Matrícula';
    if (tipo === 'comprovante_residencia') return 'Comprovante de Residência';
    if (tipo === 'foto_perfil') return 'Foto de Perfil';
    return tipo;
  };

  const semPendencias = isAprovado || documentosReenvio.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status do Cadastro */}
        <Surface style={[styles.statusBadge, isAprovado && styles.statusBadgeAprovado]} elevation={0}>
          <Text style={[styles.statusText, isAprovado && styles.statusTextAprovado]}>
            Status do Cadastro: {isAprovado ? 'Aprovado' : 'Reprovado'}
          </Text>
        </Surface>

        {/* Ícone */}
        <View style={styles.iconContainer}>
          {semPendencias ? (
            <CheckCircle2 size={80} color="#2E7D32" strokeWidth={1.5} />
          ) : (
            <AlertCircle size={80} color="#B5651D" strokeWidth={1.5} />
          )}
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          {semPendencias
            ? 'Tudo certo com seus documentos!'
            : 'Opa! Precisamos que você ajuste algumas coisas.'}
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {semPendencias
            ? 'Não há pendências no seu cadastro. Todos os seus documentos foram analisados e aprovados!'
            : 'Sua documentação inicial foi recusada. Por gentileza, reenvie a documentação abaixo atentando-se às observações feitas pelo administrador.'}
        </Text>

        {erroCarregamento ? (
          <Surface style={styles.errorCard} elevation={1}>
            <Text style={styles.errorText}>Não foi possível carregar os motivos da reprovação. Verifique sua conexão e tente novamente.</Text>
          </Surface>
        ) : !semPendencias ? (
          <View style={styles.listSection}>
            {documentosReenvio.map((doc, idx) => (
              <Surface key={idx} style={styles.docCard} elevation={1}>
                <Text variant="titleMedium" style={styles.docName}>{formatarNomeTipo(doc.tipo)}</Text>
                <Text variant="bodyMedium" style={styles.docReason}>{doc.motivo}</Text>
              </Surface>
            ))}
          </View>
        ) : (
          <Surface style={styles.noPendingCard} elevation={1}>
            <Text style={styles.noPendingText}>Nenhuma pendência encontrada. Todos os seus documentos foram aprovados!</Text>
          </Surface>
        )}

        {!semPendencias && !erroCarregamento && (
          <Button
            mode="contained"
            onPress={() => router.push('/(autenticacao)/reenviar-documentos')}
            style={styles.button}
            contentStyle={styles.btnContent}
          >
            Corrigir documentação
          </Button>
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusBadgeAprovado: {
    backgroundColor: '#E1F5FE',
  },
  statusText: {
    color: '#B00020',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusTextAprovado: {
    color: '#0288D1',
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
  listSection: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  docCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#B5651D',
  },
  docName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  docReason: {
    color: '#8A5200',
    fontSize: 14,
    lineHeight: 20,
  },
  noPendingCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  noPendingText: {
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 32,
  },
  errorText: {
    color: '#B00020',
    fontWeight: '600',
    textAlign: 'center',
  },
  button: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  btnContent: {
    height: 55,
  },
});
