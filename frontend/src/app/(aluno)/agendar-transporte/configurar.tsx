import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Text, Button, SegmentedButtons, Snackbar, Surface, ActivityIndicator } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, ChevronDown, X } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { agendamentoDiaSchema, AgendamentoDiaFormData } from '@/schemas/agendamentoSchema';
import { agendamentoService, OpcaoSelect, OpcoesAgendamentoResponse, AgendamentoDia, AgendamentoPayload } from '@/services/agendamentoService';
import { AppPopup } from '@/components/ui/AppPopup';
import { getErrorMessage } from '@/utils/errorUtils';

const NOMES_DIAS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const SIGLAS_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const paraDataLocal = (iso: string) => new Date(`${iso}T12:00:00`);

const formatarDataCabecalho = (iso: string) => {
  if (!iso) return 'Agendamento';
  const data = paraDataLocal(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${NOMES_DIAS[data.getDay()]} ${dia}/${mes}/${data.getFullYear()}`;
};

const formatarRotuloAba = (iso: string) => {
  const data = paraDataLocal(iso);
  if (Number.isNaN(data.getTime())) return iso;
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${SIGLAS_DIAS[data.getDay()]}, ${dia}/${mes}`;
};

const numeroOuNulo = (valor: string | undefined) => {
  if (!valor) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : null;
};

export default function ConfigurarAgendamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ datasIso?: string; modoEdicao?: string; agendamentoId?: string }>();

  const datasArray = (params.datasIso || '')
    .split(',')
    .map(dataIso => dataIso.trim())
    .filter(Boolean);
  const modoEdicao = params.modoEdicao === 'true';
  const agendamentoIdParam = params.agendamentoId ? Number(params.agendamentoId) : null;

  const [indiceDataAtual, setIndiceDataAtual] = useState(0);
  const dataIsoAtual = datasArray[indiceDataAtual] || '';

  const [opcoes, setOpcoes] = useState<OpcoesAgendamentoResponse | null>(null);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  const [erroOpcoes, setErroOpcoes] = useState('');
  const [versaoOpcoes, setVersaoOpcoes] = useState(0);

  const [agendamentoId, setAgendamentoId] = useState<number | null>(
    agendamentoIdParam && Number.isFinite(agendamentoIdParam) ? agendamentoIdParam : null
  );
  const [agendamentosSalvos, setAgendamentosSalvos] = useState<AgendamentoDia[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [modalPicker, setModalPicker] = useState<{
    visible: boolean;
    title: string;
    options: OpcaoSelect[];
    onSelect: (val: string) => void;
  }>({
    visible: false,
    title: '',
    options: [],
    onSelect: () => {},
  });

  const [popupCancelarVisible, setPopupCancelarVisible] = useState(false);
  const [popupNenhumCriadoVisible, setPopupNenhumCriadoVisible] = useState(false);
  const [popupErro, setPopupErro] = useState('');

  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisivel, setSnackbarVisivel] = useState(false);

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<AgendamentoDiaFormData>({
    resolver: zodResolver(agendamentoDiaSchema),
    defaultValues: {
      dataIso: dataIsoAtual,
      usaIda: true,
      pontoEmbarqueIda: '',
      faculdadeDestinoIda: '',
      rotaComplementarIda: '',
      usaVolta: true,
      pontoDesembarqueVolta: '',
      faculdadeOrigemVolta: '',
      rotaComplementarVolta: '',
    },
  });

  const usaIda = watch('usaIda');
  const usaVolta = watch('usaVolta');

  useEffect(() => {
    let ativo = true;

    const carregarOpcoes = async () => {
      setCarregandoOpcoes(true);
      setErroOpcoes('');
      try {
        const resposta = await agendamentoService.obterOpcoesAgendamento();
        if (ativo) setOpcoes(resposta);
      } catch (error) {
        if (ativo) {
          setOpcoes(null);
          setErroOpcoes(getErrorMessage(error, 'Não foi possível carregar as opções de agendamento.'));
        }
      } finally {
        if (ativo) setCarregandoOpcoes(false);
      }
    };

    void carregarOpcoes();

    return () => {
      ativo = false;
    };
  }, [versaoOpcoes]);

  useEffect(() => {
    if (dataIsoAtual) setValue('dataIso', dataIsoAtual);
  }, [dataIsoAtual, setValue]);

  useEffect(() => {
    if (!modoEdicao || !dataIsoAtual) return;

    let ativo = true;

    const carregarAgendamento = async () => {
      try {
        let id = agendamentoId;
        if (!id) {
          const lista = await agendamentoService.listarAgendamentosAtivos();
          id = lista.find(item => item.dataIso === dataIsoAtual)?.idAgendamento ?? null;
        }

        if (!id) {
          if (ativo) {
            setPopupErro('Agendamento não encontrado para esta data. Volte e tente novamente.');
          }
          return;
        }

        if (ativo) setAgendamentoId(id);
        const detalhe = await agendamentoService.obterAgendamento(id);
        if (!ativo) return;

        setValue('usaIda', detalhe.usa_ida);
        setValue('usaVolta', detalhe.usa_volta);
        setValue('pontoEmbarqueIda', detalhe.ponto_embarque_id ? String(detalhe.ponto_embarque_id) : '');
        setValue('faculdadeDestinoIda', detalhe.ies_destino_id ? String(detalhe.ies_destino_id) : '');
        setValue('rotaComplementarIda', detalhe.rota_complementar_ida_id ? String(detalhe.rota_complementar_ida_id) : '');
        setValue('pontoDesembarqueVolta', detalhe.ponto_desembarque_id ? String(detalhe.ponto_desembarque_id) : '');
        setValue('faculdadeOrigemVolta', detalhe.ies_origem_id ? String(detalhe.ies_origem_id) : '');
        setValue('rotaComplementarVolta', detalhe.rota_complementar_volta_id ? String(detalhe.rota_complementar_volta_id) : '');
      } catch (error) {
        if (ativo) {
          setPopupErro(getErrorMessage(error, 'Não foi possível carregar o agendamento para edição.'));
        }
      }
    };

    void carregarAgendamento();

    return () => {
      ativo = false;
    };
  }, [modoEdicao, dataIsoAtual, agendamentoId, setValue]);

  const abrirPicker = (title: string, options: OpcaoSelect[], onSelect: (val: string) => void) => {
    setModalPicker({ visible: true, title, options, onSelect });
  };

  const getLabelPorValor = (options: OpcaoSelect[] | undefined, val: string | undefined) => {
    if (!val || !options) return 'Selecionar';
    const achado = options.find(o => o.value === val);
    return achado ? achado.label : 'Selecionar';
  };

  const resolverAgendamentoId = async (): Promise<number | null> => {
    if (agendamentoId) return agendamentoId;

    const lista = await agendamentoService.listarAgendamentosAtivos();
    const encontrado = lista.find(item => item.dataIso === dataIsoAtual);
    const id = encontrado?.idAgendamento ?? null;
    if (id) setAgendamentoId(id);
    return id;
  };

  const handleSalvarDia = async (dados: AgendamentoDiaFormData) => {
    if (!dataIsoAtual) return;

    if (!dados.usaIda && !dados.usaVolta) {
      if (modoEdicao) {
        setPopupCancelarVisible(true);
      } else {
        setPopupNenhumCriadoVisible(true);
      }
      return;
    }

    const payload: AgendamentoPayload = {
      data: dataIsoAtual,
      usa_ida: dados.usaIda,
      usa_volta: dados.usaVolta,
      ponto_embarque_id: dados.usaIda ? numeroOuNulo(dados.pontoEmbarqueIda) : null,
      ies_destino_id: dados.usaIda ? numeroOuNulo(dados.faculdadeDestinoIda) : null,
      rota_complementar_ida_id: dados.usaIda ? numeroOuNulo(dados.rotaComplementarIda) : null,
      ponto_desembarque_id: dados.usaVolta ? numeroOuNulo(dados.pontoDesembarqueVolta) : null,
      ies_origem_id: dados.usaVolta ? numeroOuNulo(dados.faculdadeOrigemVolta) : null,
      rota_complementar_volta_id: dados.usaVolta ? numeroOuNulo(dados.rotaComplementarVolta) : null,
    };

    setIsLoading(true);
    try {
      let resposta;
      if (modoEdicao) {
        const id = await resolverAgendamentoId();
        if (!id) {
          setPopupErro('Agendamento não encontrado para esta data. Volte e tente novamente.');
          return;
        }
        resposta = await agendamentoService.atualizarAgendamento(id, payload);
      } else {
        resposta = await agendamentoService.criarAgendamento(payload);
      }

      const novoDia: AgendamentoDia = {
        ...dados,
        dataIso: dataIsoAtual,
      };
      const novaLista = [...agendamentosSalvos.filter(item => item.dataIso !== dataIsoAtual), novoDia];
      setAgendamentosSalvos(novaLista);

      if (indiceDataAtual < datasArray.length - 1) {
        setIndiceDataAtual(indiceDataAtual + 1);
        setSnackbarMessage(
          resposta?.mensagem
            ? `${resposta.mensagem}. Avançando para o próximo dia.`
            : 'Agendamento salvo. Avançando para o próximo dia.'
        );
        setSnackbarVisivel(true);
      } else {
        router.push({
          pathname: '/(aluno)/agendar-transporte/sucesso',
          params: { agendamentosJson: JSON.stringify(novaLista) },
        } as any);
      }
    } catch (error) {
      setPopupErro(getErrorMessage(error, 'Não foi possível salvar o agendamento. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  const finalizarSemCriarAgendamento = () => {
    setPopupNenhumCriadoVisible(false);

    if (indiceDataAtual < datasArray.length - 1) {
      setIndiceDataAtual(indiceDataAtual + 1);
      return;
    }

    if (agendamentosSalvos.length > 0) {
      router.push({
        pathname: '/(aluno)/agendar-transporte/sucesso',
        params: { agendamentosJson: JSON.stringify(agendamentosSalvos) },
      } as any);
      return;
    }

    router.replace('/(aluno)/(tabs)/home' as any);
  };

  const handleConfirmarCancelamento = async () => {
    setPopupCancelarVisible(false);
    setIsLoading(true);
    try {
      const id = await resolverAgendamentoId();
      if (!id) {
        setPopupErro('Agendamento não encontrado para esta data. Volte e tente novamente.');
        return;
      }

      const resposta = await agendamentoService.cancelarAgendamento(id);
      setSnackbarMessage(resposta?.mensagem || 'Agendamento cancelado com sucesso');
      setSnackbarVisivel(true);
      setTimeout(() => {
        router.replace('/(aluno)/(tabs)/agenda' as any);
      }, 1200);
    } catch (error) {
      setPopupErro(getErrorMessage(error, 'Não foi possível cancelar o agendamento. Tente novamente.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (datasArray.length === 0 || !dataIsoAtual) {
    return (
      <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={32} color="#333" />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>Configurar agendamento</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text variant="bodyLarge" style={styles.emptyText}>
            Nenhuma data foi selecionada. Volte e escolha os dias desejados.
          </Text>
          <Button mode="contained" onPress={() => router.back()} style={styles.saveBtn}>
            Voltar
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {formatarDataCabecalho(dataIsoAtual)}
        </Text>
      </View>

      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {datasArray.map((dIso, idx) => {
            const isAtivo = idx === indiceDataAtual;

            return (
              <TouchableOpacity
                key={dIso}
                onPress={() => setIndiceDataAtual(idx)}
                style={[styles.tabButton, isAtivo && styles.tabButtonActive]}
              >
                <Text style={[styles.tabText, isAtivo && styles.tabTextActive]}>{formatarRotuloAba(dIso)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <AppPopup
        visible={popupCancelarVisible}
        type="warning"
        title="Cancelar agendamento?"
        message="Esta ação não poderá ser desfeita."
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarCancelamento}
        onDismiss={() => setPopupCancelarVisible(false)}
      />

      <AppPopup
        visible={popupNenhumCriadoVisible}
        type="info"
        title="Nenhum agendamento criado"
        message="Nenhum agendamento foi criado."
        confirmText="Entendido"
        onConfirm={finalizarSemCriarAgendamento}
        onDismiss={() => setPopupNenhumCriadoVisible(false)}
      />

      <AppPopup
        visible={!!popupErro}
        type="error"
        title="Não foi possível concluir"
        message={popupErro}
        confirmText="Entendido"
        onDismiss={() => setPopupErro('')}
      />

      <Modal visible={modalPicker.visible} transparent animationType="fade" onRequestClose={() => setModalPicker(prev => ({ ...prev, visible: false }))}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalPicker(prev => ({ ...prev, visible: false }))}>
          <Surface style={styles.modalContent} elevation={4}>
            <Text variant="titleMedium" style={styles.modalTitle}>{modalPicker.title}</Text>
            {modalPicker.options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.optionRow}
                onPress={() => {
                  modalPicker.onSelect(opt.value);
                  setModalPicker(prev => ({ ...prev, visible: false }));
                }}
              >
                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {carregandoOpcoes && (
          <View style={styles.optionsFeedback}>
            <ActivityIndicator color="#3E5F90" />
            <Text variant="bodyMedium" style={styles.feedbackText}>Carregando opções...</Text>
          </View>
        )}

        {!carregandoOpcoes && !!erroOpcoes && (
          <Surface style={styles.errorBanner} elevation={0}>
            <Text variant="bodyMedium" style={styles.errorText}>{erroOpcoes}</Text>
            <Button mode="outlined" onPress={() => setVersaoOpcoes(versao => versao + 1)}>
              Tentar novamente
            </Button>
          </Surface>
        )}

        <Text variant="titleMedium" style={styles.sectionTitle}>Ida</Text>
        <Text variant="bodyMedium" style={styles.labelQuestion}>Vai usar o ônibus na ida?</Text>

        <Controller
          control={control}
          name="usaIda"
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value ? 'sim' : 'nao'}
              onValueChange={(val) => onChange(val === 'sim')}
              buttons={[
                { value: 'sim', label: 'Sim', style: value ? styles.segActive : styles.segInactive },
                { value: 'nao', label: 'Não', style: !value ? styles.segActive : styles.segInactive },
              ]}
              style={styles.segmentedBtn}
            />
          )}
        />

        {usaIda && (
          <View style={styles.fieldsGroup}>
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Ponto de embarque *</Text>
              <Controller
                control={control}
                name="pontoEmbarqueIda"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.pontoEmbarqueIda && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione o Ponto de Embarque', opcoes?.pontosEmbarque || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.pontosEmbarque, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.pontoEmbarqueIda && <Text style={styles.errorText}>{errors.pontoEmbarqueIda.message}</Text>}
            </View>

            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Faculdade (IES) de destino *</Text>
              <Controller
                control={control}
                name="faculdadeDestinoIda"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.faculdadeDestinoIda && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione a Faculdade de Destino', opcoes?.faculdades || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.faculdades, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.faculdadeDestinoIda && <Text style={styles.errorText}>{errors.faculdadeDestinoIda.message}</Text>}
            </View>

            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Rota complementar (opcional)</Text>
              <Controller
                control={control}
                name="rotaComplementarIda"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => abrirPicker('Selecione a Rota Complementar', opcoes?.rotasComplementaresIda || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.rotasComplementaresIda, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}

        <Text variant="titleMedium" style={[styles.sectionTitle, { marginTop: 24 }]}>Volta</Text>
        <Text variant="bodyMedium" style={styles.labelQuestion}>Vai usar o ônibus na volta?</Text>

        <Controller
          control={control}
          name="usaVolta"
          render={({ field: { value, onChange } }) => (
            <SegmentedButtons
              value={value ? 'sim' : 'nao'}
              onValueChange={(val) => onChange(val === 'sim')}
              buttons={[
                { value: 'sim', label: 'Sim', style: value ? styles.segActive : styles.segInactive },
                { value: 'nao', label: 'Não', style: !value ? styles.segActive : styles.segInactive },
              ]}
              style={styles.segmentedBtn}
            />
          )}
        />

        {usaVolta && (
          <View style={styles.fieldsGroup}>
            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Faculdade de origem *</Text>
              <Controller
                control={control}
                name="faculdadeOrigemVolta"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.faculdadeOrigemVolta && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione a Faculdade de Origem', opcoes?.faculdades || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.faculdades, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.faculdadeOrigemVolta && <Text style={styles.errorText}>{errors.faculdadeOrigemVolta.message}</Text>}
            </View>

            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Ponto de desembarque *</Text>
              <Controller
                control={control}
                name="pontoDesembarqueVolta"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={[styles.selectBox, !!errors.pontoDesembarqueVolta && styles.selectBoxError]}
                    onPress={() => abrirPicker('Selecione o Ponto de Desembarque', opcoes?.pontosEmbarque || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.pontosEmbarque, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
              {errors.pontoDesembarqueVolta && <Text style={styles.errorText}>{errors.pontoDesembarqueVolta.message}</Text>}
            </View>

            <View style={styles.inputBox}>
              <Text variant="labelMedium" style={styles.inputLabel}>Rota complementar de volta (opcional)</Text>
              <Controller
                control={control}
                name="rotaComplementarVolta"
                render={({ field: { value, onChange } }) => (
                  <TouchableOpacity
                    style={styles.selectBox}
                    onPress={() => abrirPicker('Selecione a Rota Complementar de Volta', opcoes?.rotasComplementaresVolta || [], onChange)}
                  >
                    <Text style={styles.selectText}>{getLabelPorValor(opcoes?.rotasComplementaresVolta, value)}</Text>
                    <ChevronDown size={20} color="#666" />
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {modoEdicao && (
            <Button
              mode="outlined"
              onPress={() => setPopupCancelarVisible(true)}
              textColor="#B00020"
              style={styles.cancelBtn}
              contentStyle={styles.btnContent}
            >
              Cancelar Agendamento
            </Button>
          )}

          <Button
            mode="contained"
            onPress={() => { void handleSubmit(handleSalvarDia)(); }}
            loading={isLoading}
            disabled={isLoading || carregandoOpcoes || !!erroOpcoes}
            style={styles.saveBtn}
            contentStyle={styles.btnContent}
          >
            {modoEdicao
              ? 'Salvar alterações'
              : indiceDataAtual < datasArray.length - 1
              ? 'Salvar dia e ir para o próximo'
              : 'Confirmar agendamento'}
          </Button>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisivel}
        onDismiss={() => setSnackbarVisivel(false)}
        action={{
          label: '',
          icon: () => <X size={20} color="#fff" />,
          onPress: () => setSnackbarVisivel(false),
        }}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
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
    marginBottom: 12,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
    fontSize: 20,
  },
  tabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tabsRow: {
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E0E2EC',
  },
  tabButtonActive: {
    backgroundColor: '#C2E7FF',
  },
  tabText: {
    fontSize: 14,
    color: '#43474E',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#001D36',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#191C20',
    marginBottom: 8,
  },
  labelQuestion: {
    color: '#43474E',
    marginBottom: 12,
  },
  segmentedBtn: {
    marginBottom: 20,
    width: 160,
  },
  segActive: {
    backgroundColor: '#00639A',
  },
  segInactive: {
    backgroundColor: '#FFF',
  },
  fieldsGroup: {
    gap: 16,
  },
  inputBox: {
    marginBottom: 4,
  },
  inputLabel: {
    color: '#43474E',
    marginBottom: 6,
  },
  selectBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 8,
  },
  selectBoxError: {
    borderColor: '#BA1A1A',
    borderWidth: 1.5,
  },
  selectText: {
    fontSize: 15,
    color: '#191C20',
  },
  errorText: {
    color: '#BA1A1A',
    fontSize: 12,
    marginTop: 4,
  },
  optionsFeedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  feedbackText: {
    color: '#43474E',
  },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionsContainer: {
    marginTop: 32,
    gap: 12,
  },
  saveBtn: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  cancelBtn: {
    borderRadius: 8,
    borderColor: '#BA1A1A',
  },
  btnContent: {
    height: 55,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#43474E',
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
  snackbar: {
    backgroundColor: '#322F35',
  },
});
