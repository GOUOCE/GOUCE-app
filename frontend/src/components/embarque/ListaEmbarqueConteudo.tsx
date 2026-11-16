import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, Printer, Route } from 'lucide-react-native';
import {
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

/**
 * Componente compartilhado da Lista de Embarque (HU-018), atendendo os fluxos de
 * seleção por rota (52.1/52.2) e acesso direto/Representante (52.3 / FA-001).
 */
export function ListaEmbarqueConteudo({
  perfil,
  nomeEmissor,
  iesResponsavel,
  rotaFixaId,
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
  const [agora, setAgora] = useState<Date>(() => new Date());

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
      .listarRotasDisponiveis()
      .then((opcoes) => {
        if (!ativo) return;
        setRotasDisponiveis(opcoes);
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
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
  }, [modoFixo]);

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
        perfil,
        iesResponsavel,
      })
      .then((dados) => {
        if (!ativo) return;
        setLista(dados);
        setErroMensagem('');
        setAgora(new Date());
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
  }, [deveConsultarLista, rotaSelecionadaId, perfil, iesResponsavel]);

  const listaAtiva =
    rotaSelecionadaId !== null
      ? lista?.rotaId === rotaSelecionadaId
        ? lista
        : null
      : autodescobertaRepresentante
        ? lista
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
        if (!ativo) return;
        setLista(listaAtualizada);
        setAgora(new Date());
      },
      { perfil, iesResponsavel }
    );

    return () => {
      ativo = false;
      cancelarInscricao();
    };
  }, [rotaAtivaId, perfil, iesResponsavel]);

  const rotaSelecionadaOpcao = useMemo(
    () => rotasDisponiveis.find((item) => item.id === rotaSelecionadaId) ?? null,
    [rotasDisponiveis, rotaSelecionadaId]
  );

  const dataExibida = listaAtiva?.dataOperacao ?? formatarDataHojeCabecalho();
  const subtituloData = modoFixo ? dataExibida : `Hoje - ${dataExibida}`;
  const nomeRotaFixa = listaAtiva?.rotaNome ?? rotaSelecionadaOpcao?.nome ?? '';
  const totalAlunos = listaAtiva?.totalAlunos ?? 0;
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

  const renderAlunoItem = ({ item }: { item: AlunoEmbarqueItem }) => (
    <View style={styles.alunoItem}>
      <Text style={styles.alunoNome}>{item.nome}</Text>
      <Text style={styles.alunoTrajeto}>{item.trajetoFormatado}</Text>
    </View>
  );

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
        <Text style={styles.contadorTexto} testID="contador-alunos-alocados">
          {formatarContadorAlunos(listaAtiva.totalAlunos)}
        </Text>
        <FlatList
          data={listaAtiva.alunos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAlunoItem}
          ItemSeparatorComponent={() => <View style={styles.divisorItem} />}
          ListFooterComponent={<View style={styles.divisorItem} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listaScrollContent}
        />
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

        {listaAtiva !== null && (
          <Text style={styles.sincronizacaoTexto} testID="indicador-sincronizacao">
            {formatarTempoSincronizacao(listaAtiva.ultimaSincronizacaoISO, agora)}
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
  },
  mensagemVazia: {
    fontSize: 14,
    color: '#5F6368',
    textAlign: 'center',
    lineHeight: 20,
  },
  listaContainer: {
    flex: 1,
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
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  alunoNome: {
    fontSize: 15.5,
    fontWeight: '500',
    color: '#191C20',
  },
  alunoTrajeto: {
    fontSize: 13,
    color: '#5F6368',
    marginTop: 3,
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
