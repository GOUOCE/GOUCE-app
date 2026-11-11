import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { agendamentoService, CalendarioDia } from '@/services/agendamentoService';
import { AppPopup } from '@/components/ui/AppPopup';
import { getErrorMessage } from '@/utils/errorUtils';

type StatusDia = 'disponivel' | 'agendado' | 'feriado' | 'indisponivel';

interface DiaSemana {
  sigla: string;
  diaNum: number;
  dataIso: string;
  status: StatusDia;
  agendamentoId?: number;
  nomeExtenso: string;
}

const SIGLAS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const NOMES_DIAS = [
  'Domingo',
  'Segunda-Feira',
  'Terça-Feira',
  'Quarta-Feira',
  'Quinta-Feira',
  'Sexta-Feira',
  'Sábado',
];

// Janela usada só até o app descobrir a janela real pelo calendário da API (padrão do servidor: 30 dias).
const JANELA_PADRAO_DIAS = 30;
const MESES_PARA_DESCOBRIR_JANELA = 4;

const inicioDoDia = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate());

const adicionarDias = (data: Date, dias: number) => {
  const resultado = inicioDoDia(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
};

const inicioDaSemana = (data: Date) => {
  const resultado = inicioDoDia(data);
  const diasDesdeSegunda = (resultado.getDay() + 6) % 7;
  resultado.setDate(resultado.getDate() - diasDesdeSegunda);
  return resultado;
};

const paraIso = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const paraMes = (data: Date) => `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;

const juntarComE = (itens: string[]) =>
  itens.length <= 1 ? (itens[0] ?? '') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;

const formatarCurto = (data: Date) =>
  `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}`;

export default function SelecaoDiasScreen() {
  const router = useRouter();

  const hoje = inicioDoDia(new Date());
  const [diasJanela, setDiasJanela] = useState(JANELA_PADRAO_DIAS);
  const limiteJanela = adicionarDias(hoje, diasJanela - 1);

  const [semanaInicio, setSemanaInicio] = useState<Date>(() => inicioDaSemana(new Date()));
  const [estados, setEstados] = useState<Record<string, CalendarioDia>>({});
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [diaParaEditar, setDiaParaEditar] = useState<DiaSemana | null>(null);
  const [popupEditarVisible, setPopupEditarVisible] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [versaoCarga, setVersaoCarga] = useState(0);
  const primeiraFocus = useRef(true);

  // Descobre o fim da janela pelos dias que a API devolve (o servidor lê a janela de AGENDAMENTO_JANELA_DIAS).
  useEffect(() => {
    let ativo = true;

    const descobrirJanela = async () => {
      const base = inicioDoDia(new Date());
      const meses = Array.from({ length: MESES_PARA_DESCOBRIR_JANELA }, (_, indice) =>
        paraMes(new Date(base.getFullYear(), base.getMonth() + indice, 1))
      );
      const respostas = await Promise.allSettled(
        meses.map(mes => agendamentoService.obterCalendario(mes))
      );
      const datas: string[] = [];
      respostas.forEach(resposta => {
        if (resposta.status === 'fulfilled') {
          resposta.value.dias.forEach(dia => datas.push(dia.data));
        }
      });
      const ultima = datas.sort().pop();
      if (!ativo || !ultima) return;

      const [ano, mes, dia] = ultima.split('-').map(Number);
      const diferenca = Math.round((new Date(ano, mes - 1, dia).getTime() - base.getTime()) / 86400000) + 1;
      if (diferenca > 0) setDiasJanela(diferenca);
    };

    void descobrirJanela();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    const carregarCalendario = async () => {
      setCarregando(true);
      setErro('');
      try {
        const fimSemana = adicionarDias(semanaInicio, 6);
        const meses = Array.from(new Set([paraMes(semanaInicio), paraMes(fimSemana)]));
        const respostas = await Promise.all(
          meses.map(mes => agendamentoService.obterCalendario(mes))
        );
        if (!ativo) return;

        const mapa: Record<string, CalendarioDia> = {};
        respostas.forEach(resposta => {
          resposta.dias.forEach(dia => {
            mapa[dia.data] = dia;
          });
        });
        setEstados(mapa);
      } catch (error) {
        if (!ativo) return;
        setEstados({});
        setErro(getErrorMessage(error, 'Não foi possível carregar o calendário. Tente novamente.'));
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    void carregarCalendario();

    return () => {
      ativo = false;
    };
  }, [semanaInicio, versaoCarga]);

  useFocusEffect(
    useCallback(() => {
      if (primeiraFocus.current) {
        primeiraFocus.current = false;
        return;
      }
      setVersaoCarga(versao => versao + 1);
    }, [])
  );

  const dias: DiaSemana[] = Array.from({ length: 7 }, (_, indice) => {
    const data = adicionarDias(semanaInicio, indice);
    const dataIso = paraIso(data);
    const item = estados[dataIso];
    const fimDeSemana = data.getDay() === 0 || data.getDay() === 6;
    const foraDaJanela = data < hoje || data > limiteJanela;

    let status: StatusDia = 'indisponivel';
    if (item?.estado === 'AGENDADO') {
      status = 'agendado';
    } else if (item?.estado === 'FERIADO' || item?.estado === 'RECESSO') {
      status = 'feriado';
    } else if (item?.estado === 'DISPONIVEL' && !fimDeSemana && !foraDaJanela) {
      status = 'disponivel';
    }

    return {
      sigla: SIGLAS[data.getDay()],
      diaNum: data.getDate(),
      dataIso,
      status,
      agendamentoId: item?.agendamento_id ?? undefined,
      nomeExtenso: `${NOMES_DIAS[data.getDay()]} (${String(data.getDate()).padStart(2, '0')})`,
    };
  });

  const podeVoltarSemana = semanaInicio > inicioDaSemana(hoje);
  const podeAvancarSemana = adicionarDias(semanaInicio, 7) <= limiteJanela;

  const handleToggleDia = (dia: DiaSemana) => {
    if (dia.status === 'indisponivel' || dia.status === 'feriado') return;

    if (dia.status === 'agendado') {
      setDiaParaEditar(dia);
      setPopupEditarVisible(true);
      return;
    }

    setDiasSelecionados((selecionados) =>
      selecionados.includes(dia.dataIso)
        ? selecionados.filter(dataIso => dataIso !== dia.dataIso)
        : [...selecionados, dia.dataIso]
    );
  };

  const handleConfirmarEdicao = () => {
    setPopupEditarVisible(false);
    if (!diaParaEditar) return;

    router.push({
      pathname: '/(aluno)/agendar-transporte/configurar',
      params: {
        datasIso: diaParaEditar.dataIso,
        modoEdicao: 'true',
        ...(diaParaEditar.agendamentoId
          ? { agendamentoId: String(diaParaEditar.agendamentoId) }
          : {}),
      },
    } as any);
  };

  const handleContinuar = () => {
    if (diasSelecionados.length === 0) return;
    router.push({
      pathname: '/(aluno)/agendar-transporte/configurar',
      params: { datasIso: diasSelecionados.join(',') },
    } as any);
  };

  const hojeIso = paraIso(hoje);
  const diasAgendados = dias.filter(dia => dia.status === 'agendado' && dia.dataIso >= hojeIso);
  const textoAgendados =
    diasAgendados.length === 1
      ? `${diasAgendados[0].nomeExtenso} já possui agendamento`
      : `${juntarComE(diasAgendados.map(dia => dia.nomeExtenso))} já possuem agendamento`;

  return (
    <View style={[styles.container, { backgroundColor: '#F8F9FF' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Agendar Transporte</Text>
      </View>

      <AppPopup
        visible={popupEditarVisible}
        type="info"
        title="Agendamento já existente"
        message="Deseja editar o agendamento existente?"
        confirmText="Confirmar"
        cancelText="Cancelar"
        onConfirm={handleConfirmarEdicao}
        onDismiss={() => setPopupEditarVisible(false)}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Selecione um ou mais dias para agendar o transporte nesta semana.
        </Text>

        <View style={styles.weekNavigator}>
          <TouchableOpacity
            onPress={() => podeVoltarSemana && setSemanaInicio(adicionarDias(semanaInicio, -7))}
            disabled={!podeVoltarSemana}
            style={[styles.navButton, !podeVoltarSemana && styles.navButtonDisabled]}
          >
            <ChevronLeft size={22} color={podeVoltarSemana ? '#3E5F90' : '#B0B3BC'} />
          </TouchableOpacity>

          <Text variant="titleSmall" style={styles.weekLabel}>
            {formatarCurto(semanaInicio)} a {formatarCurto(adicionarDias(semanaInicio, 6))}
          </Text>

          <TouchableOpacity
            onPress={() => podeAvancarSemana && setSemanaInicio(adicionarDias(semanaInicio, 7))}
            disabled={!podeAvancarSemana}
            style={[styles.navButton, !podeAvancarSemana && styles.navButtonDisabled]}
          >
            <ChevronRight size={22} color={podeAvancarSemana ? '#3E5F90' : '#B0B3BC'} />
          </TouchableOpacity>
        </View>

        {carregando ? (
          <View style={styles.feedbackBox}>
            <ActivityIndicator color="#3E5F90" />
            <Text variant="bodyMedium" style={styles.feedbackText}>
              Carregando calendário...
            </Text>
          </View>
        ) : erro ? (
          <View style={styles.feedbackBox}>
            <Text variant="bodyMedium" style={styles.errorText}>{erro}</Text>
            <Button mode="outlined" onPress={() => setVersaoCarga(versao => versao + 1)}>
              Tentar novamente
            </Button>
          </View>
        ) : (
          <>
            <View style={styles.daysRow}>
              {dias.map((dia) => {
                const isSelecionado = diasSelecionados.includes(dia.dataIso);
                const isAgendado = dia.status === 'agendado';
                const isIndisponivel = dia.status === 'indisponivel' || dia.status === 'feriado';

                return (
                  <TouchableOpacity
                    key={dia.dataIso}
                    onPress={() => handleToggleDia(dia)}
                    activeOpacity={isIndisponivel ? 1 : 0.7}
                    testID={`dia-${dia.dataIso}`}
                    style={[
                      styles.dayCard,
                      isSelecionado && styles.dayCardSelected,
                      isAgendado && styles.dayCardAgendado,
                      isIndisponivel && styles.dayCardDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.daySigla,
                      isSelecionado && styles.textSelected,
                      isAgendado && styles.textAgendado,
                      isIndisponivel && styles.textDisabled,
                    ]}>
                      {dia.sigla}
                    </Text>
                    <Text style={[
                      styles.dayNum,
                      isSelecionado && styles.textSelected,
                      isAgendado && styles.textAgendado,
                      isIndisponivel && styles.textDisabled,
                    ]}>
                      {dia.diaNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.infoBox}>
              <Text variant="bodyMedium" style={styles.infoTextCount}>
                {diasSelecionados.length} {diasSelecionados.length === 1 ? 'dia selecionado' : 'dias selecionados'}
              </Text>
              {diasAgendados.length > 0 && (
                <Text variant="bodyMedium" style={styles.infoTextAgendada}>
                  {textoAgendados}
                </Text>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleContinuar}
              disabled={diasSelecionados.length === 0}
              style={styles.continueButton}
              contentStyle={styles.btnContent}
            >
              Continuar
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
  subtitle: {
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  weekNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C2D6F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonDisabled: {
    borderColor: '#E0E2EC',
    backgroundColor: '#F1F3F9',
  },
  weekLabel: {
    fontWeight: 'bold',
    color: '#3E5F90',
  },
  feedbackBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  feedbackText: {
    color: '#43474E',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dayCard: {
    width: 44,
    height: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3E5F90',
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dayCardSelected: {
    backgroundColor: '#C2E7FF',
    borderColor: '#3E5F90',
  },
  dayCardAgendado: {
    backgroundColor: '#E8DEF8',
    borderColor: '#6750A4',
  },
  dayCardDisabled: {
    backgroundColor: '#F1F3F9',
    borderColor: '#C4C6CF',
    borderStyle: 'dashed',
  },
  daySigla: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  textSelected: {
    color: '#001D36',
  },
  textAgendado: {
    color: '#21005D',
  },
  textDisabled: {
    color: '#8E9199',
  },
  infoBox: {
    marginBottom: 32,
    gap: 4,
  },
  infoTextCount: {
    fontWeight: '600',
    color: '#333',
  },
  infoTextAgendada: {
    color: '#3E5F90',
    fontWeight: '500',
  },
  errorText: {
    color: '#BA1A1A',
    textAlign: 'center',
  },
  continueButton: {
    borderRadius: 8,
    backgroundColor: '#3E5F90',
  },
  btnContent: {
    height: 55,
  },
});
