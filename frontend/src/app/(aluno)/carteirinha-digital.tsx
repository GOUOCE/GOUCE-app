import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Surface, Avatar, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ChevronLeft, WifiOff } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '@contexts/AuthContext';
import { PrefeituraLogo } from '@/components/ui/Logos';

export default function CarteirinhaDigitalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  // Dados mockados para a carteirinha
  const dadosCarteirinha = {
    instituicao: 'UFC - Campus Quixadá',
    curso: 'Engenharia de Software',
    ingresso: '2024.1',
    emissao: '16/09/2026',
    qrcode: JSON.stringify({ id: user?.id, email: user?.email, exp: '2026-12-31' })
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Carteirinha Digital</Text>
      </View>

      <View style={styles.content}>
        <Text variant="bodyLarge" style={styles.description}>
          Apresente esta tela ao representante no momento do embarque.
        </Text>

        {/* Cartão Digital */}
        <Surface style={styles.card} elevation={2}>
          <View style={styles.cardHeader}>
            <Avatar.Image
              size={100}
              source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop' }}
            />
            <View style={styles.userMainInfo}>
              <Text variant="titleLarge" style={styles.userName}>{user?.name || 'João Neves'}</Text>
              <Text variant="bodySmall" style={styles.courseInfo}>{dadosCarteirinha.instituicao}</Text>
              <Text variant="bodySmall" style={styles.courseInfo}>
                {dadosCarteirinha.curso} - {dadosCarteirinha.ingresso}
              </Text>
              <Text variant="bodySmall" style={styles.emailInfo}>{user?.email || 'joao@email.com'}</Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.qrCodeBox}>
              <QRCode
                value={dadosCarteirinha.qrcode}
                size={100}
                color="black"
                backgroundColor="white"
              />
            </View>

            <View style={styles.footerRight}>
              <Text variant="labelSmall" style={styles.emissionDate}>
                Data de Emissão: {dadosCarteirinha.emissao}
              </Text>
              <PrefeituraLogo width={60} height={60} />
            </View>
          </View>
        </Surface>

        {/* Badge Offline */}
        <Surface style={styles.offlineBadge} elevation={0}>
          <WifiOff size={16} color="#3e5f90" />
          <Text style={styles.offlineText}>Disponível offline</Text>
        </Surface>
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
    alignItems: 'center',
  },
  description: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    backgroundColor: '#fff',
    padding: 24,
    gap: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 16,
  },
  userMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  courseInfo: {
    color: '#666',
    lineHeight: 16,
  },
  emailInfo: {
    color: '#666',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  qrCodeBox: {
    padding: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    borderRadius: 12,
  },
  footerRight: {
    alignItems: 'flex-end',
    gap: 8,
    flex: 1,
  },
  emissionDate: {
    color: '#999',
  },
  logoPrefeitura: {
    width: 120,
    height: 40,
  },
  offlineBadge: {
    marginTop: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8EAF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  offlineText: {
    color: '#3e5f90',
    fontWeight: '500',
    fontSize: 14,
  }
});
