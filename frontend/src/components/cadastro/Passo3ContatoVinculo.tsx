import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { TextInput, Text, useTheme, Portal } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import { ChevronDown, Phone, School, GraduationCap, Search, X } from 'lucide-react-native';
import { formatarCelular } from '../../utils/formatarTelefone';
import { abreviarParaLargura } from '../../utils/abreviarTexto';
import { getErrorMessage } from '../../utils/errorUtils';
import { faculdadeService, FaculdadeItem } from '../../services/faculdadeService';

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: boolean;
  leftIcon?: React.ReactNode;
  searchable?: boolean;
  // Texto exibido para cada opção, quando o valor guardado não é o próprio texto (ex.: id)
  optionLabel?: (opt: string) => string;
  emptyText?: string;
}

function CustomSelect({ label, value, options, onSelect, error, leftIcon, searchable, optionLabel, emptyText }: SelectInputProps) {
  const [visible, setVisible] = useState(false);
  const [largura, setLargura] = useState(0);
  const rotulo = (opt: string) => (optionLabel ? optionLabel(opt) : opt);
  const texto = (value && rotulo(value)) || 'Selecionar';
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) => rotulo(opt).toLowerCase().includes(searchQuery.toLowerCase().trim()))
    : options;

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

              <ScrollView
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsScrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={styles.optionItem}
                      onPress={() => { onSelect(opt); setVisible(false); setSearchQuery(''); }}
                    >
                      <Text variant="bodyLarge" style={[
                        styles.optionText,
                        value === opt && { color: theme.colors.primary, fontWeight: 'bold' }
                      ]}>
                        {rotulo(opt)}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsBox}>
                    <Text variant="bodyMedium" style={{ color: '#888' }}>{emptyText || 'Nenhuma opção encontrada'}</Text>
                  </View>
                )}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </View>
  );
}

const LISTA_DE_CURSOS = [
  'Engenharia de Software',
  'Sistemas de Informação',
  'Ciência da Computação',
  'Engenharia de Computação',
  'Design Digital',
  'Redes de Computadores',
  'Medicina',
  'Enfermagem',
  'Odontologia',
  'Direito',
  'Administração',
  'Ciências Contábeis',
  'Pedagogia',
  'Psicologia',
  'Agronomia',
  'Zootecnia',
  'Engenharia Civil',
  'Engenharia Elétrica',
  'Engenharia Mecânica',
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
  // Enquanto o campo está em foco, mostra só os dígitos (dá para apagar e editar
  // em qualquer posição); a máscara é aplicada ao sair do campo. Reformatar a cada
  // tecla impedia apagar no meio do número e fazia o cursor pular para o final.
  const [editandoTelefone, setEditandoTelefone] = useState(false);

  const cursoSelecionado = watch('curso');
  const bairroSelecionado = watch('bairro');

  // Instituições: faculdades ativas cadastradas pelo administrador; o valor guardado é o id (#262, #192)
  const [faculdades, setFaculdades] = useState<FaculdadeItem[]>([]);
  const [erroFaculdades, setErroFaculdades] = useState('');

  useEffect(() => {
    let isMounted = true;
    faculdadeService.listarFaculdades().then((lista) => {
      if (!isMounted) return;
      setFaculdades(lista.filter((f) => f.ativo !== false));
      setErroFaculdades('');
    }).catch((err) => {
      if (!isMounted) return;
      setFaculdades([]);
      setErroFaculdades(getErrorMessage(err, 'Não foi possível carregar as instituições de ensino.'));
    });
    return () => { isMounted = false; };
  }, []);

  const rotuloFaculdade = (id: string) => {
    const fac = faculdades.find((f) => String(f.id) === id);
    return fac ? `${fac.nome} - ${fac.campus}` : '';
  };

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
            options={['Centro', 'Croatá', 'Bairro Novo', 'Planalto', 'Serra', 'Outro']}
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
            value={value ? String(value) : ''}
            options={faculdades.map((f) => String(f.id))}
            optionLabel={rotuloFaculdade}
            emptyText="Nenhuma instituição de ensino disponível"
            onSelect={onChange}
            error={!!errors.instituicao}
            leftIcon={<School size={20} color="#666" />}
          />
        )}
      />
      {errors.instituicao && <Text style={styles.errorText}>{errors.instituicao.message as string}</Text>}
      {!!erroFaculdades && <Text style={styles.errorText}>{erroFaculdades}</Text>}

      <Controller
        control={control}
        name="curso"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Curso *"
            value={value}
            options={LISTA_DE_CURSOS}
            onSelect={(val) => {
              onChange(val);
              if (val !== 'Outro') setValue('cursoEspecifico', '');
            }}
            error={!!errors.curso}
            searchable={true}
            leftIcon={<GraduationCap size={20} color="#666" />}
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

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="campus"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Campus *"
                value={value}
                options={['Quixadá', 'Redenção', 'Fortaleza', 'Itapipoca', 'Russas']}
                onSelect={onChange}
                error={!!errors.campus}
              />
            )}
          />
          {errors.campus && <Text style={styles.errorText}>{errors.campus.message as string}</Text>}
        </View>

        <View style={styles.half}>
          <Controller
            control={control}
            name="periodoIngresso"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Período de Ingresso *"
                value={value}
                options={gerarPeriodosIngresso()}
                onSelect={onChange}
                error={!!errors.periodoIngresso}
              />
            )}
          />
          {errors.periodoIngresso && <Text style={styles.errorText}>{errors.periodoIngresso.message as string}</Text>}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="turno"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Turno do Curso *"
                value={value}
                options={['Matutino', 'Vespertino', 'Noturno', 'Integral']}
                onSelect={onChange}
                error={!!errors.turno}
              />
            )}
          />
          {errors.turno && <Text style={styles.errorText}>{errors.turno.message as string}</Text>}
        </View>

        <View style={styles.half}>
          <Controller
            control={control}
            name="semestreAtual"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Semestre Atual *"
                value={value}
                options={['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º', '11º', '12º', '13º', '14º', '15º', '16º']}
                onSelect={onChange}
                error={!!errors.semestreAtual}
              />
            )}
          />
          {errors.semestreAtual && <Text style={styles.errorText}>{errors.semestreAtual.message as string}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  selectContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    paddingTop: 16,
    paddingBottom: 8,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalTitle: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBox: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#FFF',
  },
  optionsScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  optionsScrollContent: {
    paddingBottom: 16,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  optionText: {
    color: '#333',
  },
  noResultsBox: {
    padding: 24,
    alignItems: 'center',
  },
});
