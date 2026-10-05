import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { TextInput, Text, useTheme, Portal } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import { ChevronDown, Phone, School, GraduationCap, Search, X } from 'lucide-react-native';
import { abreviarParaLargura } from '../../utils/abreviarTexto';

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: boolean;
  leftIcon?: React.ReactNode;
  searchable?: boolean;
}

function CustomSelect({ label, value, options, onSelect, error, leftIcon, searchable }: SelectInputProps) {
  const [visible, setVisible] = useState(false);
  const [largura, setLargura] = useState(0);
  const texto = value || 'Selecionar';
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  const filteredOptions = searchable && searchQuery.trim()
    ? options.filter((opt) => opt.toLowerCase().includes(searchQuery.toLowerCase().trim()))
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
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noResultsBox}>
                    <Text variant="bodyMedium" style={{ color: '#888' }}>Nenhuma opção encontrada</Text>
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

  const cursoSelecionado = watch('curso');
  const instituicaoSelecionada = watch('instituicao');
  const bairroSelecionado = watch('bairro');

  const gerarPeriodosIngresso = () => {
    const anoAtual = new Date().getFullYear();
    const periodos: string[] = [];
    for (let ano = anoAtual; ano >= anoAtual - 10; ano--) {
      periodos.push(`${ano}.2`);
      periodos.push(`${ano}.1`);
    }
    return periodos;
  };

  const formatarTelefone = (texto: string) => {
    let limpo = texto.replace(/\D/g, '');
    if (limpo.length > 11) limpo = limpo.slice(0, 11);
    if (limpo.length <= 2) return limpo ? `(${limpo}` : '';
    if (limpo.length <= 7) return `(${limpo.slice(0, 2)}) ${limpo.slice(2)}`;
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 3)} ${limpo.slice(3, 7)}-${limpo.slice(7)}`;
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
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Telefone (WhatsApp) *"
            mode="outlined"
            placeholder="(88) 9 9999-9999"
            keyboardType="number-pad"
            maxLength={16}
            value={value}
            onChangeText={(text) => onChange(formatarTelefone(text))}
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
            options={['UFC - Universidade Federal do Ceará', 'IFCE', 'UNILAB', 'Estácio', 'Outra']}
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
