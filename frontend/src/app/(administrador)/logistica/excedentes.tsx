import React, { useCallback, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button, Surface, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

import { logisticaService, AlunoExcedente, LinhaDistribuicao } from '@/services/logisticaService';
import { getErrorMessage } from '@/utils/errorUtils';

const paraIso = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const formatarDataCurta = (iso: string) => {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
};

export default function RealocarExcedentesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linhaId?: string; dataIso?: string }>();

  const linhaId = Number(params.linhaId);
  const dataIso = params.dataIso || paraIso(new Date());

  const [rota, setRota] = useState<LinhaDistribuicao | null>(null);
  const [alunos, setAlunos] = useState<AlunoExcedente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!Number.isFinite(linhaId) || linhaId <= 0) {
      setErro('Rota não informada.');
      setCarregando(false);
      return;
    }

    setCarregando(true);
    setErro('');
    try {
      const dados = await logisticaService.obterExcedentes(dataIso, linhaId);
      setRota(dados.rota);
      setAlunos(dados.alunos);
    } catch (error) {
      setErro(getErrorMessage(error, 'Não foi possível carregar os alunos excedentes.'));
    } finally {
      setCarregando(false);
    }
  }, [dataIso, linhaId]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  const totalExcedentes = rota?.excedentes ?? alunos.length;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Alunos Excedentes
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {formatarDataCurta(dataIso)}
          </Text>
        </View>
      </View>

      {carregando ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#3E5F90" />
        </View>
      ) : erro ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{erro}</Text>
          <Button mode="outlined" onPress={carregar}>
            Tentar novamente
          </Button>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text variant="bodyMedium" style={styles.descriptionText}>
            {totalExcedentes > 0
              ? `${totalExcedentes} aluno(s) da ${rota?.nomeLinha ?? 'rota'} ultrapassam a capacidade dos veículos alocados.`
              : `A ${rota?.nomeLinha ?? 'rota'} não possui alunos excedentes nesta data.`}
          </Text>

          {alunos.length > 0 ? (
            <View style={styles.alunosList}>
              {alunos.map((aluno) => (
                <Surface key={`${aluno.id}-${aluno.turno}`} style={styles.alunoCard} elevation={0}>
                  <View style={styles.alunoRow}>
                    <Avatar.Text
                      size={42}
                      label={aluno.iniciais}
                      style={styles.avatarBg}
                      labelStyle={styles.avatarLabel}
                    />
                    <View style={styles.alunoTextCol}>
                      <Text variant="titleMedium" style={styles.alunoNome}>
                        {aluno.nome}
                      </Text>
                      <Text variant="bodySmall" style={styles.alunoTrajeto}>
                        {aluno.trajetoText}
                      </Text>
                    </View>
                  </View>
                </Surface>
              ))}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhum aluno excedente para esta data.</Text>
            </View>
          )}

          <Button
            mode="contained"
            onPress={() => router.back()}
            style={styles.btnVoltar}
            contentStyle={styles.btnContent}
            buttonColor="#3E5F90"
          >
            Voltar para a distribuição
          </Button>
        </ScrollView>
      )}
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
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 20,
  },
  headerSubtitle: {
    color: '#74777F',
    fontSize: 13,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 12,
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  descriptionText: {
    color: '#43474E',
    lineHeight: 20,
    marginBottom: 16,
  },
  alunosList: {
    gap: 12,
    marginBottom: 24,
  },
  alunoCard: {
    backgroundColor: '#F8F9FF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
    paddingVertical: 12,
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBg: {
    backgroundColor: '#3E5F90',
  },
  avatarLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alunoTextCol: {
    flex: 1,
  },
  alunoNome: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 16,
  },
  alunoTrajeto: {
    color: '#74777F',
    fontSize: 13,
    marginTop: 2,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#74777F',
    textAlign: 'center',
  },
  btnVoltar: {
    marginTop: 24,
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
  },
});
