import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, Upload, CheckCircle2, User } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { userService } from '@/services/userService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function ReenviarDocumentosScreen() {
  const router = useRouter();

  const [fotoPerfil, setFotoPerfil] = useState<any>(null);
  const [comprovanteMatricula, setComprovanteMatricula] = useState<any>(null);
  const [comprovanteResidencia, setComprovanteResidencia] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setFotoPerfil(result.assets[0]);
    }
  };

  const pickDocument = async (tipo: 'matricula' | 'residencia') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });
    if (!result.canceled && result.assets[0]) {
      if (tipo === 'matricula') setComprovanteMatricula(result.assets[0]);
      if (tipo === 'residencia') setComprovanteResidencia(result.assets[0]);
    }
  };

  const handleReenviar = async () => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      if (fotoPerfil) {
        formData.append('foto_perfil', {
          uri: fotoPerfil.uri,
          name: fotoPerfil.fileName || 'perfil.jpg',
          type: 'image/jpeg',
        } as any);
      }
      if (comprovanteMatricula) {
        formData.append('comprovante_matricula', {
          uri: comprovanteMatricula.uri,
          name: comprovanteMatricula.name || 'matricula.pdf',
          type: comprovanteMatricula.mimeType || 'application/pdf',
        } as any);
      }
      if (comprovanteResidencia) {
        formData.append('comprovante_residencia', {
          uri: comprovanteResidencia.uri,
          name: comprovanteResidencia.name || 'residencia.pdf',
          type: comprovanteResidencia.mimeType || 'application/pdf',
        } as any);
      }

      await userService.reenviarDocumentos(formData);

      showPopup({
        type: 'success',
        title: 'Documentos Reenviados',
        message: 'Sua documentação foi reenviada com sucesso para nova análise da coordenação.',
        confirmText: 'OK',
        onConfirm: () => {
          closePopup();
          router.replace('/(autenticacao)/login');
        },
      });
    } catch (error: any) {
      const msg = getErrorMessage(error, 'Erro ao reenviar documentos. Tente novamente.');
      showPopup({
        type: 'error',
        title: 'Erro ao Reenviar',
        message: msg,
        confirmText: 'Entendido',
      });
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
        <Text variant="headlineSmall" style={styles.headerTitle}>Reenviar solicitação</Text>
      </View>

      {/* Pop-up Estilizado */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        onConfirm={popup.onConfirm}
        onDismiss={closePopup}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Imagem de Perfil */}
        <Text variant="labelLarge" style={styles.label}>Imagem de Perfil *</Text>
        <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
          {fotoPerfil ? (
            <Avatar.Image size={100} source={{ uri: fotoPerfil.uri }} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={48} color="#3E5F90" />
            </View>
          )}
        </TouchableOpacity>

        <Text variant="titleMedium" style={styles.sectionTitle}>Documentação</Text>

        {/* Comprovante de Matrícula */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.labelInput}>Comprovante de Matrícula *</Text>
          <Surface style={styles.uploadCard} elevation={1}>
            <TouchableOpacity onPress={() => pickDocument('matricula')} style={styles.uploadInner}>
              {comprovanteMatricula ? (
                <>
                  <CheckCircle2 size={24} color="#2E7D32" />
                  <Text style={styles.uploadTextSuccess} numberOfLines={1}>{comprovanteMatricula.name}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.uploadText}>Adicionar</Text>
                  <Upload size={20} color="#333" />
                </>
              )}
            </TouchableOpacity>
          </Surface>
        </View>

        {/* Comprovante de Residência */}
        <View style={styles.inputBox}>
          <Text variant="labelMedium" style={styles.labelInput}>Comprovante de Residência *</Text>
          <Surface style={styles.uploadCard} elevation={1}>
            <TouchableOpacity onPress={() => pickDocument('residencia')} style={styles.uploadInner}>
              {comprovanteResidencia ? (
                <>
                  <CheckCircle2 size={24} color="#2E7D32" />
                  <Text style={styles.uploadTextSuccess} numberOfLines={1}>{comprovanteResidencia.name}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.uploadText}>Adicionar</Text>
                  <Upload size={20} color="#333" />
                </>
              )}
            </TouchableOpacity>
          </Surface>
        </View>

        <Button
          mode="contained"
          onPress={handleReenviar}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.btnContent}
        >
          Reenviar
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
  },
  label: {
    color: '#333',
    marginBottom: 8,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3EFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  inputBox: {
    marginBottom: 20,
  },
  labelInput: {
    marginBottom: 6,
    color: '#666',
  },
  uploadCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E2EC',
    borderStyle: 'dashed',
  },
  uploadInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  uploadText: {
    color: '#333',
    fontWeight: '500',
  },
  uploadTextSuccess: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
    marginTop: 16,
  },
  btnContent: {
    height: 55,
  },
});
