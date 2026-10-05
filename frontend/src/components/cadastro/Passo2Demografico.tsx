import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { TextInput, Text, useTheme, SegmentedButtons, Portal } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import { ChevronDown } from 'lucide-react-native';
import { abreviarParaLargura } from '../../utils/abreviarTexto';

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: boolean;
}

function CustomSelect({ label, value, options, onSelect, error }: SelectInputProps) {
  const [visible, setVisible] = useState(false);
  const [largura, setLargura] = useState(0);
  const texto = value || 'Selecionar';
  const theme = useTheme();

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setVisible(true)}>
        <View pointerEvents="none" onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
          <TextInput
            label={label}
            mode="outlined"
            value={abreviarParaLargura(texto, largura, 68)}
            accessibilityLabel={`${label} ${texto}`}
            textColor={value ? '#333' : '#888'}
            editable={false}
            error={error}
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
          onRequestClose={() => setVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setVisible(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text variant="titleMedium" style={styles.modalTitle}>{label}</Text>
              <ScrollView
                style={styles.optionsScroll}
                contentContainerStyle={styles.optionsScrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
              >
                {options.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={styles.optionItem}
                    onPress={() => { onSelect(opt); setVisible(false); }}
                  >
                    <Text variant="bodyLarge" style={[
                      styles.optionText,
                      value === opt && { color: theme.colors.primary, fontWeight: 'bold' }
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </View>
  );
}

export function Passo2Demografico() {
  const { control, formState: { errors } } = useFormContext();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="raca"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Raça *"
            value={value}
            options={['Branco', 'Pardo', 'Preto', 'Amarelo', 'Indígena', 'Prefiro não dizer']}
            onSelect={onChange}
            error={!!errors.raca}
          />
        )}
      />
      {errors.raca && <Text style={styles.errorText}>{errors.raca.message as string}</Text>}

      <Controller
        control={control}
        name="identificacaoSexual"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Identificação Sexual *"
            value={value}
            options={['Heterossexual', 'Homossexual (Gay/Lésbica)', 'Bissexual', 'Assexual', 'Outra', 'Prefiro não dizer']}
            onSelect={onChange}
            error={!!errors.identificacaoSexual}
          />
        )}
      />
      {errors.identificacaoSexual && <Text style={styles.errorText}>{errors.identificacaoSexual.message as string}</Text>}

      <Controller
        control={control}
        name="genero"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Gênero *"
            value={value}
            options={['Mulher', 'Homem', 'Não-binário', 'Outro', 'Prefiro não dizer']}
            onSelect={onChange}
            error={!!errors.genero}
          />
        )}
      />
      {errors.genero && <Text style={styles.errorText}>{errors.genero.message as string}</Text>}

      <Controller
        control={control}
        name="transgenero"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Você é uma pessoa transgênero? *"
            value={value}
            options={['Sim', 'Não', 'Prefiro não dizer']}
            onSelect={onChange}
            error={!!errors.transgenero}
          />
        )}
      />
      {errors.transgenero && <Text style={styles.errorText}>{errors.transgenero.message as string}</Text>}

      <View style={styles.toggleContainer}>
        <Text variant="bodyLarge" style={styles.toggleLabel}>Tem filhos? *</Text>
        <Controller
          control={control}
          name="temFilhos"
          render={({ field: { onChange, value } }) => (
            <SegmentedButtons
              value={value ? 'sim' : 'nao'}
              onValueChange={(val) => onChange(val === 'sim')}
              buttons={[
                { value: 'sim', label: 'Sim' },
                { value: 'nao', label: 'Não' },
              ]}
              style={styles.segmented}
            />
          )}
        />
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
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 4,
  },
  toggleContainer: {
    marginTop: 8,
  },
  toggleLabel: {
    marginBottom: 8,
    color: '#666',
  },
  segmented: {
    width: '100%',
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
});
