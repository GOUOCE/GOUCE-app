import React, { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { AlertTriangle, ChevronLeft, WifiOff } from 'lucide-react-native';

import {
  agendamentoService,
  aplicarCenarioAlocacaoMock,
  CenarioAlocacaoMock,
  criarDetalhesViagemMock,
  DetalhesViagemResponse,
  extrairMensagemErro,
  StatusAlocacaoVeiculo,
  TrechoDetalhesViagem,
} from '@/services/agendamentoService';

// Sem histórico (página aberta direto pela URL ou recarregada), volta para a Agenda em vez de não fazer nada.
const voltar = (router: ReturnType<typeof useRouter>) => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(aluno)/(tabs)/agenda' as any);
  }
};

function BannerRealocacao({ mensagem, testID }: { mensagem: string; testID: string }) {
  return (
    <View style={styles.alertaRealocacaoBox} testID={testID}>
      <AlertTriangle size={16} color="#92400E" />
      <Text style={styles.alertaRealocacaoTexto}>{mensagem}</Text>
    </View>
  );
}

function StatusAlocacaoPill({
  statusAlocacao,
  label,
  testID,
}: {
  statusAlocacao: StatusAlocacaoVeiculo;
  label: string;
  testID: string;
}) {
  const aguardando = statusAlocacao === 'AGUARDANDO_ALOCACAO';
  return (
    <View
      style={[
        styles.statusPill,
        aguardando ? styles.statusPillAguardando : styles.statusPillConfirmada,
      ]}
    >
      <Text
        style={[
          styles.statusPillTexto,
          aguardando ? styles.statusPillTextoAguardando : styles.statusPillTextoConfirmada,
        ]}
        testID={testID}
      >
        {label}
      </Text>
    </View>
  );
}

function CardRotaComplementar({ trecho }: { trecho: TrechoDetalhesViagem }) {
  const rota = trecho.rotaComplementar!;

  return (
    <Surface style={styles.cardComplementar} elevation={0}>
      <Text variant="labelLarge" style={styles.cardCategoryLabel}>
        Rota complementar (obrigatória p/ transferência)
      </Text>

      <Text
        variant="titleMedium"
        style={styles.cardHeaderTitle}
        testID={`rota-complementar-nome-${trecho.sentido}`}
      >
        {rota.nomeLinha}
      </Text>

      <View style={[styles.gridRow, styles.gridRowSpaced]}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Ponto de Embarque</Text>
          <Text style={styles.fieldVal}>{rota.pontoEmbarque}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Ponto de conexão</Text>
          <Text style={styles.fieldVal}>{rota.pontoConexao}</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>Horário de Saída</Text>
          <Text style={styles.fieldVal}>{rota.horarioSaida}</Text>
        </View>
      </View>
    </Surface>
  );
}

function CardRotaPrincipal({ trecho }: { trecho: TrechoDetalhesViagem }) {
  const rota = trecho.rotaPrincipal;
  const possuiComplementar = trecho.rotaComplementar !== undefined;
  const tituloPrincipal = rota.veiculo ?? rota.nomeLinha;
  const exibirSubtitulo = Boolean(rota.veiculo || rota.subtituloRota !== rota.nomeLinha);

  return (
    <Surface style={styles.cardPrincipal} elevation={0}>
      {possuiComplementar && (
        <Text variant="labelLarge" style={styles.cardCategoryLabel}>
          Rota principal
        </Text>
      )}

      {rota.realocado && rota.mensagemRealocacao && (
        <BannerRealocacao
          mensagem={rota.mensagemRealocacao}
          testID={`alerta-realocacao-principal-${trecho.sentido}`}
        />
      )}

      <Text
        variant="titleMedium"
        style={styles.cardHeaderTitle}
        testID={rota.veiculo ? `veiculo-principal-${trecho.sentido}` : undefined}
      >
        {tituloPrincipal}
      </Text>

      {exibirSubtitulo && (
        <Text
          variant="bodySmall"
          style={styles.cardSubtitle}
          testID={`subtitulo-rota-principal-${trecho.sentido}`}
        >
          {rota.subtituloRota}
        </Text>
      )}

      <View style={[styles.gridRow, styles.gridRowSpaced]}>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>
            {trecho.sentido === 'ida' ? 'Ponto de Embarque' : 'Ponto de Embarque (IES)'}
          </Text>
          <Text style={styles.fieldVal}>{rota.pontoEmbarque}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.fieldLabel}>
            {trecho.sentido === 'ida' ? 'Seu Desembarque (IES)' : 'Seu Desembarque'}
          </Text>
          <Text style={styles.fieldVal}>{rota.pontoDesembarque}</Text>
        </View>
      </View>

      {/* Sem alocação confirmada (FA-001), não exibe motorista/veículo */}
      <View style={styles.gridRow}>
        {rota.motorista ? (
          <>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Motorista</Text>
              <Text style={styles.fieldVal} testID={`motorista-principal-${trecho.sentido}`}>
                {rota.motorista}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Horário de Saída</Text>
              <Text style={styles.fieldVal}>{rota.horarioSaida}</Text>
            </View>
          </>
        ) : (
          <View style={styles.col}>
            <Text style={styles.fieldLabel}>Horário de Saída</Text>
            <Text style={styles.fieldVal}>{rota.horarioSaida}</Text>
          </View>
        )}
      </View>

      <StatusAlocacaoPill
        statusAlocacao={rota.statusAlocacao}
        label={rota.statusAlocacaoLabel}
        testID={`status-alocacao-principal-${trecho.sentido}`}
      />
    </Surface>
  );
}

function TelaErro({
  mensagem,
  onTentarNovamente,
  onSimularMock,
}: {
  mensagem: string;
  onTentarNovamente?: () => void;
  onSimularMock?: () => void;
}) {
  const router = useRouter();
  return (
    <View style={[styles.container, styles.center]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => voltar(router)}>
        <ChevronLeft size={32} color="#333" />
      </TouchableOpacity>
      <Text variant="titleMedium" style={styles.erroTitulo}>
        Não foi possível carregar a viagem
      </Text>
      <Text variant="bodyMedium" style={styles.erroTexto}>
        {mensagem}
      </Text>
      <View style={styles.erroAcoes}>
        {onTentarNovamente && (
          <TouchableOpacity style={styles.tentarNovamente} onPress={onTentarNovamente}>
            <Text style={styles.tentarNovamenteTexto}>Tentar novamente</Text>
          </TouchableOpacity>
        )}
        {onSimularMock && (
          <TouchableOpacity
            style={styles.simularMockBtn}
            onPress={onSimularMock}
            testID="btn-carregar-mock-hu019"
          >
            <Text style={styles.simularMockBtnTexto}>Simular Minha Viagem (HU-019)</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function AgendamentoDetalhesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dataIso?: string }>();

  const dataIso = params.dataIso || '';

  const [detalhes, setDetalhes] = useState<DetalhesViagemResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(() => Boolean(dataIso));
  const [cenarioSimulacao, setCenarioSimulacao] = useState<CenarioAlocacaoMock | null>(null);
  const [simularComplementar, setSimularComplementar] = useState<boolean | undefined>(undefined);

  const executarBusca = useCallback(async () => {
    // Cada consulta começa do zero: erro/viagem anteriores não podem
    // permanecer na tela ao trocar de reserva (HU-015 / #432).
    setErro(null);
    setDetalhes(null);
    setCarregando(true);
    try {
      const dados = await agendamentoService.obterDetalhesViagem(dataIso);
      setDetalhes(dados);
    } catch (e) {
      setErro(extrairMensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, [dataIso]);

  useFocusEffect(
    useCallback(() => {
      if (!dataIso) return;
      executarBusca();
    }, [dataIso, executarBusca])
  );

  const tentarNovamente = useCallback(async () => {
    executarBusca();
  }, [executarBusca]);

  const handleCarregarMockSemDados = useCallback(() => {
    setErro(null);
    setCarregando(false);
    setDetalhes(criarDetalhesViagemMock(dataIso || '2026-08-31', 'CONFIRMADA'));
    setCenarioSimulacao('CONFIRMADA');
    setSimularComplementar(false);
  }, [dataIso]);

  const detalhesExibidos = useMemo(() => {
    if (!detalhes) return null;
    if (cenarioSimulacao === null && simularComplementar === undefined) {
      return detalhes;
    }
    return aplicarCenarioAlocacaoMock(detalhes, cenarioSimulacao ?? 'CONFIRMADA', {
      exibirRotaComplementar: simularComplementar,
    });
  }, [detalhes, cenarioSimulacao, simularComplementar]);

  const exibirComplementarAtual =
    simularComplementar ?? Boolean(detalhesExibidos?.temRotaComplementar);

  const handleAlternarRotaComplementar = () => {
    setCenarioSimulacao((prev) => prev ?? 'CONFIRMADA');
    setSimularComplementar(!exibirComplementarAtual);
  };

  if (!dataIso && !detalhesExibidos) {
    return (
      <TelaErro
        mensagem="Data da viagem não informada."
        onSimularMock={handleCarregarMockSemDados}
      />
    );
  }

  if (carregando) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator animating color="#00639A" />
      </View>
    );
  }

  if (erro || !detalhesExibidos) {
    return (
      <TelaErro
        mensagem={erro || 'Nenhum agendamento ativo para esta data.'}
        onTentarNovamente={tentarNovamente}
        onSimularMock={handleCarregarMockSemDados}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => voltar(router)} testID="btn-voltar-detalhes">
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <View>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            {detalhesExibidos.diaSemana}
          </Text>
          <Text variant="bodySmall" style={styles.headerSubtitle}>
            {detalhesExibidos.dataFormatada}
          </Text>
        </View>
      </View>

      {/* Aviso de Cache Offline (FA-002 / Critério 4 HU-015) */}
      {detalhesExibidos.isOffline && (
        <Surface style={styles.offlineBanner} elevation={0}>
          <WifiOff size={16} color="#00639A" />
          <Text style={styles.offlineText}>
            Visualização Offline (Dados salvos no dispositivo)
          </Text>
        </Surface>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {detalhesExibidos.trechos.map((trecho) => (
          <View key={trecho.sentido} style={styles.trechoSection}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              {trecho.sentido === 'ida' ? 'Ida' : 'Volta'}
            </Text>

            {/* CARD 1: ROTA COMPLEMENTAR (quando há transferência - FA-001 HU-015 / HU-019) */}
            {trecho.rotaComplementar && <CardRotaComplementar trecho={trecho} />}

            {/* CARD 2: ROTA PRINCIPAL */}
            <CardRotaPrincipal trecho={trecho} />
          </View>
        ))}

        {/* Painel discreto para simular os estados de alocação (HU-019 com mocks) */}
        <View style={styles.simulacaoPainel} testID="painel-simulacao-hu019">
          <Text style={styles.simulacaoTitulo}>Simulação de alocação (HU-019)</Text>
          <View style={styles.simulacaoBotoesRow}>
            <TouchableOpacity
              style={[
                styles.simulacaoBotao,
                cenarioSimulacao === 'CONFIRMADA' && styles.simulacaoBotaoAtivo,
              ]}
              onPress={() => setCenarioSimulacao('CONFIRMADA')}
              testID="btn-cenario-confirmada"
            >
              <Text
                style={[
                  styles.simulacaoBotaoTexto,
                  cenarioSimulacao === 'CONFIRMADA' && styles.simulacaoBotaoTextoAtivo,
                ]}
              >
                Confirmada
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.simulacaoBotao,
                cenarioSimulacao === 'AGUARDANDO_ALOCACAO' && styles.simulacaoBotaoAtivo,
              ]}
              onPress={() => setCenarioSimulacao('AGUARDANDO_ALOCACAO')}
              testID="btn-cenario-aguardando"
            >
              <Text
                style={[
                  styles.simulacaoBotaoTexto,
                  cenarioSimulacao === 'AGUARDANDO_ALOCACAO' && styles.simulacaoBotaoTextoAtivo,
                ]}
              >
                Aguardando (FA-001)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.simulacaoBotao,
                cenarioSimulacao === 'REALOCADO' && styles.simulacaoBotaoAtivo,
              ]}
              onPress={() => setCenarioSimulacao('REALOCADO')}
              testID="btn-cenario-realocado"
            >
              <Text
                style={[
                  styles.simulacaoBotaoTexto,
                  cenarioSimulacao === 'REALOCADO' && styles.simulacaoBotaoTextoAtivo,
                ]}
              >
                Realocado (FA-002)
              </Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.simulacaoBotaoSecundario,
              exibirComplementarAtual && styles.simulacaoBotaoAtivo,
            ]}
            onPress={handleAlternarRotaComplementar}
            testID="btn-alternar-rota-complementar"
          >
            <Text
              style={[
                styles.simulacaoBotaoTexto,
                exibirComplementarAtual && styles.simulacaoBotaoTextoAtivo,
              ]}
            >
              Alternar rota complementar ({exibirComplementarAtual ? 'ativa' : 'inativa'})
            </Text>
          </TouchableOpacity>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backBtn: {
    position: 'absolute',
    top: 60,
    left: 20,
  },
  erroTitulo: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 8,
  },
  erroTexto: {
    color: '#43474E',
    textAlign: 'center',
    marginBottom: 24,
  },
  erroAcoes: {
    gap: 12,
    alignItems: 'center',
  },
  tentarNovamente: {
    backgroundColor: '#3E5F90',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  tentarNovamenteTexto: {
    color: '#FFF',
    fontWeight: '600',
  },
  simularMockBtn: {
    borderWidth: 1,
    borderColor: '#3E5F90',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  simularMockBtnTexto: {
    color: '#3E5F90',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  headerTitle: {
    fontWeight: '500',
    color: '#191C20',
    fontSize: 22,
  },
  headerSubtitle: {
    color: '#43474E',
    fontSize: 13,
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#C2E7FF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 12,
  },
  offlineText: {
    color: '#001D36',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  trechoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '500',
    color: '#191C20',
    marginBottom: 12,
    fontSize: 20,
  },
  cardComplementar: {
    backgroundColor: '#F3F5FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C4C6D0',
    padding: 18,
    marginBottom: 16,
    gap: 6,
  },
  cardPrincipal: {
    backgroundColor: '#F3F5FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C4C6D0',
    padding: 18,
    marginBottom: 20,
    gap: 6,
  },
  cardCategoryLabel: {
    color: '#43474E',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardHeaderTitle: {
    fontWeight: '600',
    color: '#191C20',
    fontSize: 17,
  },
  cardSubtitle: {
    color: '#43474E',
    fontSize: 13,
  },
  alertaRealocacaoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  alertaRealocacaoTexto: {
    flex: 1,
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  gridRowSpaced: {
    marginTop: 10,
  },
  col: {
    width: '48%',
  },
  fieldLabel: {
    fontSize: 12,
    color: '#74777F',
    fontWeight: '500',
    marginBottom: 2,
  },
  fieldVal: {
    fontSize: 15,
    fontWeight: '500',
    color: '#191C20',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 7,
    marginTop: 4,
  },
  statusPillConfirmada: {
    backgroundColor: '#BCEEFF',
  },
  statusPillAguardando: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  statusPillTexto: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusPillTextoConfirmada: {
    color: '#004D67',
  },
  statusPillTextoAguardando: {
    color: '#92400E',
  },
  simulacaoPainel: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EEF2FA',
    borderWidth: 1,
    borderColor: '#D4DCEB',
    gap: 8,
  },
  simulacaoTitulo: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3E5F90',
  },
  simulacaoBotoesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simulacaoBotao: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4C6D0',
  },
  simulacaoBotaoSecundario: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4C6D0',
  },
  simulacaoBotaoAtivo: {
    backgroundColor: '#3E5F90',
    borderColor: '#3E5F90',
  },
  simulacaoBotaoTexto: {
    fontSize: 12,
    fontWeight: '500',
    color: '#191C20',
  },
  simulacaoBotaoTextoAtivo: {
    color: '#FFFFFF',
  },
});
