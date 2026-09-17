import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Surface, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Upload, CheckCircle2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';

export default function RenovarVinculoScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [comprovante, setComprovante] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selecionarDocumento = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });

    if (!result.canceled) {
      setComprovante(result.assets[0]);
    }
  };

  const handleEnviar = async () => {
    if (!comprovante) {
      Alert.alert('Atenção', 'Por favor, anexe o comprovante de matrícula.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Enviando renovação:', comprovante);
      await new Promise(resolve => setTimeout(resolve, 2000));
      Alert.alert('Sucesso', 'Solicitação enviada com sucesso! Aguarde a análise.');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar documento.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Renovar Vínculo</Text>
      </View>

      <View style={styles.content}>
        {/* Aviso */}
        <Surface style={styles.alertCard} elevation={0}>
          <FileText size={24} color="#904a45" />
          <Text style={styles.alertText}>
            Vínculo expirado - renovação necessária
          </Text>
        </Surface>

        <Text variant="bodyLarge" style={styles.instruction}>
          Envie o comprovante de matrícula atualizado para revalidar seu vínculo institucional e voltar a agendar o transporte.
        </Text>

        <View style={styles.uploadSection}>
          <Text variant="labelLarge" style={styles.uploadLabel}>Comprovante de Matrícula *</Text>
          <TouchableOpacity
            style={[styles.dropzone, comprovante && styles.dropzoneActive]}
            onPress={selecionarDocumento}
          >
            {comprovante ? (
              <View style={styles.fileInfo}>
                <CheckCircle2 size={32} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.fileName}>{comprovante.name}</Text>
                <Text style={{ color: theme.colors.primary }}>Alterar arquivo</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="bodyLarge" style={styles.addText}>Adicionar</Text>
                <Upload size={24} color="#666" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <Button
          mode="contained"
          onPress={handleEnviar}
          loading={isLoading}
          disabled={isLoading}
          style={styles.submitButton}
          contentStyle={styles.buttonContent}
        >
          Enviar para análise
        </Button>
      </View>
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
    marginBottom: 40,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    paddingHorizontal: 24,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFEBEE',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  alertText: {
    color: '#904a45',
    fontWeight: '500',
    flex: 1,
  },
  instruction: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 40,
  },
  uploadSection: {
    marginBottom: 40,
  },
  uploadLabel: {
    color: '#333',
    marginBottom: 12,
  },
  dropzone: {
    height: 140,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#E0E2EC',
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropzoneActive: {
    borderStyle: 'solid',
    borderColor: '#3e5f90',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  addText: {
    color: '#333',
    fontWeight: '500',
  },
  fileInfo: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  fileName: {
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    borderRadius: 8,
    backgroundColor: '#3e5f90',
  },
  buttonContent: {
    height: 55,
  }
});
