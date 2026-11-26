import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ArrowLeft,
  CalendarX2,
  Check,
  ChevronDown,
  ChevronUp,
  Printer,
  Route,
  Search,
  X,
} from 'lucide-react-native';
import {
  calcularTotaisFrequencia,
  extrairMensagemErroListaEmbarque,
  formatarTempoSincronizacao,
  listaEmbarqueService,
  type AlunoEmbarqueItem,
  type ListaEmbarqueRota,
  type PerfilListaEmbarque,
  type RotaEmbarqueOpcao,
} from '@/services/listaEmbarqueService';
import { imprimirListaEmbarque } from '@/utils/impressaoListaEmbarque';

export interface ListaEmbarqueConteudoProps {
  perfil: PerfilListaEmbarque;
  nomeEmissor?: string;
  iesResponsavel?: string;
  rotaFixaId?: number;
  rotaFixaNome?: string;
  dataOperacaoIso?: string;
  modoFixoInicial?: boolean;
  exibirBotaoVoltar?: boolean;
  onVoltar?: () => void;
}

function formatarContadorAlunos(total: number): string {
  return total === 1 ? '1 aluno alocado' : `${total} alunos alocados`;
}

function formatarDataHojeCabecalho(): string {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, '0');
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const ano = agora.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarDataIsoCabecalho(dataIso?: string): string {
  const match = (dataIso ?? '').trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return formatarDataHojeCabecalho();
  }
  const [, ano, mes, dia] = match;
  return `${dia}/${mes}/${ano}`;
}

function dataLocalIsoHoje(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function normalizarBuscaTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

function iniciaisDeNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

function obterTotaisFrequencia(alunos: AlunoEmbarqueItem[]): {
  totalPresentes: number;
  totalFaltas: number;
  totalPendentes: number;
} {
  if (typeof calcularTotaisFrequencia === 'function') {
    return calcularTotaisFrequencia(alunos);
  }
  const fnService = (listaEmbarqueService as any)?.calcularTotaisFrequencia;
  if (typeof fnService === 'function') {
    return fnService(alunos);
  }

  let totalPresentes = 0;
  let totalFaltas = 0;
  let totalPendentes = 0;
  for (const aluno of alunos) {
    if (aluno.statusPresenca === 'PRESENTE') {
      totalPresentes += 1;
    } else if (aluno.statusPresenca === 'FALTA') {
      totalFaltas += 1;
    } else {
      totalPendentes += 1;
    }
  }
  return { totalPresentes, totalFaltas, totalPendentes };
}

async function buscarFrequenciasPendentesRota(rotaId: number, dataIso?: string) {
  const obterPendentes = (listaEmbarqueService as any)?.obterFrequenciasPendentes;
  if (typeof obterPendentes !== 'function') {
    return [];
  }
  return obterPendentes({ rotaId, ...(dataIso ? { data: dataIso } : {}) });
}

/**
 * Componente compartilhado da Lista de Embarque (HU-018) e Registro de Frequência (HU-021),
 * atendendo seleção por rota, acesso direto, Representante e modo somente leitura.
 */
export function ListaEmbarqueConteudo({
  perfil,
  nomeEmissor,
  iesResponsavel,
  rotaFixaId,
  rotaFixaNome,
  dataOperacaoIso,
  modoFixoInicial = false,
  exibirBotaoVoltar = false,
  onVoltar,
}: ListaEmbarqueConteudoProps) {
  const [modoFixoManual, setModoFixoManual] = useState<boolean | null>(null);
  const [rotasDisponiveis, setRotasDisponiveis] = useState<RotaEmbarqueOpcao[]>([]);
  const [rotaManualId, setRotaManualId] = useState<number | null>(null);
  const [lista, setLista] = useState<ListaEmbarqueRota | null>(null);
  const [carregando, setCarregando] = useState<boolean>(
    () => rotaFixaId !== undefined || (perfil === 'MOTORISTA' && modoFixoInicial)
  );
  const [imprimindo, setImprimindo] = useState<boolean>(false);
  const [modalRotasVisivel, setModalRotasVisivel] = useState<boolean>(false);
  const [erroMensagem, setErroMensagem] = useState<string>('');
  const [buscaAluno, setBuscaAluno] = useState<string>('');
  const [sincronizacaoPendente, setSincronizacaoPendente] = useState<boolean>(false);
  const [semViagensData, setSemViagensData] = useState<boolean>(false);
  const [agora, setAgora] = useState<Date>(() => new Date());
  const escritasEmAndamentoRef = useRef(0);

  const modoFixo = modoFixoManual ?? modoFixoInicial;
  const rotaSelecionadaId = rotaManualId ?? rotaFixaId ?? null;
  const autodescobertaRepresentante =
    perfil === 'MOTORISTA' && modoFixo && rotaSelecionadaId === null;
  const deveConsultarLista = rotaSelecionadaId !== null || autodescobertaRepresentante;

  useEffect(() => {
    if (modoFixo) {
      return;
    }

    let ativo = true;

    listaEmbarqueService
      .listarRotasDisponiveis(dataOperacaoIso)
      .then((opcoes) => {
        if (!ativo) return;
        setRotasDisponiveis(opcoes);
        setSemViagensData(opcoes.length === 0);
      })
      .catch((erro: any) => {
        if (!ativo) return;
        const detail = erro?.response?.data?.detail;
        if (erro?.response?.status === 404 && detail?.code === 'SEM_ROTA_NO_DIA') {
          setSemViagensData(true);
          setRotasDisponiveis([]);
          setErroMensagem('');
          return;
        }
        setErroMensagem(
          extrairMensagemErroListaEmbarque(
            erro,
            'Não foi possível carregar as rotas disponíveis.'
          )
        );
      });

    return () => {
      ativo = false;
    };
  }, [modoFixo, dataOperacaoIso]);

  useEffect(() => {
    const intervalo = setInterval(() => {
      setAgora(new Date());
    }, 30_000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!deveConsultarLista) {
      return;
    }

    let ativo = true;

    listaEmbarqueService
      .obterListaEmbarque({
        rotaId: rotaSelecionadaId ?? undefined,
        data: dataOperacaoIso,
        perfil,
        iesResponsavel,
      })
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
        setSemViagensData(false);
        setErroMensagem('');
        setAgora(new Date());
        void buscarFrequenciasPendentesRota(
          dados.rotaId,
          dataOperacaoIso ?? dados.dataOperacaoIso
        ).then((pendentes) => {
          if (ativo) {
            setSincronizacaoPendente(pendentes.length > 0);
          }
        });
      })
      .catch((erro: any) => {
        if (!ativo) return;
        const detail = erro?.response?.data?.detail;
        if (
          erro?.response?.status === 422 &&
          detail?.code === 'MULTIPLAS_ROTAS' &&
          Array.isArray(detail.rotas_disponiveis)
        ) {
          setRotasDisponiveis(
            detail.rotas_disponiveis.map((r: any) => ({
              id: r.rota_id,
              nome: r.nome_rota,
              horarioSaida: r.horario_saida,
            }))
          );
          setModoFixoManual(false);
          setErroMensagem('');
          setLista(null);
          return;
        }

        if (erro?.response?.status === 404 && detail?.code === 'SEM_ROTA_NO_DIA') {
          setSemViagensData(true);
          setErroMensagem('');
          setLista(null);
          return;
        }

        setErroMensagem(
          extrairMensagemErroListaEmbarque(erro, 'Erro ao carregar a lista de embarque.')
        );
        setLista(null);
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [deveConsultarLista, rotaSelecionadaId, dataOperacaoIso, perfil, iesResponsavel]);

  const dataOperacaoEsperadaBr = dataOperacaoIso
    ? formatarDataIsoCabecalho(dataOperacaoIso)
    : null;
  const listaNaData =
    !dataOperacaoEsperadaBr || lista?.dataOperacao === dataOperacaoEsperadaBr ? lista : null;

  const listaAtiva =
    rotaSelecionadaId !== null
      ? listaNaData?.rotaId === rotaSelecionadaId
        ? listaNaData
        : null
      : autodescobertaRepresentante
        ? listaNaData
        : null;

  const rotaAtivaId = rotaSelecionadaId ?? listaAtiva?.rotaId ?? null;

  useEffect(() => {
    if (rotaAtivaId === null) {
      return;
    }

    let ativo = true;
    const cancelarInscricao = listaEmbarqueService.inscreverAtualizacaoRota(
      rotaAtivaId,
      (listaAtualizada) => {
        if (!ativo || escritasEmAndamentoRef.current > 0) return;
        setLista(listaAtualizada);
        setAgora(new Date());
        void buscarFrequenciasPendentesRota(
          listaAtualizada.rotaId,
          dataOperacaoIso ?? listaAtualizada.dataOperacaoIso
        ).then((pendentes) => {
          if (ativo) {
            setSincronizacaoPendente(pendentes.length > 0);
          }
        });
      },
      { data: dataOperacaoIso, perfil, iesResponsavel }
    );

    const sincronizarImediatamente = () => {
      if (!ativo || escritasEmAndamentoRef.current > 0) return;
      void (async () => {
        try {
          const sincronizar = (listaEmbarqueService as any)?.sincronizarFrequenciasPendentes;
          if (typeof sincronizar === 'function') {
            await sincronizar();
          }
          const listaAtualizada = await listaEmbarqueService.obterListaEmbarque({
            rotaId: rotaAtivaId,
            data: dataOperacaoIso,
            perfil,
            iesResponsavel,
          });
          if (!ativo || escritasEmAndamentoRef.current > 0) return;
          setLista(listaAtualizada);
          setAgora(new Date());
          const pendentes = await buscarFrequenciasPendentesRota(
            listaAtualizada.rotaId,
            dataOperacaoIso ?? listaAtualizada.dataOperacaoIso
          );
          if (ativo) {
            setSincronizacaoPendente(pendentes.length > 0);
          }
        } catch {
          // Mantém o estado atual caso a tentativa imediata em segundo plano falhe.
        }
      })();
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sincronizarImediatamente();
      }
    };

    const temWindowEventos =
      typeof window !== 'undefined' && typeof window.addEventListener === 'function';
    const temDocumentVisibility =
      typeof document !== 'undefined' && typeof document.addEventListener === 'function';

    if (temWindowEventos) {
      window.addEventListener('online', sincronizarImediatamente);
      window.addEventListener('focus', sincronizarImediatamente);
    }
    if (temDocumentVisibility) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    const appStateSubscription =
      typeof AppState?.addEventListener === 'function'
        ? AppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
              sincronizarImediatamente();
            }
          })
        : null;

    return () => {
      ativo = false;
      cancelarInscricao();
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('online', sincronizarImediatamente);
        window.removeEventListener('focus', sincronizarImediatamente);
      }
      if (typeof document !== 'undefined' && typeof document.removeEventListener === 'function') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      appStateSubscription?.remove?.();
    };
  }, [rotaAtivaId, dataOperacaoIso, perfil, iesResponsavel]);

  const rotaSelecionadaOpcao = useMemo(
    () => rotasDisponiveis.find((item) => item.id === rotaSelecionadaId) ?? null,
    [rotasDisponiveis, rotaSelecionadaId]
  );

  const dataExibida = listaAtiva?.dataOperacao ?? formatarDataIsoCabecalho(dataOperacaoIso);
  const subtituloData = modoFixo ? dataExibida : `Hoje - ${dataExibida}`;
  const nomeRotaFixa = listaAtiva?.rotaNome ?? rotaSelecionadaOpcao?.nome ?? rotaFixaNome ?? '';
  const totalAlunos = listaAtiva?.totalAlunos ?? 0;
  const somenteLeituraData =
    Boolean(listaAtiva?.somenteLeitura) ||
    Boolean(dataOperacaoIso && dataOperacaoIso !== dataLocalIsoHoje());

  const alunosFiltrados = useMemo(() => {
    if (!listaAtiva) return [];
    const termo = normalizarBuscaTexto(buscaAluno);
    if (!termo) return listaAtiva.alunos;
    return listaAtiva.alunos.filter((aluno) =>
      normalizarBuscaTexto(aluno.nome).includes(termo)
    );
  }, [listaAtiva, buscaAluno]);

  const totaisFrequencia = useMemo(() => {
    if (!listaAtiva) {
      return { totalPresentes: 0, totalFaltas: 0, totalPendentes: 0 };
    }
    return obterTotaisFrequencia(listaAtiva.alunos);
  }, [listaAtiva]);

  const podeImprimir = Boolean(
    listaAtiva &&
      totalAlunos > 0 &&
      listaAtiva.permiteImprimir !== false &&
      !imprimindo &&
      !carregando
  );

  const handleSelecionarRota = (rotaId: number) => {
    if (rotaId !== rotaSelecionadaId) {
      setCarregando(true);
      setErroMensagem('');
    }
    setRotaManualId(rotaId);
    setModalRotasVisivel(false);
  };

  const handleMarcarPresenca = async (
    aluno: AlunoEmbarqueItem,
    novoStatus: 'PRESENTE' | 'FALTA'
  ) => {
    if (!listaAtiva || somenteLeituraData) return;
    if (aluno.statusPresenca === novoStatus && !sincronizacaoPendente) {
      return;
    }

    const agendamentoId = aluno.agendamentoId ?? aluno.id;
    const listaAnterior = listaAtiva;
    const alunosAtualizados = listaAtiva.alunos.map((item) =>
      (item.agendamentoId ?? item.id) === agendamentoId
        ? { ...item, statusPresenca: novoStatus }
        : item
    );
    const totaisAtualizados = obterTotaisFrequencia(alunosAtualizados);

    setErroMensagem('');
    setLista({
      ...listaAtiva,
      alunos: alunosAtualizados,
      ...totaisAtualizados,
    });

    escritasEmAndamentoRef.current += 1;
    try {
      const dataChamadaIso = dataOperacaoIso ?? listaAtiva.dataOperacaoIso;
      const resultado = await listaEmbarqueService.registrarFrequencia({
        rotaId: listaAtiva.rotaId,
        agendamentoId,
        statusPresenca: novoStatus,
        data: dataChamadaIso,
      });

      if (resultado.pendenteOffline) {
        setSincronizacaoPendente(true);
      } else {
        const restantes = await buscarFrequenciasPendentesRota(listaAtiva.rotaId, dataChamadaIso);
        setSincronizacaoPendente(restantes.length > 0);
        const agoraSync = new Date();
        const agoraIso = agoraSync.toISOString();
        setLista((atual) =>
          atual ? { ...atual, ultimaSincronizacaoISO: agoraIso } : atual
        );
        setAgora(agoraSync);
      }
    } catch (erro: unknown) {
      setLista(listaAnterior);
      setErroMensagem(
        extrairMensagemErroListaEmbarque(erro, 'Não foi possível registrar a frequência.')
      );
    } finally {
      escritasEmAndamentoRef.current = Math.max(0, escritasEmAndamentoRef.current - 1);
    }
  };

  const handleImprimir = async () => {
    if (!listaAtiva || listaAtiva.totalAlunos === 0 || imprimindo) return;
    setImprimindo(true);
    setErroMensagem('');
    try {
      await imprimirListaEmbarque(listaAtiva, {
        perfil,
        nomeEmissor,
      });
    } catch (erro: unknown) {
      setErroMensagem(
        erro instanceof Error
          ? erro.message
          : 'Não foi possível gerar a impressão da lista.'
      );
    } finally {
      setImprimindo(false);
    }
  };

  const renderAlunoItem = ({ item }: { item: AlunoEmbarqueItem }) => {
    const statusAtual = item.statusPresenca ?? 'PENDENTE';
    const agId = item.agendamentoId ?? item.id;
    const presenteAtivo = statusAtual === 'PRESENTE';
    const faltaAtiva = statusAtual === 'FALTA';

    return (
      <View style={styles.alunoItem}>
        <View style={styles.alunoAvatar}>
          <Text style={styles.alunoAvatarTexto}>{iniciaisDeNome(item.nome)}</Text>
        </View>
        <View style={styles.alunoInfoCol}>
          <Text style={styles.alunoNome}>{item.nome}</Text>
          <Text style={styles.alunoTrajeto}>{item.trajetoFormatado}</Text>
        </View>
        <View style={[styles.controlesChamadaCol, somenteLeituraData && styles.controlesDesabilitados]}>
          <TouchableOpacity
            style={[
              styles.botaoPresencaCirculo,
              presenteAtivo && styles.botaoPresenteAtivo,
            ]}
            activeOpacity={0.75}
            disabled={somenteLeituraData}
            onPress={() => handleMarcarPresenca(item, 'PRESENTE')}
            accessibilityRole="button"
            accessibilityLabel={`Marcar presença de ${item.nome}`}
            accessibilityState={{ disabled: somenteLeituraData, selected: presenteAtivo }}
            testID={`botao-presenca-presente-${agId}`}
          >
            <Check size={16} color={presenteAtivo ? '#FFFFFF' : '#5F6368'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.botaoPresencaCirculo,
              faltaAtiva && styles.botaoFaltaAtivo,
            ]}
            activeOpacity={0.75}
            disabled={somenteLeituraData}
            onPress={() => handleMarcarPresenca(item, 'FALTA')}
            accessibilityRole="button"
            accessibilityLabel={`Marcar falta de ${item.nome}`}
            accessibilityState={{ disabled: somenteLeituraData, selected: faltaAtiva }}
            testID={`botao-presenca-falta-${agId}`}
          >
            <X size={16} color={faltaAtiva ? '#FFFFFF' : '#5F6368'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCorpoLista = () => {
    if (carregando) {
      return (
        <View style={styles.estadoCentral}>
          <ActivityIndicator size="large" color="#3E5F90" testID="loading-lista-embarque" />
        </View>
      );
    }

    if (erroMensagem && !listaAtiva) {
      return null;
    }

    if (semViagensData && !listaAtiva) {
      return (
        <View style={styles.estadoCentral}>
          <CalendarX2 size={56} color="#44474E" />
          <Text style={styles.mensagemSemViagens} testID="mensagem-sem-viagens-data">
            Não há registros de viagens ou agendamentos para a data selecionada.
          </Text>
        </View>
      );
    }

    if (rotaSelecionadaId === null && !autodescobertaRepresentante) {
      return (
        <View style={styles.estadoCentral}>
          <Text style={styles.mensagemVazia} testID="mensagem-selecione-rota">
            Selecione uma rota para visualizar os alunos alocados.
          </Text>
        </View>
      );
    }

    if (listaAtiva && listaAtiva.totalAlunos === 0) {
      return (
        <View style={styles.estadoCentral}>
          <Text style={styles.mensagemVazia} testID="mensagem-lista-vazia">
            {listaAtiva.mensagem || 'Essa rota não possui nenhum aluno alocado para este dia.'}
          </Text>
        </View>
      );
    }

    if (!listaAtiva) {
      return null;
    }

    return (
      <View style={styles.listaContainer}>
        <View style={styles.buscaCaixa}>
          <TextInput
            style={styles.buscaInput}
            placeholder="Buscar aluno"
            placeholderTextColor="#5F6368"
            value={buscaAluno}
            onChangeText={setBuscaAluno}
            testID="input-buscar-aluno-embarque"
          />
          <Search size={20} color="#44474E" />
        </View>

        <View style={styles.resumoFrequenciaRow}>
          <View style={styles.resumoFrequenciaEsquerda}>
            <Text style={styles.resumoFrequenciaTexto} testID="contador-presentes">
              Presentes: {totaisFrequencia.totalPresentes}
            </Text>
            <Text style={styles.resumoFrequenciaTexto} testID="contador-faltas">
              Faltas: {totaisFrequencia.totalFaltas}
            </Text>
          </View>
          <Text style={styles.resumoFrequenciaTexto} testID="contador-pendentes">
            Pendentes: {totaisFrequencia.totalPendentes}
          </Text>
        </View>

        <Text style={styles.contadorTexto} testID="contador-alunos-alocados">
          {formatarContadorAlunos(listaAtiva.totalAlunos)}
        </Text>

        {alunosFiltrados.length === 0 ? (
          <View style={styles.estadoCentral}>
            <Text style={styles.mensagemVazia} testID="mensagem-busca-vazia">
              Nenhum aluno encontrado para a busca informada.
            </Text>
          </View>
        ) : (
          <FlatList
            data={alunosFiltrados}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderAlunoItem}
            ItemSeparatorComponent={() => <View style={styles.divisorItem} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listaScrollContent}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.cabecalho}>
        {exibirBotaoVoltar && (
          <TouchableOpacity
            onPress={onVoltar}
            style={styles.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            testID="botao-voltar-embarque"
          >
            <ArrowLeft size={24} color="#191C20" />
          </TouchableOpacity>
        )}
        <View style={styles.cabecalhoTextos}>
          <Text style={styles.tituloTela}>Lista de Embarque</Text>
          <Text style={styles.subtituloData} testID="subtitulo-data-embarque">
            {subtituloData}
          </Text>
        </View>
      </View>

      {/* Seletor "Rota *" (52.1 / 52.2) ou Nome fixo da Rota (52.3 / FA-001) */}
      {!modoFixo ? (
        <View style={styles.seletorWrapper}>
          <View style={styles.seletorLabelFlutuante}>
            <Text style={styles.seletorLabelTexto}>
              Rota <Text style={styles.asteriscoObrigatorio}>*</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={styles.seletorCaixa}
            activeOpacity={0.75}
            onPress={() => setModalRotasVisivel((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Selecionar rota"
            testID="seletor-rota"
          >
            <Route size={20} color="#44474E" />
            <Text
              style={[
                styles.seletorValorTexto,
                !rotaSelecionadaOpcao && styles.seletorPlaceholderTexto,
              ]}
              numberOfLines={1}
            >
              {rotaSelecionadaOpcao ? rotaSelecionadaOpcao.nome : 'Selecionar'}
            </Text>
            {modalRotasVisivel ? (
              <ChevronUp size={20} color="#44474E" testID="icone-dropdown-aberto" />
            ) : (
              <ChevronDown size={20} color="#44474E" testID="icone-dropdown-fechado" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.rotaFixaContainer}>
          <Text style={styles.rotaFixaTitulo} testID="titulo-rota-fixa">
            {nomeRotaFixa}
          </Text>
        </View>
      )}

      {sincronizacaoPendente && (
        <View style={styles.bannerOffline} testID="banner-sincronizacao-pendente">
          <Text style={styles.bannerOfflineTexto}>Sem conexão - sincronização pendente</Text>
        </View>
      )}

      {somenteLeituraData && listaAtiva && listaAtiva.totalAlunos > 0 && (
        <View style={styles.bannerSomenteLeitura} testID="banner-somente-leitura-chamada">
          <Text style={styles.bannerSomenteLeituraTexto}>
            Modo somente leitura - a chamada só pode ser realizada no dia exato da viagem.
          </Text>
        </View>
      )}

      {!!erroMensagem && (
        <Text style={styles.erroTexto} testID="mensagem-erro-embarque">
          {erroMensagem}
        </Text>
      )}

      {/* Conteúdo principal */}
      <View style={styles.conteudoPrincipal}>{renderCorpoLista()}</View>

      {/* Rodapé com ação de impressão e indicador de sincronização */}
      <View style={styles.rodapeAcao}>
        <TouchableOpacity
          style={[
            styles.botaoImprimir,
            !podeImprimir && styles.botaoImprimirDesabilitado,
          ]}
          activeOpacity={0.8}
          disabled={!podeImprimir}
          onPress={handleImprimir}
          accessibilityRole="button"
          accessibilityLabel="Imprimir lista"
          accessibilityState={{ disabled: !podeImprimir }}
          testID="botao-imprimir-lista"
        >
          <Printer size={18} color={podeImprimir ? '#FFFFFF' : '#9CA3AF'} />
          <Text
            style={[
              styles.botaoImprimirTexto,
              !podeImprimir && styles.botaoImprimirTextoDesabilitado,
            ]}
          >
            {imprimindo ? 'Gerando impressão...' : 'Imprimir lista'}
          </Text>
        </TouchableOpacity>

        {listaAtiva !== null && (!somenteLeituraData || sincronizacaoPendente) && (
          <Text style={styles.sincronizacaoTexto} testID="indicador-sincronizacao">
            {sincronizacaoPendente
              ? 'Sincronização pendente • salvo localmente'
              : formatarTempoSincronizacao(listaAtiva.ultimaSincronizacaoISO, agora)}
          </Text>
        )}
      </View>

      {/* Modal de seleção de rota */}
      <Modal
        visible={modalRotasVisivel}
        transparent
        animationType="fade"
        onRequestClose={() => setModalRotasVisivel(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalRotasVisivel(false)}
        >
          <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitulo}>Selecionar Rota</Text>
            <ScrollView
              style={styles.modalListaScroll}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              testID="lista-rotas-scroll"
            >
              {rotasDisponiveis.length === 0 ? (
                <Text style={styles.modalVazioTexto}>Nenhuma rota disponível para hoje.</Text>
              ) : (
                rotasDisponiveis.map((rota) => {
                  const selecionada = rota.id === rotaSelecionadaId;
                  return (
                    <TouchableOpacity
                      key={rota.id}
                      style={[styles.modalOpcao, selecionada && styles.modalOpcaoSelecionada]}
                      onPress={() => handleSelecionarRota(rota.id)}
                      testID={`opcao-rota-${rota.id}`}
                    >
                      <Text
                        style={[
                          styles.modalOpcaoNome,
                          selecionada && styles.modalOpcaoNomeSelecionada,
                        ]}
                      >
                        {rota.nome}
                      </Text>
                      <Text style={styles.modalOpcaoSubtitulo}>
                        {rota.quantidadeAlunos !== undefined
                          ? rota.quantidadeAlunos === 0
                            ? 'Sem alunos alocados'
                            : formatarContadorAlunos(rota.quantidadeAlunos)
                          : rota.horarioSaida
                            ? `Horário de saída: ${rota.horarioSaida}`
                            : 'Rota programada'}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  botaoVoltar: {
    padding: 4,
    marginLeft: -4,
  },
  cabecalhoTextos: {
    flex: 1,
  },
  tituloTela: {
    fontSize: 22,
    fontWeight: '600',
    color: '#191C20',
  },
  subtituloData: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 2,
  },
  seletorWrapper: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 10,
  },
  seletorLabelFlutuante: {
    position: 'absolute',
    top: -9,
    left: 12,
    zIndex: 1,
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 4,
  },
  seletorLabelTexto: {
    fontSize: 12,
    color: '#44474E',
    fontWeight: '500',
  },
  asteriscoObrigatorio: {
    color: '#B3261E',
  },
  seletorCaixa: {
    height: 54,
    borderWidth: 1,
    borderColor: '#74777F',
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
  seletorValorTexto: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#191C20',
  },
  seletorPlaceholderTexto: {
    color: '#5F6368',
  },
  rotaFixaContainer: {
    marginBottom: 8,
  },
  rotaFixaTitulo: {
    fontSize: 17,
    fontWeight: '600',
    color: '#191C20',
  },
  bannerOffline: {
    backgroundColor: '#FFDCBE',
    borderWidth: 1,
    borderColor: '#6A3C01',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerOfflineTexto: {
    color: '#6A3C01',
    fontSize: 12,
    fontWeight: '600',
  },
  bannerSomenteLeitura: {
    backgroundColor: '#D5E3FF',
    borderWidth: 1,
    borderColor: '#244777',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  bannerSomenteLeituraTexto: {
    color: '#244777',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  erroTexto: {
    color: '#B3261E',
    fontSize: 13,
    marginBottom: 8,
  },
  conteudoPrincipal: {
    flex: 1,
  },
  estadoCentral: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  mensagemVazia: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 20,
  },
  mensagemSemViagens: {
    fontSize: 13,
    fontWeight: '500',
    color: '#191C20',
    textAlign: 'center',
    lineHeight: 18,
  },
  listaContainer: {
    flex: 1,
  },
  buscaCaixa: {
    height: 48,
    backgroundColor: '#E6E8EE',
    borderRadius: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  buscaInput: {
    flex: 1,
    fontSize: 14,
    color: '#191C20',
    paddingVertical: 8,
  },
  resumoFrequenciaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resumoFrequenciaEsquerda: {
    flexDirection: 'row',
    gap: 16,
  },
  resumoFrequenciaTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: '#191C20',
  },
  contadorTexto: {
    fontSize: 12.5,
    color: '#5F6368',
    marginBottom: 6,
  },
  listaScrollContent: {
    paddingBottom: 12,
  },
  alunoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 12,
  },
  alunoAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3E5F90',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alunoAvatarTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alunoInfoCol: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 15,
    fontWeight: '500',
    color: '#191C20',
  },
  alunoTrajeto: {
    fontSize: 12.5,
    color: '#5F6368',
    marginTop: 2,
  },
  controlesChamadaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlesDesabilitados: {
    opacity: 0.4,
  },
  botaoPresencaCirculo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#74777F',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoPresenteAtivo: {
    backgroundColor: '#006A6A',
    borderColor: '#006A6A',
  },
  botaoFaltaAtivo: {
    backgroundColor: '#8C4A3E',
    borderColor: '#8C4A3E',
  },
  divisorItem: {
    height: 1,
    backgroundColor: '#D8DCE6',
  },
  rodapeAcao: {
    paddingTop: 6,
  },
  botaoImprimir: {
    height: 48,
    borderRadius: 10,
    backgroundColor: '#3E5F90',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  botaoImprimirDesabilitado: {
    backgroundColor: '#E5E7EB',
  },
  botaoImprimirTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  botaoImprimirTextoDesabilitado: {
    color: '#9CA3AF',
  },
  sincronizacaoTexto: {
    textAlign: 'center',
    fontSize: 12,
    color: '#5F6368',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '75%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
  },
  modalListaScroll: {
    maxHeight: 300,
  },
  modalTitulo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191C20',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOpcao: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalOpcaoSelecionada: {
    backgroundColor: '#EEF2FA',
  },
  modalOpcaoNome: {
    fontSize: 15,
    fontWeight: '500',
    color: '#191C20',
  },
  modalOpcaoNomeSelecionada: {
    color: '#3E5F90',
    fontWeight: '700',
  },
  modalOpcaoSubtitulo: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalVazioTexto: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
});
