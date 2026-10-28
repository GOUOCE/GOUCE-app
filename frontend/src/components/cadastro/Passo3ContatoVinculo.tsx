import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Text, TextInput, Portal } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import { ChevronDown, Phone, School, Search, X } from 'lucide-react-native';
import { formatarCelular } from '../../utils/formatarTelefone';
import { bairroService } from '../../services/bairroService';
import { faculdadeService } from '../../services/faculdadeService';

function abreviarParaLargura(texto: string, larguraTotal: number, espacoOutrosCampos: number): string {
  if (!texto) return '';
  const larguraDisponivel = larguraTotal - espacoOutrosCampos;
  if (larguraDisponivel <= 0) return texto;
  const limiteEstimado = Math.max(12, Math.floor(larguraDisponivel / 8.5));
  if (texto.length <= limiteEstimado) return texto;

  const substituicoes: [RegExp, string][] = [
    [/Universidade Federal do Ceará/gi, 'UFC'],
    [/Universidade Estadual do Ceará/gi, 'UECE'],
    [/Instituto Federal do Ceará/gi, 'IFCE'],
    [/Universidade da Integração Internacional da Lusofonia Afro-Brasileira/gi, 'UNILAB'],
    [/Engenharia de Software/gi, 'Eng. de Software'],
    [/Engenharia de Computação/gi, 'Eng. de Computação'],
    [/Análise e Desenvolvimento de Sistemas/gi, 'ADS'],
    [/Sistemas de Informação/gi, 'Sist. de Informação'],
    [/Ciência da Computação/gi, 'Ciência da Comp.'],
    [/Licenciatura em/gi, 'Lic.'],
    [/Bacharelado em/gi, 'Bach.'],
  ];

  let r = texto;
  for (const [padrao, sigla] of substituicoes) {
    if (r.length <= limiteEstimado) break;
    r = r.replace(padrao, sigla);
  }

  if (r.length <= limiteEstimado) return r;

  const partes = r.split(' - ');
  if (partes.length === 2 && partes[0].length > 15) {
    r = `${partes[0].slice(0, 12)}... - ${partes[1]}`;
  }

  return r;
}

interface CustomSelectProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (value: string) => void;
  error?: boolean;
  leftIcon?: React.ReactNode;
  searchable?: boolean;
}

function CustomSelect({ label, value, options, onSelect, error, leftIcon, searchable = true }: CustomSelectProps) {
  const [visible, setVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [largura, setLargura] = useState(0);

  const optionsFiltradas = options.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const texto = value || `Selecione ${label.replace(' *', '').toLowerCase()}`;

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setVisible(true)}>
        <View pointerEvents="none" onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
          <TextInput
            label={label}
            mode="outlined"
            value={abreviarParaLargura(texto, largura, leftIcon ? 108 : 68)}
            accessibilityLabel={`${label} ${texto}`}
            textColor={value ? '#333' : '#888'}
            editable={false}
            error={error}
            left={leftIcon ? <TextInput.Icon icon={() => leftIcon} /> : undefined}
            right={<TextInput.Icon icon={() => <ChevronDown size={20} color="#333" />} onPress={() => setVisible(true)} />}
            style={{ backgroundColor: '#fff' }}
          />
        </View>
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={visible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => { setVisible(false); setSearchQuery(''); }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => { setVisible(false); setSearchQuery(''); }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>{label}</Text>

              {searchable && (
                <View style={styles.searchBox}>
                  <TextInput
                    placeholder="Buscar opção..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    mode="outlined"
                    dense
                    left={<TextInput.Icon icon={() => <Search size={18} color="#666" />} />}
                    right={searchQuery ? <TextInput.Icon icon={() => <X size={18} color="#666" />} onPress={() => setSearchQuery('')} /> : undefined}
                    style={styles.searchInput}
                  />
                </View>
              )}

              <FlatList
                data={optionsFiltradas}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.optionItem, item === value && styles.optionSelected]}
                    onPress={() => {
                      onSelect(item);
                      setVisible(false);
                      setSearchQuery('');
                    }}
                  >
                    <Text style={[styles.optionText, item === value && styles.optionTextSelected]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Nenhuma opção encontrada.</Text>
                }
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </View>
  );
}

const CURSOS_SUGERIDOS = [
  'Engenharia de Software',
  'Engenharia de Computação',
  'Análise e Desenvolvimento de Sistemas',
  'Sistemas de Informação',
  'Ciência da Computação',
  'Design Digital',
  'Redes de Computadores',
  'Engenharia Civil',
  'Engenharia Elétrica',
  'Engenharia Mecânica',
  'Engenharia de Produção',
  'Medicina',
  'Enfermagem',
  'Odontologia',
  'Psicologia',
  'Direito',
  'Administração',
  'Contabilidade',
  'Pedagogia',
  'Licenciatura em Matemática',
  'Licenciatura em Física',
  'Licenciatura em Química',
  'Licenciatura em Biologia',
  'Licenciatura em Letras',
  'Arquitetura e Urbanismo',
  'Farmácia',
  'Fisioterapia',
  'Nutrição',
  'Outro',
];

export function Passo3ContatoVinculo() {
  const { control, formState: { errors }, watch, setValue } = useFormContext();
  const [editandoTelefone, setEditandoTelefone] = useState(false);

  const [bairrosOpcoes, setBairrosOpcoes] = useState<string[]>(['Centro', 'Bairro Novo', 'Outro']);
  const [faculdadesOpcoes, setFaculdadesOpcoes] = useState<string[]>(['UFC - Campus Quixadá', 'IFCE - Campus Quixadá', 'Outra']);

  const cursoSelecionado = watch('curso');
  const instituicaoSelecionada = watch('instituicao');
  const bairroSelecionado = watch('bairro');

  useEffect(() => {
    let isMounted = true;

    bairroService.listarBairros().then((lista) => {
      if (isMounted && lista && lista.length > 0) {
        const ativas = lista.filter((b) => b.ativo !== false).map((b) => b.nome);
        setBairrosOpcoes(Array.from(new Set([...ativas, 'Outro'])));
      }
    }).catch(() => {});

    faculdadeService.listarFaculdades().then((lista) => {
      if (isMounted && lista && lista.length > 0) {
        const ativas = lista.filter((f) => f.ativo !== false).map((f) => `${f.sigla} - ${f.campus}`);
        setFaculdadesOpcoes(Array.from(new Set([...ativas, 'Outra'])));
      }
    }).catch(() => {});

    return () => { isMounted = false; };
  }, []);

  const gerarPeriodosIngresso = () => {
    const anoAtual = new Date().getFullYear();
    const periodos: string[] = [];
    for (let ano = anoAtual; ano >= anoAtual - 10; ano--) {
      periodos.push(`${ano}.2`);
      periodos.push(`${ano}.1`);
    }
    return periodos;
  };

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="bairro"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Bairro / Localidade *"
            value={value}
            options={bairrosOpcoes}
            onSelect={(val) => {
              onChange(val);
              if (val !== 'Outro') setValue('bairroEspecifico', '');
            }}
            error={!!errors.bairro}
          />
        )}
      />
      {errors.bairro && <Text style={styles.errorText}>{errors.bairro.message as string}</Text>}

      {bairroSelecionado === 'Outro' && (
        <Controller
          control={control}
          name="bairroEspecifico"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Especifique seu Bairro / Localidade *"
              mode="outlined"
              placeholder="Informe o nome do seu bairro"
              value={value}
              onChangeText={onChange}
              error={!!errors.bairroEspecifico}
              style={styles.input}
            />
          )}
        />
      )}
      {bairroSelecionado === 'Outro' && errors.bairroEspecifico && (
        <Text style={styles.errorText}>{errors.bairroEspecifico.message as string}</Text>
      )}

      <Controller
        control={control}
        name="whatsapp"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            label="Telefone (WhatsApp) *"
            mode="outlined"
            placeholder="(88) 9 9999-9999"
            keyboardType="number-pad"
            maxLength={editandoTelefone ? 11 : 16}
            value={editandoTelefone ? (value || '').replace(/\D/g, '') : formatarCelular(value)}
            onFocus={() => setEditandoTelefone(true)}
            onBlur={() => { setEditandoTelefone(false); onBlur(); }}
            onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 11))}
            error={!!errors.whatsapp}
            left={<TextInput.Icon icon={() => <Phone size={20} color="#666" />} />}
            style={styles.input}
          />
        )}
      />
      {errors.whatsapp && <Text style={styles.errorText}>{errors.whatsapp.message as string}</Text>}

      <Controller
        control={control}
        name="instituicao"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Instituição de Ensino *"
            value={value}
            options={faculdadesOpcoes}
            onSelect={(val) => {
              onChange(val);
              if (val !== 'Outra') setValue('instituicaoEspecifica', '');
            }}
            error={!!errors.instituicao}
            leftIcon={<School size={20} color="#666" />}
          />
        )}
      />
      {errors.instituicao && <Text style={styles.errorText}>{errors.instituicao.message as string}</Text>}

      {instituicaoSelecionada === 'Outra' && (
        <Controller
          control={control}
          name="instituicaoEspecifica"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Especifique a sua Instituição de Ensino *"
              mode="outlined"
              placeholder="Informe o nome da instituição"
              value={value}
              onChangeText={onChange}
              error={!!errors.instituicaoEspecifica}
              style={styles.input}
            />
          )}
        />
      )}
      {instituicaoSelecionada === 'Outra' && errors.instituicaoEspecifica && (
        <Text style={styles.errorText}>{errors.instituicaoEspecifica.message as string}</Text>
      )}

      <Controller
        control={control}
        name="curso"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Curso *"
            value={value}
            options={CURSOS_SUGERIDOS}
            onSelect={(val) => {
              onChange(val);
              if (val !== 'Outro') setValue('cursoEspecifico', '');
            }}
            error={!!errors.curso}
          />
        )}
      />
      {errors.curso && <Text style={styles.errorText}>{errors.curso.message as string}</Text>}

      {cursoSelecionado === 'Outro' && (
        <Controller
          control={control}
          name="cursoEspecifico"
          render={({ field: { onChange, value } }) => (
            <TextInput
              label="Especifique o seu Curso *"
              mode="outlined"
              placeholder="Informe o nome do seu curso"
              value={value}
              onChangeText={onChange}
              error={!!errors.cursoEspecifico}
              style={styles.input}
            />
          )}
        />
      )}
      {cursoSelecionado === 'Outro' && errors.cursoEspecifico && (
        <Text style={styles.errorText}>{errors.cursoEspecifico.message as string}</Text>
      )}

      <Controller
        control={control}
        name="periodoIngresso"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Semestre / Ano de Ingresso *"
            value={value}
            options={gerarPeriodosIngresso()}
            onSelect={onChange}
            error={!!errors.periodoIngresso}
            searchable={false}
          />
        )}
      />
      {errors.periodoIngresso && <Text style={styles.errorText}>{errors.periodoIngresso.message as string}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  selectContainer: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    padding: 16,
  },
  modalTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchBox: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#fff',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#e3f2fd',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 4,
  },
});
