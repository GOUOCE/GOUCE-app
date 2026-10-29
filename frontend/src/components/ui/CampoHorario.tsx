import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-paper';
import { TimePickerModal, registerTranslation, pt } from 'react-native-paper-dates';
import { Clock } from 'lucide-react-native';

registerTranslation('pt', pt);

const doisDigitos = (n: number) => String(n).padStart(2, '0');

interface CampoHorarioProps {
  label: string;
  value: string;
  onChange: (horario: string) => void;
  error?: boolean;
}

// Campo de horário com relógio de 24 h: o administrador escolhe hora e minuto, sem digitar (#340)
export function CampoHorario({ label, value, onChange, error }: CampoHorarioProps) {
  const [aberto, setAberto] = useState(false);
  const [horas, minutos] = value ? value.split(':').map(Number) : [undefined, undefined];

  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={() => setAberto(true)} accessibilityLabel={label}>
        <View pointerEvents="none">
          <TextInput
            label={label}
            mode="outlined"
            placeholder="Selecionar"
            value={value}
            editable={false}
            textColor="#191C20"
            error={error}
            left={<TextInput.Icon icon={() => <Clock size={20} color="#666" />} />}
            style={styles.input}
          />
        </View>
      </TouchableOpacity>
      <TimePickerModal
        visible={aberto}
        locale="pt"
        use24HourClock
        label={label.replace(/\s*\*$/, '')}
        cancelLabel="Cancelar"
        confirmLabel="Confirmar"
        hours={horas}
        minutes={minutos}
        onDismiss={() => setAberto(false)}
        onConfirm={({ hours, minutes }) => {
          setAberto(false);
          onChange(`${doisDigitos(hours)}:${doisDigitos(minutes)}`);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
  },
});
