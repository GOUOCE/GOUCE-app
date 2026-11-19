import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text, Button, Surface, Avatar } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';

import {
  logisticaService,
  AlunoExcedente,
  AlocacaoDistribuicao,
  LinhaDistribuicao,
  OpcaoRealocacao,
  PreviaDistribuicao,
  TipoLugar,
} from '@/services/logisticaService';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import { getErrorMessage } from '@/utils/errorUtils';
import { formatarTituloOnibus } from '@/utils/formatarOnibus';

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

const chaveAluno = (aluno: AlunoExcedente) => `${aluno.id}-${aluno.turno}`;

export default function RealocarExcedentesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ linhaId?: string; dataIso?: string }>();

  const linhaId = Number(params.linhaId);
  const dataIso = params.dataIso || paraIso(new Date());

  const [rota, setRota] = useState<LinhaDistribuicao | null>(null);
  const [alunos, setAlunos] = useState<AlunoExcedente[]>([]);
  const [preview, setPreview] = useState<PreviaDistribuicao | null>(null);
  const [linhas, setLinhas] = useState<LinhaDistribuicao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [realocando, setRealocando] = useState(false);
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

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
      setPreview(dados.preview);
      setLinhas(dados.linhas);
      setSelecionado((atual) =>
        atual && dados.alunos.some((aluno) => chaveAluno(aluno) === atual) ? atual : null,
      );
      setOpcaoSelecionada(null);
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

  const alunoSelecionado = useMemo(
    () => alunos.find((aluno) => chaveAluno(aluno) === selecionado) ?? null,
    [alunos, selecionado],
  );

  const opcoes = useMemo<OpcaoRealocacao[]>(() => {
    if (!preview || !alunoSelecionado) return [];

    return preview.alocacoes.flatMap((alocacao, indice) => {
      if (alocacao.turno !== alunoSelecionado.turno) return [];

      const capacidade = alocacao.capacidade.assentos + alocacao.capacidade.em_pe;
      const vagas = capacidade - alocacao.alunos.length;
      if (vagas <= 0) return [];

      const rotaLinha = linhas.find(
        (linha) => Number(linha.id) === Number(alocacao.rota_id),
      );
      return [
        {
          chave: String(indice),
          indice,
          rotaId: Number(alocacao.rota_id),
          rotaNome: rotaLinha?.nomeLinha ?? `Rota ${alocacao.rota_id}`,
          onibusId: alocacao.onibus_id,
          onibusLabel: formatarTituloOnibus(
            alocacao.onibus_apelido ?? '',
            alocacao.onibus_id,
          ),
          motoristaId: Number(alocacao.motorista_id),
          motoristaNome: alocacao.motorista_nome || `Motorista #${alocacao.motorista_id}`,
          turno: alocacao.turno,
          vagas,
        },
      ];
    });
  }, [alunoSelecionado, linhas, preview]);

  const totalExcedentes = rota?.excedentes ?? alunos.length;

  const fecharPopup = () => setPopup((atual) => ({ ...atual, visible: false }));

  const confirmarRealocacao = async () => {
    if (!preview || !alunoSelecionado || !opcaoSelecionada) return;
    const opcao = opcoes.find((item) => item.chave === opcaoSelecionada);
    if (!opcao) return;

    setRealocando(true);
    try {
      const atualizadas: AlocacaoDistribuicao[] = preview.alocacoes.map((alocacao) => ({
        ...alocacao,
        alunos: alocacao.alunos.map((aluno) => ({ ...aluno })),
      }));
      const destino = atualizadas[opcao.indice];
      if (!destino) {
        throw new Error('Veículo de destino não encontrado.');
      }
      if (
        destino.alunos.some((aluno) => aluno.agendamento_id === alunoSelecionado.agendamentoId)
      ) {
        throw new Error('O aluno já está alocado neste veículo.');
      }

      const tipoLugar: TipoLugar =
        destino.sentados < destino.capacidade.assentos ? 'sentado' : 'em_pe';
      destino.alunos.push({
        agendamento_id: alunoSelecionado.agendamentoId,
        tipo_lugar: tipoLugar,
      });
      destino.sentados = destino.alunos.filter((aluno) => aluno.tipo_lugar === 'sentado').length;
      destino.em_pe = destino.alunos.length - destino.sentados;

      const payload = atualizadas.map((alocacao) => ({
        rota_id: alocacao.rota_id,
        onibus_id: alocacao.onibus_id,
        motorista_id: alocacao.motorista_id,
        turno: alocacao.turno,
        alunos: alocacao.alunos,
      }));

      await logisticaService.confirmarDistribuicao(
        { data: dataIso, modo: 'manual', alocacoes: payload },
        atualizadas,
      );

      setPopup({
        visible: true,
        type: 'success',
        title: 'Aluno realocado',
        message: `${alunoSelecionado.nome} foi realocado para ${opcao.onibusLabel} na ${opcao.rotaNome}.`,
      });
      setSelecionado(null);
      setOpcaoSelecionada(null);
      await carregar();
    } catch (error) {
      setPopup({
        visible: true,
        type: 'error',
        title: 'Não foi possível realocar',
        message: getErrorMessage(error, 'Não foi possível concluir a realocação.'),
      });
    } finally {
      setRealocando(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText="Entendido"
        onConfirm={fecharPopup}
        onDismiss={fecharPopup}
      />

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
          {totalExcedentes > 0 ? (
            <Text variant="bodyMedium" style={styles.descriptionText}>
              {`${totalExcedentes} aluno(s) da ${rota?.nomeLinha ?? 'rota'} ultrapassam a capacidade dos veículos alocados.`}
            </Text>
          ) : null}

          {alunos.length > 0 ? (
            <View style={styles.alunosList}>
              {alunos.map((aluno) => {
                const chave = chaveAluno(aluno);
                const ativo = selecionado === chave;
                return (
                  <TouchableOpacity
                    key={chave}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelecionado(ativo ? null : chave);
                      setOpcaoSelecionada(null);
                    }}
                  >
                    <Surface
                      style={[styles.alunoCard, ativo && styles.alunoCardSelected]}
                      elevation={0}
                    >
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
                        {ativo ? <CheckCircle2 size={22} color="#00639A" /> : null}
                      </View>
                    </Surface>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Nenhum aluno excedente para esta data.</Text>
            </View>
          )}

          {alunos.length > 0 && alunoSelecionado ? (
            <View style={styles.realocacaoBox}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Realocar aluno
              </Text>
              <Text style={styles.helpText}>
                Escolha um veículo com vaga no turno de {alunoSelecionado.turno}.
              </Text>

              {opcoes.length === 0 ? (
                <View style={styles.avisoBox}>
                  <Text style={styles.avisoText}>
                    Não há veículo com vaga no turno de {alunoSelecionado.turno}.
                  </Text>
                </View>
              ) : (
                <View style={styles.opcoesList}>
                  {opcoes.map((opcao) => {
                    const ativa = opcaoSelecionada === opcao.chave;
                    return (
                      <TouchableOpacity
                        key={opcao.chave}
                        activeOpacity={0.8}
                        onPress={() => setOpcaoSelecionada(opcao.chave)}
                      >
                        <Surface
                          style={[styles.opcaoCard, ativa && styles.opcaoCardSelected]}
                          elevation={0}
                        >
                          <View style={styles.opcaoInfo}>
                            <Text style={styles.opcaoRota}>{opcao.rotaNome}</Text>
                            <Text style={styles.opcaoDetalhe}>{opcao.onibusLabel}</Text>
                            <Text style={styles.opcaoDetalhe}>
                              {opcao.motoristaNome} • {opcao.vagas} vaga(s)
                            </Text>
                          </View>
                          {ativa ? <CheckCircle2 size={22} color="#00639A" /> : null}
                        </Surface>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              <Button
                mode="contained"
                onPress={confirmarRealocacao}
                loading={realocando}
                disabled={!opcaoSelecionada || realocando}
                style={styles.btnRealocar}
                contentStyle={styles.btnContent}
                buttonColor="#3E5F90"
              >
                Confirmar realocação
              </Button>
            </View>
          ) : alunos.length > 0 ? (
            <View style={styles.avisoBox}>
              <Text style={styles.helpText}>
                Selecione um aluno excedente para escolher o veículo de destino.
              </Text>
            </View>
          ) : null}

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
    borderWidth: 1,
    borderColor: '#E0E2EC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  alunoCardSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#00639A',
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
  realocacaoBox: {
    marginBottom: 24,
    gap: 12,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
  },
  helpText: {
    color: '#43474E',
    lineHeight: 20,
  },
  opcoesList: {
    gap: 10,
  },
  opcaoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E2EC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  opcaoCardSelected: {
    backgroundColor: '#E8F0FE',
    borderColor: '#00639A',
  },
  opcaoInfo: {
    flex: 1,
    gap: 2,
  },
  opcaoRota: {
    color: '#191C20',
    fontWeight: 'bold',
  },
  opcaoDetalhe: {
    color: '#74777F',
    fontSize: 13,
  },
  avisoBox: {
    backgroundColor: '#FFF4E5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  avisoText: {
    color: '#7A4D00',
    lineHeight: 20,
  },
  emptyBox: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#74777F',
    textAlign: 'center',
  },
  btnRealocar: {
    borderRadius: 24,
    marginTop: 4,
  },
  btnVoltar: {
    marginTop: 12,
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
  },
});
