import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Surface, Text, TextInput } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { AlertCircle, Bus, ChevronDown, ChevronLeft, RefreshCcw } from 'lucide-react-native';

import { AppPopup, PopupType } from '@/components/ui/AppPopup';
import {
  ContextoRodizio,
  PreviaRodizio,
  RodizioPayload,
  TurnoRodizio,
  rodizioService,
} from '@/services/rodizioService';
import { getErrorMessage } from '@/utils/errorUtils';

const TURNOS: { value: TurnoRodizio; label: string }[] = [
  { value: 'ida', label: 'Ida' },
  { value: 'volta', label: 'Volta' },
];

function dataLocalIso(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function proximaSegunda(): string {
  const hoje = new Date();
  const diasAteSegunda = (8 - hoje.getDay()) % 7 || 7;
  const proxima = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + diasAteSegunda);
  return dataLocalIso(proxima);
}

function formatarData(dataIso: string): string {
  return new Date(`${dataIso}T12:00:00`).toLocaleDateString('pt-BR');
}

function chaveSelecao(rotaId: number, turno: TurnoRodizio): string {
  return `${rotaId}:${turno}`;
}

function montarPayload(
  selecoes: Record<string, string>,
  dataInicio: string,
  semanas: string,
): RodizioPayload {
  return {
    data_inicio: dataInicio,
    semanas: Number(semanas),
    itens: Object.entries(selecoes)
      .filter(([, placa]) => Boolean(placa))
      .map(([chave, placa]) => {
        const [rotaId, turno] = chave.split(':');
        return {
          rota_id: Number(rotaId),
          onibus_id: placa,
          turno: turno as TurnoRodizio,
        };
      }),
  };
}

export default function ConfigurarRodizioScreen() {
  const router = useRouter();
  const [contexto, setContexto] = useState<ContextoRodizio | null>(null);
  const [dataInicio, setDataInicio] = useState(proximaSegunda);
  const [semanas, setSemanas] = useState('4');
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});
  const [previa, setPrevia] = useState<PreviaRodizio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [gerandoPrevia, setGerandoPrevia] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [erroContexto, setErroContexto] = useState('');
  const [erroPrevia, setErroPrevia] = useState('');
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [popupConfirmarVisible, setPopupConfirmarVisible] = useState(false);
  const [popupResultado, setPopupResultado] = useState<{
    visible: boolean;
    type: PopupType;
    title: string;
    message: string;
  }>({ visible: false, type: 'info', title: '', message: '' });

  const construirPayload = useCallback(
    (selecoesAtuais: Record<string, string> = selecoes): RodizioPayload =>
      montarPayload(selecoesAtuais, dataInicio, semanas),
    [dataInicio, selecoes, semanas],
  );

  const validarPayload = useCallback((payload: RodizioPayload): string => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.data_inicio)) {
      return 'Informe a data de início no formato AAAA-MM-DD.';
    }
    if (!Number.isInteger(payload.semanas) || payload.semanas < 1 || payload.semanas > 52) {
      return 'A quantidade de semanas deve estar entre 1 e 52.';
    }
    if (payload.itens.length === 0) {
      return 'Selecione ao menos um ônibus para o rodízio.';
    }
    const usados = new Set<string>();
    for (const item of payload.itens) {
      const chave = `${item.onibus_id}:${item.turno}`;
      if (usados.has(chave)) {
        return 'O mesmo ônibus não pode ser alocado a mais de uma rota no mesmo turno.';
      }
      usados.add(chave);
    }
    return '';
  }, []);

  const gerarPrevia = useCallback(async (payload?: RodizioPayload) => {
    const dados = payload ?? construirPayload();
    const erro = validarPayload(dados);
    if (erro) {
      setPrevia(null);
      setErroPrevia(erro);
      return;
    }
    setGerandoPrevia(true);
    setErroPrevia('');
    try {
      setPrevia(await rodizioService.gerarPrevia(dados));
    } catch (error) {
      setPrevia(null);
      setErroPrevia(getErrorMessage(error, 'Não foi possível gerar a prévia do rodízio.'));
    } finally {
      setGerandoPrevia(false);
    }
  }, [construirPayload, validarPayload]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErroContexto('');
    try {
      const dados = await rodizioService.obterContexto();
      const itensIniciais: Record<string, string> = {};
      const itensConfigurados = dados.configuracao?.itens ?? [];
      if (itensConfigurados.length > 0) {
        for (const item of itensConfigurados) {
          itensIniciais[chaveSelecao(item.rota_id, item.turno)] = item.onibus_id;
        }
      } else {
        for (const turno of TURNOS) {
          dados.rotas.forEach((rota, indice) => {
            const onibus = dados.onibus[indice];
            if (onibus) {
              itensIniciais[chaveSelecao(rota.id, turno.value)] = onibus.placa;
            }
          });
        }
      }
      const dataInicioAtual = dados.configuracao?.data_inicio ?? proximaSegunda();
      const semanasAtuais = dados.configuracao ? String(dados.configuracao.semanas) : '4';
      setContexto(dados);
      setSelecoes(itensIniciais);
      setDataInicio(dataInicioAtual);
      setSemanas(semanasAtuais);

      const payloadInicial = montarPayload(itensIniciais, dataInicioAtual, semanasAtuais);
      const erro = validarPayload(payloadInicial);
      if (erro) {
        setPrevia(null);
        setErroPrevia(erro);
      } else {
        setErroPrevia('');
        setPrevia(await rodizioService.gerarPrevia(payloadInicial));
      }
    } catch (error) {
      setContexto(null);
      setErroContexto(getErrorMessage(error, 'Não foi possível carregar o contexto do rodízio.'));
    } finally {
      setCarregando(false);
    }
  }, [validarPayload]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar]),
  );

  const pickerOnibus = pickerKey
    ? (contexto?.onibus ?? []).find((onibus) => onibus.placa === selecoes[pickerKey])
    : null;

  const handleAlterarDataInicio = (valor: string) => {
    setDataInicio(valor);
    void gerarPrevia(montarPayload(selecoes, valor, semanas));
  };

  const handleAlterarSemanas = (valor: string) => {
    setSemanas(valor);
    void gerarPrevia(montarPayload(selecoes, dataInicio, valor));
  };

  const handleConfirmar = async () => {
    setPopupConfirmarVisible(false);
    setConfirmando(true);
    try {
      const resposta = await rodizioService.confirmar(construirPayload());
      setPopupResultado({
        visible: true,
        type: 'success',
        title: 'Rodízio confirmado',
        message: resposta.mensagem,
      });
    } catch (error) {
      setPopupResultado({
        visible: true,
        type: 'error',
        title: 'Erro ao confirmar rodízio',
        message: getErrorMessage(error, 'Não foi possível confirmar o rodízio.'),
      });
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <ChevronLeft size={32} color="#191C20" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Configurar Rodízio</Text>
      </View>

      <AppPopup
        visible={popupConfirmarVisible}
        type="warning"
        title="Confirmar rodízio de frota?"
        message={`As rotas serão aplicadas a partir de ${formatarData(dataInicio)} pelos próximos ${semanas} semana(s).`}
        confirmText="Confirmar Rodízio"
        cancelText="Cancelar"
        onConfirm={() => void handleConfirmar()}
        onDismiss={() => setPopupConfirmarVisible(false)}
      />

      <AppPopup
        visible={popupResultado.visible}
        type={popupResultado.type}
        title={popupResultado.title}
        message={popupResultado.message}
        confirmText="Entendido"
        onConfirm={() => {
          setPopupResultado((prev) => ({ ...prev, visible: false }));
          if (popupResultado.type === 'success') {
            router.back();
          }
        }}
        onDismiss={() => setPopupResultado((prev) => ({ ...prev, visible: false }))}
      />

      <Modal
        visible={pickerKey !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerKey(null)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerKey(null)}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>Selecione o ônibus</Text>
            {(contexto?.onibus ?? []).map((onibus) => (
              <TouchableOpacity
                key={onibus.placa}
                style={styles.optionRow}
                onPress={() => {
                  if (pickerKey) {
                    const novasSelecoes = { ...selecoes, [pickerKey]: onibus.placa };
                    setSelecoes(novasSelecoes);
                    void gerarPrevia(construirPayload(novasSelecoes));
                  }
                  setPickerKey(null);
                }}
              >
                <Text style={styles.optionText}>{onibus.apelido} • {onibus.placa}</Text>
              </TouchableOpacity>
            ))}
            {pickerOnibus && (
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  if (pickerKey) {
                    const novasSelecoes = { ...selecoes };
                    delete novasSelecoes[pickerKey];
                    setSelecoes(novasSelecoes);
                    void gerarPrevia(construirPayload(novasSelecoes));
                  }
                  setPickerKey(null);
                }}
              >
                <Text style={[styles.optionText, styles.removeOption]}>Remover ônibus desta rota</Text>
              </TouchableOpacity>
            )}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {carregando ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3E5F90" />
          </View>
        ) : erroContexto ? (
          <View style={styles.errorBox}>
            <AlertCircle size={24} color="#BA1A1A" />
            <Text style={styles.errorText}>{erroContexto}</Text>
            <Button mode="outlined" onPress={() => void carregar()}>Tentar novamente</Button>
          </View>
        ) : (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>Período do rodízio</Text>
            <TextInput
              label="Data de início (AAAA-MM-DD)"
              value={dataInicio}
              onChangeText={handleAlterarDataInicio}
              mode="outlined"
              style={styles.input}
              testID="rodizio-data-inicio"
            />
            <TextInput
              label="Quantidade de semanas"
              value={semanas}
              onChangeText={handleAlterarSemanas}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              testID="rodizio-semanas"
            />

            <Text variant="titleMedium" style={[styles.sectionTitle, styles.sectionSpacing]}>
              Configurar alternância
            </Text>
            <Text variant="bodyMedium" style={styles.descriptionText}>
              Selecione o ônibus de cada rota em cada turno. O mesmo ônibus não pode ser usado em duas rotas no mesmo turno.
            </Text>

            {(contexto?.rotas ?? []).map((rota) => (
              <Surface key={rota.id} style={styles.routeCard} elevation={0}>
                <Text variant="titleMedium" style={styles.routeName}>{rota.nome}</Text>
                <View style={styles.turnosRow}>
                  {TURNOS.map((turno) => {
                    const chave = chaveSelecao(rota.id, turno.value);
                    const placa = selecoes[chave];
                    return (
                      <TouchableOpacity
                        key={chave}
                        style={styles.selectBox}
                        onPress={() => setPickerKey(chave)}
                        testID={`rodizio-seletor-${chave}`}
                      >
                        <View style={styles.selectLeftRow}>
                          <Bus size={18} color="#191C20" />
                          <Text style={styles.selectText} numberOfLines={1}>
                            {turno.label}: {placa || 'Selecionar ônibus'}
                          </Text>
                        </View>
                        <ChevronDown size={18} color="#666" />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </Surface>
            ))}

            <View style={styles.previewHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>Prévia do rodízio</Text>
              <Button
                mode="outlined"
                onPress={() => void gerarPrevia()}
                loading={gerandoPrevia}
                disabled={gerandoPrevia}
                testID="rodizio-gerar-previa"
              >
                Atualizar prévia
              </Button>
            </View>

            {gerandoPrevia ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#3E5F90" />
              </View>
            ) : erroPrevia ? (
              <Surface style={styles.alertNoticeBadge} elevation={0}>
                <Text style={styles.alertNoticeText}>{erroPrevia}</Text>
              </Surface>
            ) : previa ? (
              <View style={styles.previaList} testID="rodizio-previa">
                <Surface style={styles.alertNoticeBadge} elevation={0}>
                  <Text style={styles.alertNoticeText}>
                    {previa.escalas.reduce((total, escala) => total + escala.itens.length, 0)} alocações • {previa.alertas.length} alerta(s) de capacidade
                  </Text>
                </Surface>
                {previa.escalas.map((escala) => (
                  <Surface key={escala.semana} style={styles.escalaCard} elevation={0}>
                    <Text variant="titleSmall" style={styles.escalaTitle}>
                      Semana {escala.semana} • {formatarData(escala.data_inicio)} a {formatarData(escala.data_fim)}
                    </Text>
                    {escala.itens.map((item, indice) => (
                      <View
                        key={`${escala.semana}-${item.rota_id}-${item.turno}-${indice}`}
                        style={styles.itemRow}
                      >
                        <View style={styles.textCol}>
                          <Text variant="bodyMedium" style={styles.itemTitle}>
                            {item.rota_nome} • {item.turno === 'ida' ? 'Ida' : 'Volta'} • {item.onibus_id}
                          </Text>
                          <Text variant="bodySmall" style={styles.itemDetails}>
                            Demanda: {item.demanda_prevista} • Capacidade: {item.capacidade_assentos + item.capacidade_em_pe}
                          </Text>
                          {item.alerta_capacidade && (
                            <Text style={styles.alertaText}>{item.alerta_capacidade}</Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </Surface>
                ))}
              </View>
            ) : null}

            <View style={styles.actionContainer}>
              <Button
                mode="contained"
                onPress={() => setPopupConfirmarVisible(true)}
                loading={confirmando}
                disabled={confirmando || gerandoPrevia || !previa}
                style={styles.btnSalvar}
                contentStyle={styles.btnContent}
                buttonColor="#3E5F90"
                icon={() => <RefreshCcw size={20} color="#FFF" />}
                testID="rodizio-confirmar"
              >
                Confirmar Rodízio
              </Button>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
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
    color: '#191C20',
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    fontSize: 18,
    marginBottom: 12,
  },
  sectionSpacing: {
    marginTop: 24,
  },
  descriptionText: {
    color: '#43474E',
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  errorBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
  },
  routeCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  routeName: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 12,
  },
  turnosRow: {
    flexDirection: 'row',
    gap: 10,
  },
  selectBox: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: '#F8F9FF',
    borderWidth: 1,
    borderColor: '#E0E2EC',
    borderRadius: 8,
  },
  selectLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  selectText: {
    fontSize: 13,
    color: '#191C20',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 12,
    gap: 8,
  },
  alertNoticeBadge: {
    borderWidth: 1.5,
    borderColor: '#B5651D',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFF8F0',
  },
  alertNoticeText: {
    color: '#8A5200',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  previaList: {
    gap: 12,
    marginBottom: 24,
  },
  escalaCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 14,
  },
  escalaTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 6,
  },
  textCol: {
    flex: 1,
  },
  itemTitle: {
    color: '#191C20',
  },
  itemDetails: {
    color: '#74777F',
  },
  alertaText: {
    color: '#8B261D',
    fontSize: 12,
    marginTop: 2,
  },
  actionContainer: {
    marginTop: 12,
  },
  btnSalvar: {
    borderRadius: 24,
  },
  btnContent: {
    height: 52,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 16,
  },
  optionRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E2EC',
  },
  optionText: {
    fontSize: 16,
    color: '#191C20',
  },
  removeOption: {
    color: '#BA1A1A',
  },
});
