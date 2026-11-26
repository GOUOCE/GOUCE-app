import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarX2 } from 'lucide-react-native';

import { useAuth } from '@contexts/AuthContext';
import {
  extrairMensagemErroListaEmbarque,
  listaEmbarqueService,
  type ListaEmbarqueRota,
} from '@/services/listaEmbarqueService';

export default function RepresentativeRotaScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [carregando, setCarregando] = useState<boolean>(true);
  const [lista, setLista] = useState<ListaEmbarqueRota | null>(null);
  const [semViagens, setSemViagens] = useState<boolean>(false);
  const [erro, setErro] = useState<string>('');

  useEffect(() => {
    let ativo = true;

    listaEmbarqueService
      .obterListaEmbarque({ perfil: 'MOTORISTA' })
      .then((dados) => {
        if (!ativo) return;
        if (dados.totalAlunos === 0) {
          setLista(null);
          setSemViagens(true);
        } else {
          setLista(dados);
          setSemViagens(false);
        }
        setErro('');
      })
      .catch(async (err: any) => {
        if (!ativo) return;
        const detail = err?.response?.data?.detail;
        if (err?.response?.status === 422 && detail?.code === 'MULTIPLAS_ROTAS') {
          try {
            const padrao = await listaEmbarqueService.obterRotaPadraoRepresentante();
            if (padrao && ativo) {
              const dadosPadrao = await listaEmbarqueService.obterListaEmbarque({
                rotaId: padrao.rotaId,
                perfil: 'MOTORISTA',
              });
              if (!ativo) return;
              setLista(dadosPadrao);
              setSemViagens(dadosPadrao.totalAlunos === 0);
              setErro('');
              return;
            }
          } catch {
            // Segue para estado vazio se não houver rota carregável.
          }
          if (ativo) {
            setLista(null);
            setSemViagens(true);
          }
          return;
        }

        if (err?.response?.status === 404 && detail?.code === 'SEM_ROTA_NO_DIA') {
          setLista(null);
          setSemViagens(true);
          return;
        }

        setLista(null);
        setErro(
          extrairMensagemErroListaEmbarque(err, 'Não foi possível carregar a rota do dia.')
        );
      })
      .finally(() => {
        if (ativo) {
          setCarregando(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  const veiculoPrincipal = lista?.veiculosEscalados?.[0];
  const faculdadeUsuario =
    typeof user?.faculdade === 'string' && !/^\d+$/.test(user.faculdade.trim())
      ? user.faculdade.trim()
      : '';
  const nomeUniversidade =
    faculdadeUsuario ||
    lista?.alunos?.[0]?.iesIda ||
    lista?.alunos?.[0]?.iesVolta ||
    'Instituição vinculada';
  const horarioSaidaExibido = lista?.horarioSaida || '06:40';
  const horarioRetornoExibido = lista?.horarioRetorno || '17:30';
  const textoAlunosChip =
    lista && lista.totalAlunos === 1
      ? '1 aluno alocado'
      : `${lista?.totalAlunos ?? 0} alunos alocados`;

  return (
    <View style={styles.container}>
      <Text style={styles.saudacao}>Olá, {user?.name || 'Representante'}!</Text>

      {carregando ? (
        <View style={styles.estadoCentral}>
          <ActivityIndicator size="large" color="#3E5F90" testID="loading-rota-representante" />
        </View>
      ) : semViagens ? (
        <View style={styles.estadoCentral}>
          <CalendarX2 size={72} color="#44474E" />
          <Text style={styles.semViagensTexto} testID="mensagem-sem-viagens-representante">
            Não há registros de viagens ou agendamentos para a data selecionada.
          </Text>
          <Text style={styles.semViagensSubtitulo}>(fim de semana / feriado / sem escala)</Text>
        </View>
      ) : erro ? (
        <View style={styles.estadoCentral}>
          <Text style={styles.erroTexto} testID="mensagem-erro-rota-representante">
            {erro}
          </Text>
        </View>
      ) : lista ? (
        <View style={styles.conteudo}>
          <Text style={styles.secaoTitulo}>Sua rota de hoje</Text>

          <View style={styles.cardRota}>
            <Text style={styles.cardPlaca} testID="titulo-onibus-rota-hoje">
              {veiculoPrincipal?.onibusPlaca
                ? `Ônibus • Placa ${veiculoPrincipal.onibusPlaca}`
                : 'Ônibus escalado'}
            </Text>
            <Text style={styles.cardLinha} testID="subtitulo-linha-rota-hoje">
              {lista.rotaNome}
            </Text>

            {veiculoPrincipal?.motoristaNome ? (
              <Text style={styles.cardDetalhe}>Motorista: {veiculoPrincipal.motoristaNome}</Text>
            ) : null}

            <View style={styles.horariosRow}>
              <View style={styles.horarioCol}>
                <Text style={styles.iesLabel}>Horário de Saída</Text>
                <Text style={styles.iesValor} testID="horario-saida-rota-hoje">
                  {horarioSaidaExibido}
                </Text>
              </View>
              <View style={styles.horarioCol}>
                <Text style={styles.iesLabel}>Horário de Retorno</Text>
                <Text style={styles.iesValor} testID="horario-retorno-rota-hoje">
                  {horarioRetornoExibido}
                </Text>
              </View>
            </View>

            <View style={styles.iesBlock}>
              <Text style={styles.iesLabel}>Universidade sob Responsabilidade</Text>
              <Text style={styles.iesValor} testID="ies-responsavel-rota-hoje">
                {nomeUniversidade}
              </Text>
            </View>

            <View style={styles.chipAlunos}>
              <Text style={styles.chipAlunosTexto} testID="chip-alunos-alocados-rota">
                {textoAlunosChip}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.botaoChamada}
            activeOpacity={0.8}
            onPress={() => router.push('/(representante)/home' as any)}
            accessibilityRole="button"
            accessibilityLabel="Ver lista de embarque e realizar frequência"
            testID="botao-ver-lista-embarque-frequencia"
          >
            <Text style={styles.botaoChamadaTexto}>
              Ver lista de embarque e realizar frequência
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FF',
    paddingTop: 64,
    paddingHorizontal: 24,
  },
  saudacao: {
    fontSize: 22,
    fontWeight: '600',
    color: '#191C20',
    textAlign: 'left',
    marginBottom: 24,
  },
  estadoCentral: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  semViagensTexto: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#191C20',
    textAlign: 'center',
    lineHeight: 20,
  },
  semViagensSubtitulo: {
    fontSize: 12,
    color: '#5F6368',
    textAlign: 'center',
  },
  erroTexto: {
    fontSize: 14,
    color: '#B3261E',
    textAlign: 'center',
  },
  conteudo: {
    gap: 12,
  },
  secaoTitulo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#191C20',
  },
  cardRota: {
    backgroundColor: '#F2F3FA',
    borderWidth: 1,
    borderColor: '#C4C6CF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardPlaca: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#191C20',
  },
  cardLinha: {
    fontSize: 12,
    color: '#43474E',
  },
  cardDetalhe: {
    fontSize: 12,
    color: '#43474E',
  },
  horariosRow: {
    flexDirection: 'row',
    gap: 24,
  },
  horarioCol: {
    gap: 2,
  },
  iesBlock: {
    gap: 2,
  },
  iesLabel: {
    fontSize: 11,
    color: '#5F6368',
  },
  iesValor: {
    fontSize: 13,
    fontWeight: '500',
    color: '#191C20',
  },
  chipAlunos: {
    alignSelf: 'flex-start',
    backgroundColor: '#D5E3FF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipAlunosTexto: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#244777',
  },
  botaoChamada: {
    backgroundColor: '#3E5F90',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  botaoChamadaTexto: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
