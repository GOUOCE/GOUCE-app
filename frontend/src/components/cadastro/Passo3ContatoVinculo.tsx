import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { TextInput, Text, useTheme, Portal } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import { ChevronDown, Phone, School, GraduationCap } from 'lucide-react-native';

interface SelectInputProps {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
  error?: boolean;
  leftIcon?: React.ReactNode;
}

function CustomSelect({ label, value, options, onSelect, error, leftIcon }: SelectInputProps) {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  return (
    <View style={styles.selectContainer}>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <TextInput
          label={label}
          value={value || 'Selecionar'}
          mode="outlined"
          editable={false}
          error={error}
          left={leftIcon ? <TextInput.Icon icon={() => leftIcon} /> : undefined}
          right={<TextInput.Icon icon={() => <ChevronDown size={20} />} />}
          pointerEvents="none"
          style={{ backgroundColor: '#fff' }}
        />
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
            <View style={styles.modalContent}>
              <Text variant="titleMedium" style={styles.modalTitle}>{label}</Text>
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
            </View>
          </TouchableOpacity>
        </Modal>
      </Portal>
    </View>
  );
}

export function Passo3ContatoVinculo() {
  const { control, formState: { errors } } = useFormContext();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="bairro"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Bairro / Localidade *"
            value={value}
            options={['Centro', 'Bairro Novo', 'Planalto', 'Serra', 'Outro']}
            onSelect={onChange}
            error={!!errors.bairro}
          />
        )}
      />
      {errors.bairro && <Text style={styles.errorText}>{errors.bairro.message as string}</Text>}

      <Controller
        control={control}
        name="whatsapp"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Telefone (WhatsApp) *"
            mode="outlined"
            placeholder="(88) 9 9999-9999"
            value={value}
            onChangeText={onChange}
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
            options={['UFC', 'UNILAB', 'IFCE', 'Estácio', 'Outra']}
            onSelect={onChange}
            error={!!errors.instituicao}
            leftIcon={<School size={20} color="#666" />}
          />
        )}
      />
      {errors.instituicao && <Text style={styles.errorText}>{errors.instituicao.message as string}</Text>}

      <Controller
        control={control}
        name="curso"
        render={({ field: { onChange, value } }) => (
          <CustomSelect
            label="Curso *"
            value={value}
            options={['Engenharia de Software', 'Sistemas de Informação', 'Ciência da Computação', 'Medicina', 'Outro']}
            onSelect={onChange}
            error={!!errors.curso}
            leftIcon={<GraduationCap size={20} color="#666" />}
          />
        )}
      />
      {errors.curso && <Text style={styles.errorText}>{errors.curso.message as string}</Text>}

      <View style={styles.row}>
        <View style={styles.half}>
          <Controller
            control={control}
            name="campus"
            render={({ field: { onChange, value } }) => (
              <CustomSelect
                label="Campus *"
                value={value}
                options={['Quixadá', 'Redenção', 'Fortaleza', 'Itapipoca']}
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
                options={['2024.1', '2023.2', '2023.1', '2022.2', 'Anterior']}
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
                options={['1º', '2º', '3º', '4º', '5º', '6º', '7º', '8º', '9º', '10º']}
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
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    paddingVertical: 16,
    maxHeight: '80%',
  },
  modalTitle: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  optionItem: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  optionText: {
    color: '#333',
  },
});
