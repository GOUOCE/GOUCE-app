import React, { useCallback, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { AlertCircle } from 'lucide-react-native';

import { userService } from '@/services/userService';
import { useAuth } from '@contexts/AuthContext';
import { formatarNomeTipoDocumento } from '@/utils/documentosCadastro';

type DocumentoReprovado = { tipo: string; motivo: string };

export default function CadastroRejeitadoScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [documentosReenvio, setDocumentosReenvio] = useState<DocumentoReprovado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  const buscarReenvio = useCallback(async () => {
    try {
      const res = await userService.getReenvioDocumento();
      const lista = res?.documentos_rejeitados ?? res?.documentos ?? [];
      setDocumentosReenvio(Array.isArray(lista) ? lista : []);
    } catch (err) {
      // Falha de leitura nunca vira "sem pendências": mostra o erro e deixa tentar de novo.
      console.warn('Erro ao carregar reenvio de documento:', err);
      setDocumentosReenvio([]);
      setErroCarregamento(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Ao voltar da tela de reenvio a lista é lida de novo.
  useFocusEffect(
    useCallback(() => {
      buscarReenvio();
    }, [buscarReenvio])
  );

  const tentarNovamente = () => {
    setCarregando(true);
    setErroCarregamento(false);
    buscarReenvio();
  };

  const handleSair = async () => {
    await signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status do Cadastro */}
        <Surface style={styles.statusBadge} elevation={0}>
          <Text style={styles.statusText}>Status do Cadastro: Reprovado</Text>
        </Surface>

        {carregando ? (
          <View style={styles.iconContainer}>
            <ActivityIndicator animating color="#3E5F90" />
          </View>
        ) : erroCarregamento ? (
          <>
            <View style={styles.iconContainer}>
              <AlertCircle size={80} color="#B00020" strokeWidth={1.5} />
            </View>
            <Surface style={styles.errorCard} elevation={1}>
              <Text style={styles.errorText}>
                Não foi possível carregar os motivos da reprovação. Verifique sua conexão e tente novamente.
              </Text>
            </Surface>
            <Button mode="contained" onPress={tentarNovamente} style={styles.button} contentStyle={styles.btnContent}>
              Tentar novamente
            </Button>
          </>
        ) : (
          <>
            <View style={styles.iconContainer}>
              <AlertCircle size={80} color="#B5651D" strokeWidth={1.5} />
            </View>

            <Text variant="headlineSmall" style={styles.title}>
              Opa! Precisamos que você ajuste algumas coisas.
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sua documentação inicial foi recusada. Por gentileza, reenvie a documentação abaixo atentando-se às
              observações feitas pelo administrador.
            </Text>

            <View style={styles.listSection}>
              {documentosReenvio.map((doc, idx) => (
                <Surface key={idx} style={styles.docCard} elevation={1}>
                  <Text variant="titleMedium" style={styles.docName}>{formatarNomeTipoDocumento(doc.tipo)}</Text>
                  <Text variant="bodyMedium" style={styles.docReason}>{doc.motivo}</Text>
                </Surface>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => router.push('/(autenticacao)/reenviar-documentos' as any)}
              style={styles.button}
              contentStyle={styles.btnContent}
              disabled={documentosReenvio.length === 0}
            >
              Corrigir documentação
            </Button>
          </>
        )}

        <Button mode="text" onPress={handleSair} style={styles.sairButton}>
          Sair
        </Button>
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
  statusText: {
    color: '#B00020',
    fontWeight: 'bold',
    fontSize: 14,
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
  sairButton: {
    marginTop: 16,
  },
});
