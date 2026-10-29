import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Surface, Avatar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@contexts/AuthContext';
import { PrefeituraLogo } from '@/components/ui/Logos';
import { userService } from '@/services/userService';
import { api } from '../../api/api';

export default function CarteirinhaDigitalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, token } = useAuth();

  const [carteirinhaData, setCarteirinhaData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function carregarCarteirinha() {
      setIsLoading(true);
      try {
        const data = await userService.getCarteirinha();
        if (data) {
          setCarteirinhaData(data);
        }
      } catch (err) {
        console.warn('Carteirinha offline ou em carregamento, usando cache do usuário:', err);
      } finally {
        setIsLoading(false);
      }
    }
    carregarCarteirinha();
  }, []);

  // Dados reais combinados (API / Cache)
  const idFoto = carteirinhaData?.id_foto_aluno || user?.foto_perfil;
  const baseUrl = api.defaults.baseURL || 'http://192.168.0.3:8000';
  const fotoUri = idFoto
    ? (idFoto.startsWith('http')
        ? idFoto
        : `${baseUrl}/arquivos/${idFoto}/view?token=${token || ''}`)
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

  const nomeAluno = carteirinhaData?.nome || user?.name || 'João Neves';
  const emailAluno = carteirinhaData?.email || user?.email || 'joao@email.com';

  const inst = carteirinhaData?.faculdade_id || user?.faculdade || 'UFC';
  const campus = carteirinhaData?.campus || 'Campus Quixadá';
  const instituicaoTexto = inst.includes('Campus') ? inst : `${inst} - ${campus.includes('Campus') ? campus : `Campus ${campus}`}`;

  const cursoAluno = carteirinhaData?.curso || user?.curso || 'Engenharia de Software';
  const ingressoAluno = carteirinhaData?.periodo_ingresso || user?.periodo_ingresso || '2024.1';
  const cursoIngressoTexto = `${cursoAluno} - ${ingressoAluno}`;

  const emissao = '10/09/2026';
  const qrcodeValue = JSON.stringify({
    id: carteirinhaData?.id || user?.id,
    email: emailAluno,
    token: token ? token.slice(0, 20) : 'gouoce_token',
  });

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Carteirinha Digital</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="bodyMedium" style={styles.description}>
          Apresente esta tela ao representante no momento do embarque.
        </Text>

        {/* Cartão da Carteirinha */}
        <Surface style={styles.card} elevation={1}>
          {/* Parte Superior: Foto + Dados */}
          <View style={styles.cardTopRow}>
            <Avatar.Image
              size={95}
              source={imageSource}
              style={styles.avatar}
            />

            <View style={styles.infoWrapper}>
              <Text variant="titleLarge" style={styles.userName} numberOfLines={1}>
                {nomeAluno}
              </Text>
              <Text variant="bodySmall" style={styles.infoText} numberOfLines={1}>
                {instituicaoTexto}
              </Text>
              <Text variant="bodySmall" style={styles.infoText} numberOfLines={1}>
                {cursoIngressoTexto}
              </Text>
              <Text variant="bodySmall" style={styles.infoText} numberOfLines={1}>
                {emailAluno}
              </Text>
              <Text variant="labelSmall" style={styles.emissionText}>
                Data de Emissão: {emissao}
              </Text>
            </View>
          </View>

          {/* Parte Inferior: QR Code + Logo Prefeitura */}
          <View style={styles.cardBottomRow}>
            <View style={styles.qrCodeContainer}>
              <QRCode
                value={qrcodeValue}
                size={85}
                color="#000"
                backgroundColor="#FFF"
              />
            </View>

            <View style={styles.logoContainer}>
              <PrefeituraLogo width={120} height={50} />
            </View>
          </View>
        </Surface>

        {/* Badge Disponível Offline */}
        <View style={styles.offlineBadge}>
          <Text style={styles.offlineText}>Disponível offline</Text>
        </View>
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
    marginBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingBottom: 40,
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 28,
    lineHeight: 20,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 20,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatar: {
    backgroundColor: '#E3EFFF',
  },
  infoWrapper: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 18,
    marginBottom: 2,
  },
  infoText: {
    color: '#555',
    fontSize: 13,
    lineHeight: 18,
  },
  emissionText: {
    color: '#777',
    fontSize: 11,
    marginTop: 6,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  qrCodeContainer: {
    padding: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
  },
  logoContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  offlineBadge: {
    marginTop: 28,
    backgroundColor: '#DCE7FE',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  offlineText: {
    color: '#3E5F90',
    fontWeight: '500',
    fontSize: 14,
  },
});
