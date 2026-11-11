import React, { useCallback, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, Surface, Avatar, ActivityIndicator } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft, Upload, CheckCircle2, User } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { userService } from '@/services/userService';
import { useAuth } from '@contexts/AuthContext';
import { getErrorMessage } from '@/utils/errorUtils';
import {
  DICA_ARQUIVO_DOCUMENTO,
  formatarNomeTipoDocumento,
  validarArquivoDocumento,
} from '@/utils/documentosCadastro';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

type DocumentoReprovado = { tipo: string; motivo: string };

export default function ReenviarDocumentosScreen() {
  const router = useRouter();
  const { updateUser } = useAuth();

  // Só os documentos reprovados podem ser reenviados; os aprovados não aparecem (AC-05 e AC-07).
  const [documentosReprovados, setDocumentosReprovados] = useState<DocumentoReprovado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState(false);
  const [arquivos, setArquivos] = useState<Record<string, any>>({});
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

  const buscarReprovados = useCallback(async () => {
    try {
      const res = await userService.getReenvioDocumento();
      const lista = res?.documentos_rejeitados ?? res?.documentos ?? [];
      setDocumentosReprovados(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.warn('Erro ao carregar os documentos reprovados:', err);
      setErroCarregamento(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      buscarReprovados();
    }, [buscarReprovados])
  );

  const tentarNovamente = () => {
    setCarregando(true);
    setErroCarregamento(false);
    buscarReprovados();
  };

  const voltar = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(autenticacao)/cadastro-rejeitado' as any);
    }
  };

  // Valida na hora (formato e 5 MB), antes de enviar, com as mesmas mensagens do cadastro.
  const selecionarArquivo = (tipo: string, arquivo: any) => {
    const erro = validarArquivoDocumento(arquivo);
    if (erro) {
      showPopup({
        type: 'error',
        title: 'Arquivo inválido',
        message: erro,
        confirmText: 'Entendido',
        onConfirm: closePopup,
      });
      return;
    }
    setArquivos((prev) => ({ ...prev, [tipo]: arquivo }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      selecionarArquivo('foto_perfil', result.assets[0]);
    }
  };

  const pickDocument = async (tipo: 'comprovante_matricula' | 'comprovante_residencia') => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });
    if (!result.canceled && result.assets[0]) {
      selecionarArquivo(tipo, result.assets[0]);
    }
  };

  const handleReenviar = async () => {
    const faltando = documentosReprovados.filter((doc) => !arquivos[doc.tipo]);
    if (faltando.length > 0) {
      showPopup({
        type: 'warning',
        title: 'Documentos pendentes',
        message: `Selecione o novo arquivo de: ${faltando.map((doc) => formatarNomeTipoDocumento(doc.tipo)).join(', ')}.`,
        confirmText: 'Entendido',
        onConfirm: closePopup,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Sem simulação: se a API recusar ou a rede falhar, o erro aparece e o status continua Reprovado (FA-003).
      const enviados: Record<string, any> = {};
      documentosReprovados.forEach((doc) => {
        enviados[doc.tipo] = arquivos[doc.tipo];
      });
      await userService.reenviarDocumentos(enviados);

      // O status só muda depois da resposta do servidor (Critério de Aceite 6).
      await updateUser({ status: 'pendente' });

      showPopup({
        type: 'success',
        title: 'Documentos Reenviados',
        message: 'Sua documentação foi reenviada com sucesso. Seu status foi atualizado para Pendente de Aprovação.',
        confirmText: 'OK',
        onConfirm: () => {
          closePopup();
          router.replace('/(autenticacao)/cadastro-pendente');
        },
      });
    } catch (error: any) {
      const msg = getErrorMessage(error, 'Não foi possível reenviar os documentos. Tente novamente.');
      showPopup({
        type: 'error',
        title: 'Erro ao Reenviar',
        message: msg,
        confirmText: 'Entendido',
        onConfirm: closePopup,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCampo = (doc: DocumentoReprovado) => {
    const arquivo = arquivos[doc.tipo];

    if (doc.tipo === 'foto_perfil') {
      return (
        <View key={doc.tipo} style={styles.inputBox}>
          <Text variant="labelLarge" style={styles.label}>Imagem de Perfil *</Text>
          <Text style={styles.motivo}>{doc.motivo}</Text>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {arquivo ? (
              <Avatar.Image size={100} source={{ uri: arquivo.uri }} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={48} color="#3E5F90" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.acaoFoto}>{arquivo ? 'Toque na foto para trocar' : 'Toque no círculo para escolher a foto'}</Text>
          <Text style={styles.dica}>{DICA_ARQUIVO_DOCUMENTO}</Text>
        </View>
      );
    }

    const tipo = doc.tipo as 'comprovante_matricula' | 'comprovante_residencia';
    return (
      <View key={doc.tipo} style={styles.inputBox}>
        <Text variant="labelMedium" style={styles.labelInput}>{formatarNomeTipoDocumento(doc.tipo)} *</Text>
        <Text style={styles.motivo}>{doc.motivo}</Text>
        <Surface style={styles.uploadCard} elevation={1}>
          <TouchableOpacity onPress={() => pickDocument(tipo)} style={styles.uploadInner}>
            {arquivo ? (
              <>
                <CheckCircle2 size={24} color="#2E7D32" />
                <Text style={styles.uploadTextSuccess} numberOfLines={1}>{arquivo.name}</Text>
              </>
            ) : (
              <>
                <Text style={styles.uploadText}>Adicionar</Text>
                <Upload size={20} color="#333" />
              </>
            )}
          </TouchableOpacity>
        </Surface>
        <Text style={styles.dica}>{DICA_ARQUIVO_DOCUMENTO}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={voltar}>
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
        {carregando ? (
          <ActivityIndicator animating color="#3E5F90" style={styles.loading} />
        ) : erroCarregamento ? (
          <>
            <Text style={styles.erroTexto}>
              Não foi possível carregar os documentos a reenviar. Verifique sua conexão e tente novamente.
            </Text>
            <Button mode="contained" onPress={tentarNovamente} style={styles.button} contentStyle={styles.btnContent}>
              Tentar novamente
            </Button>
          </>
        ) : (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Documentos a reenviar</Text>

            {documentosReprovados.map(renderCampo)}

            <Button
              mode="contained"
              onPress={handleReenviar}
              loading={isLoading}
              disabled={isLoading || documentosReprovados.length === 0}
              style={styles.button}
              contentStyle={styles.btnContent}
            >
              Reenviar
            </Button>
          </>
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
  motivo: {
    color: '#8A5200',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  acaoFoto: {
    textAlign: 'center',
    color: '#3E5F90',
    fontWeight: '600',
  },
  dica: {
    marginTop: 6,
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  loading: {
    marginTop: 40,
  },
  erroTexto: {
    color: '#B00020',
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 24,
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
