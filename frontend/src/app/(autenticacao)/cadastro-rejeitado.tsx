import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Button, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { AlertCircle, CheckCircle2 } from 'lucide-react-native';

import { userService } from '@/services/userService';

const OBSERVACOES_PADRAO = [
  { tipo: 'comprovante_residencia', motivo: 'O comprovante enviado é muito antigo. Enviar um comprovante de no máximo 3 meses atrás.' },
];

export default function CadastroRejeitadoScreen() {
  const router = useRouter();
  const [documentosReenvio, setDocumentosReenvio] = useState<{ tipo: string; motivo: string }[]>(OBSERVACOES_PADRAO);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const perfil = await userService.getProfile();
        if (perfil && perfil.documentos_reenvio && perfil.documentos_reenvio.length > 0) {
          setDocumentosReenvio(perfil.documentos_reenvio);
        }
      } catch (err) {
        console.warn('Erro ao carregar documentos de reenvio, utilizando observações padrão:', err);
      }
    }
    carregarPerfil();
  }, []);

  const formatarNomeTipo = (tipo: string) => {
    if (tipo === 'comprovante_matricula') return 'Comprovante de Matrícula';
    if (tipo === 'comprovante_residencia') return 'Comprovante de residência';
    if (tipo === 'foto_perfil') return 'Foto de Perfil';
    return tipo;
  };

  const handleCorrigir = () => {
    router.replace('/(autenticacao)/reenviar-documentos' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status do Cadastro */}
        <Surface style={styles.statusBadge} elevation={0}>
          <Text style={styles.statusText}>Status do Cadastro: Reprovado</Text>
        </Surface>

        {/* Ícone de Alerta */}
        <View style={styles.iconContainer}>
          <AlertCircle size={80} color="#B5651D" strokeWidth={1.5} />
        </View>

        <Text variant="headlineSmall" style={styles.title}>
          Opa! Precisamos que você ajuste algumas coisas.
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Sua documentação inicial foi recusada. Por gentileza, reenvie a documentação abaixo atentando-se às observações feitas pelo administrador.
        </Text>

        <View style={styles.listSection}>
          {documentosReenvio.map((doc, idx) => (
            <Surface key={idx} style={styles.docCard} elevation={1}>
              <Text variant="titleMedium" style={styles.docName}>{formatarNomeTipo(doc.tipo)}</Text>
              <Text variant="bodyMedium" style={styles.docReason}>{doc.motivo}</Text>
            </Surface>
          ))}
        </View>

        <Button
          mode="contained"
          onPress={handleCorrigir}
          style={styles.button}
          contentStyle={styles.btnContent}
        >
          Corrigir documentação
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
  button: {
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  btnContent: {
    height: 55,
  },
});
