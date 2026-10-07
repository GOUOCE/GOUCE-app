import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Surface, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, AlertCircle } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useAuth } from '@contexts/AuthContext';
import { PrefeituraLogo } from '@/components/ui/Logos';
import { userService } from '@/services/userService';
import { api } from '../../api/api';

export default function CarteirinhaDigitalScreen() {
  const router = useRouter();
  const { user, token } = useAuth();

  const [carteirinhaData, setCarteirinhaData] = useState<any>(null);
  const [isIndisponivel, setIsIndisponivel] = useState(false);
  const [mensagemIndisponivel, setMensagemIndisponivel] = useState('');
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    async function carregarCarteirinha() {
      try {
        const data = await userService.getCarteirinha();
        if (data) {
          setCarteirinhaData(data);
          setIsIndisponivel(false);
          await AsyncStorage.setItem('@GOUOCE:carteirinha_cache', JSON.stringify(data));
        }
      } catch (err: any) {
        if (err.response?.status === 403 || err.response?.status === 401) {
          setIsIndisponivel(true);
          setMensagemIndisponivel(
            err.response?.data?.detail || 'Carteirinha indisponível. Seu cadastro está inativo ou em análise.'
          );
          return;
        }

        // Tenta carregar cache offline do AsyncStorage
        try {
          const cached = await AsyncStorage.getItem('@GOUOCE:carteirinha_cache');
          if (cached) {
            setCarteirinhaData(JSON.parse(cached));
            setIsOffline(true);
          } else if (user?.status === 'ativado') {
            setCarteirinhaData({
              nome: user.name,
              email: user.email,
              faculdade_id: user.faculdade,
              curso: user.curso,
              periodo_ingresso: user.periodo_ingresso,
              id_foto_aluno: user.foto_perfil,
            });
            setIsOffline(true);
          } else {
            setIsIndisponivel(true);
            setMensagemIndisponivel('Carteirinha indisponível. Seu cadastro está inativo ou em análise.');
          }
        } catch {
          setIsIndisponivel(true);
          setMensagemIndisponivel('Carteirinha indisponível no momento.');
        }
      }
    }
    carregarCarteirinha();
  }, [user]);

  if (isIndisponivel) {
    return (
      <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={32} color="#333" />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>Carteirinha Digital</Text>
        </View>

        <View style={styles.indisponivelContent}>
          <AlertCircle size={64} color="#E65100" />
          <Text variant="titleMedium" style={styles.indisponivelTitle}>Carteirinha Indisponível</Text>
          <Text variant="bodyMedium" style={styles.indisponivelText}>
            {mensagemIndisponivel || 'Carteirinha indisponível. Seu cadastro está inativo ou em análise.'}
          </Text>
        </View>
      </View>
    );
  }

  // Dados reais combinados (API / Cache)
  const idFoto = carteirinhaData?.id_foto_aluno || user?.foto_perfil;
  const baseUrl = api.defaults.baseURL || 'http://192.168.0.4:8000';
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
    : undefined;

  const nomeAluno = carteirinhaData?.nome || user?.name || '';
  const emailAluno = carteirinhaData?.email || user?.email || '';

  const inst = carteirinhaData?.faculdade_id || user?.faculdade || 'UFC';
  const campus = carteirinhaData?.campus || 'Quixadá';
  const instituicaoTexto = inst.includes('Campus') ? inst : `${inst} - Campus ${campus}`;

  const cursoAluno = carteirinhaData?.curso || user?.curso || '';
  const ingressoAluno = carteirinhaData?.periodo_ingresso || user?.periodo_ingresso || '';
  const cursoIngressoTexto = cursoAluno ? `${cursoAluno}${ingressoAluno ? ` - ${ingressoAluno}` : ''}` : '';

  const qrcodeValue = JSON.stringify({
    id: carteirinhaData?.id || user?.id,
    email: emailAluno,
    status: 'Aprovado',
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
            {imageSource ? (
              <Avatar.Image
                size={95}
                source={imageSource}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                size={95}
                label={nomeAluno ? nomeAluno.substring(0, 2).toUpperCase() : 'AL'}
                style={[styles.avatar, { backgroundColor: '#3E5F90' }]}
                labelStyle={{ color: '#FFF' }}
              />
            )}

            <View style={styles.infoWrapper}>
              <Text variant="titleLarge" style={styles.userName}>
                {nomeAluno}
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                {instituicaoTexto}
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                {cursoIngressoTexto}
              </Text>
              <Text variant="bodySmall" style={styles.infoText}>
                {emailAluno}
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
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Disponível offline</Text>
          </View>
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
    gap: 4,
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
  indisponivelContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  indisponivelTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  indisponivelText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
});
