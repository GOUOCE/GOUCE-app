import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppPopup } from '@/components/ui/AppPopup';
import { bairroService } from '@/services/bairroService';
import { faculdadeService } from '@/services/faculdadeService';
import type { OpcaoSelect } from '@/services/relatorioService';
import { lightColors } from '@/theme/colors';

const colors = {
  primary: lightColors.primary,
  primaryContainer: lightColors.primaryContainer,
  surface: lightColors.surface,
  background: lightColors.background,
  text: lightColors.onSurface,
  textMuted: lightColors.onSurfaceVariant,
  border: lightColors.outlineVariant,
  danger: lightColors.error,
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
const radii = { md: 12 };

const TIPOS_RELATORIO: OpcaoSelect[] = [
  { label: 'Relatório de Agendamentos', value: 'agendamentos' },
  { label: 'Relatório de Motoristas', value: 'motoristas' },
];

type CampoErro = 'dataInicial' | 'dataFinal' | 'geral';

export default function RelatoriosIndexScreen() {
  const router = useRouter();
  const [tipo, setTipo] = useState('agendamentos');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [faculdadeId, setFaculdadeId] = useState('todas');
  const [bairroId, setBairroId] = useState('todos');
  const [faculdades, setFaculdades] = useState<OpcaoSelect[]>([]);
  const [bairros, setBairros] = useState<OpcaoSelect[]>([]);
  const [carregandoOpcoes, setCarregandoOpcoes] = useState(true);
  const [erroOpcoes, setErroOpcoes] = useState<string | null>(null);
  const [erros, setErros] = useState<Partial<Record<CampoErro, string>>>({});
  const [popup, setPopup] = useState<{ titulo: string; mensagem: string } | null>(null);
  const [tentativa, setTentativa] = useState(0);

  useFocusEffect(
    useCallback(() => {
      void tentativa;
      let ativo = true;

      async function carregarOpcoes() {
        setCarregandoOpcoes(true);
        setErroOpcoes(null);
        try {
          const [faculdadesApi, bairrosApi] = await Promise.all([
            faculdadeService.listarFaculdades(),
            bairroService.listarBairros(),
          ]);
          if (!ativo) return;

          setFaculdades(
            faculdadesApi
              .filter((faculdade) => faculdade.ativo)
              .map((faculdade) => ({
                label: `${faculdade.sigla ? `${faculdade.sigla} - ` : ''}${faculdade.nome} (${faculdade.campus})`,
                value: String(faculdade.id),
              })),
          );
          setBairros(
            bairrosApi
              .filter((bairro) => bairro.ativo)
              .map((bairro) => ({ label: bairro.nome, value: String(bairro.id) })),
          );
        } catch {
          if (!ativo) return;
          setErroOpcoes(
            'Não foi possível carregar faculdades e bairros. Tente novamente.',
          );
        } finally {
          if (ativo) setCarregandoOpcoes(false);
        }
      }

      carregarOpcoes();
      return () => {
        ativo = false;
      };
    }, [tentativa]),
  );

  function validar(): boolean {
    const proximos: Partial<Record<CampoErro, string>> = {};
    const formatoData = /^\d{4}-\d{2}-\d{2}$/;
    const inicioValido = formatoData.test(dataInicial.trim());
    const fimValido = formatoData.test(dataFinal.trim());

    if (!dataInicial.trim()) {
      proximos.dataInicial = 'Informe a data inicial.';
    } else if (!inicioValido) {
      proximos.dataInicial = 'Use o formato AAAA-MM-DD.';
    }

    if (!dataFinal.trim()) {
      proximos.dataFinal = 'Informe a data final.';
    } else if (!fimValido) {
      proximos.dataFinal = 'Use o formato AAAA-MM-DD.';
    }

    if (inicioValido && fimValido && dataFinal.trim() < dataInicial.trim()) {
      proximos.dataInicial = 'Confira o período informado.';
      proximos.dataFinal = 'A data final não pode ser anterior à data inicial.';
    }

    setErros(proximos);
    return Object.keys(proximos).length === 0;
  }

  function gerarRelatorio() {
    if (!validar()) {
      setPopup({
        titulo: 'Período inválido',
        mensagem:
          'Confira as datas informadas. A data final não pode ser anterior à data inicial.',
      });
      return;
    }

    router.push({
      pathname: '/(administrador)/relatorios/resultado',
      params: {
        tipo,
        dataInicial: dataInicial.trim(),
        dataFinal: dataFinal.trim(),
        faculdadeId: faculdadeId === 'todas' ? undefined : faculdadeId,
        bairroId: bairroId === 'todos' ? undefined : bairroId,
      },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="voltar-mais"
          accessibilityLabel="Voltar"
          onPress={() => router.replace('/(administrador)/(tabs)/mais')}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTexto}>
          <Text style={styles.headerTitulo}>Relatórios operacionais</Text>
          <Text style={styles.headerSubtitulo}>Geração de relatórios quantitativos</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Filtros do relatório</Text>
        <Text style={styles.sectionDescription}>
          Selecione o período e, se desejar, refine por faculdade ou bairro.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Tipo de relatório</Text>
          <View style={styles.segmented}>
            {TIPOS_RELATORIO.map((opcao) => (
              <Pressable
                key={opcao.value}
                testID={`tipo-relatorio-${opcao.value}`}
                accessibilityRole="button"
                accessibilityLabel={opcao.label}
                onPress={() => setTipo(opcao.value)}
                style={[
                  styles.segmentedButton,
                  tipo === opcao.value && styles.segmentedButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentedText,
                    tipo === opcao.value && styles.segmentedTextActive,
                  ]}
                >
                  {opcao.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.field, styles.fieldFlex]}>
            <Text style={styles.label}>Data inicial *</Text>
            <TextInput
              testID="data-inicial"
              accessibilityLabel="Data inicial"
              style={[styles.input, erros.dataInicial && styles.inputErro]}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={dataInicial}
              onChangeText={(valor) => {
                setDataInicial(valor);
                setErros((estado) => ({ ...estado, dataInicial: undefined }));
              }}
            />
            {erros.dataInicial ? (
              <Text style={styles.erroTexto}>{erros.dataInicial}</Text>
            ) : null}
          </View>
          <View style={[styles.field, styles.fieldFlex]}>
            <Text style={styles.label}>Data final *</Text>
            <TextInput
              testID="data-final"
              accessibilityLabel="Data final"
              style={[styles.input, erros.dataFinal && styles.inputErro]}
              placeholder="AAAA-MM-DD"
              placeholderTextColor={colors.textMuted}
              value={dataFinal}
              onChangeText={(valor) => {
                setDataFinal(valor);
                setErros((estado) => ({ ...estado, dataFinal: undefined }));
              }}
            />
            {erros.dataFinal ? (
              <Text style={styles.erroTexto}>{erros.dataFinal}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Faculdade</Text>
          <View style={styles.pickerFallback}>
            <Pressable
              testID="faculdade-todas"
              onPress={() => setFaculdadeId('todas')}
              style={[
                styles.opcao,
                faculdadeId === 'todas' && styles.opcaoSelecionada,
              ]}
            >
              <Text style={styles.opcaoTexto}>Todas as faculdades</Text>
              {faculdadeId === 'todas' ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
            {carregandoOpcoes ? (
              <View style={styles.carregando}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.carregandoTexto}>Carregando faculdades...</Text>
              </View>
            ) : null}
            {faculdades.map((opcao) => (
              <Pressable
                key={opcao.value}
                testID={`faculdade-${opcao.value}`}
                onPress={() => setFaculdadeId(opcao.value)}
                style={[
                  styles.opcao,
                  faculdadeId === opcao.value && styles.opcaoSelecionada,
                ]}
              >
                <Text style={styles.opcaoTexto}>{opcao.label}</Text>
                {faculdadeId === opcao.value ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Bairro (localidade)</Text>
          <View style={styles.pickerFallback}>
            <Pressable
              testID="bairro-todos"
              onPress={() => setBairroId('todos')}
              style={[styles.opcao, bairroId === 'todos' && styles.opcaoSelecionada]}
            >
              <Text style={styles.opcaoTexto}>Todos os bairros</Text>
              {bairroId === 'todos' ? (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              ) : null}
            </Pressable>
            {carregandoOpcoes ? (
              <View style={styles.carregando}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.carregandoTexto}>Carregando bairros...</Text>
              </View>
            ) : null}
            {bairros.map((opcao) => (
              <Pressable
                key={opcao.value}
                testID={`bairro-${opcao.value}`}
                onPress={() => setBairroId(opcao.value)}
                style={[styles.opcao, bairroId === opcao.value && styles.opcaoSelecionada]}
              >
                <Text style={styles.opcaoTexto}>{opcao.label}</Text>
                {bairroId === opcao.value ? (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                ) : null}
              </Pressable>
            ))}
          </View>
          {erroOpcoes ? (
            <View style={styles.erroOpcoes}>
              <Text style={styles.erroTexto}>{erroOpcoes}</Text>
              <Pressable testID="recarregar-opcoes" onPress={() => setTentativa((valor) => valor + 1)}>
                <Text style={styles.linkTexto}>Tentar novamente</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.observacao}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.observacaoTexto}>
            O relatório cruza agendamentos ativos com os registros de presença e mantém
            o vínculo histórico de motoristas e faculdades inativas.
          </Text>
        </View>

        <Pressable
          testID="gerar-relatorio"
          accessibilityRole="button"
          accessibilityLabel="Gerar relatório"
          onPress={gerarRelatorio}
          disabled={carregandoOpcoes}
          style={[styles.botaoPrimario, carregandoOpcoes && styles.botaoDesabilitado]}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.surface} />
          <Text style={styles.botaoPrimarioTexto}>Gerar relatório</Text>
        </Pressable>
      </ScrollView>

      {popup ? (
        <AppPopup
          visible
          type="warning"
          title={popup.titulo}
          message={popup.mensagem}
          onDismiss={() => setPopup(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerTexto: { flex: 1 },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSubtitulo: { fontSize: 13, color: colors.textMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  sectionDescription: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  field: { gap: spacing.xs },
  fieldRow: { flexDirection: 'row', gap: spacing.sm },
  fieldFlex: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 14,
  },
  inputErro: { borderColor: colors.danger },
  erroTexto: { color: colors.danger, fontSize: 12, marginTop: 4 },
  segmented: { flexDirection: 'row', gap: spacing.xs },
  segmentedButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  segmentedButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  segmentedText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  segmentedTextActive: { color: colors.surface },
  pickerFallback: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    maxHeight: 220,
  },
  opcao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  opcaoSelecionada: { backgroundColor: colors.primaryContainer },
  opcaoTexto: { fontSize: 14, color: colors.text, flex: 1 },
  carregando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  carregandoTexto: { fontSize: 13, color: colors.textMuted },
  erroOpcoes: { gap: 4, marginTop: spacing.xs },
  linkTexto: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  observacao: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  observacaoTexto: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  botaoPrimario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  botaoPrimarioTexto: { color: colors.surface, fontWeight: '700', fontSize: 15 },
  botaoDesabilitado: { opacity: 0.6 },
});
