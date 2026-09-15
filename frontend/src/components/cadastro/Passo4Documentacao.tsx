import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, CheckCircle2 } from 'lucide-react-native';

interface FileUploadProps {
  label: string;
  value: any;
  onSelect: (val: any) => void;
  error?: boolean;
}

function FileUpload({ label, value, onSelect, error }: FileUploadProps) {
  const theme = useTheme();

  const selecionarDocumento = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });

    if (!result.canceled) {
      onSelect(result.assets[0]);
    }
  };

  return (
    <View style={styles.uploadBox}>
      <Text variant="bodyLarge" style={styles.uploadLabel}>{label} *</Text>
      <TouchableOpacity
        onPress={selecionarDocumento}
        style={[
          styles.dropzone,
          { borderColor: error ? 'red' : '#ccc' }
        ]}
      >
        {value ? (
          <View style={styles.fileInfo}>
            <CheckCircle2 size={32} color={theme.colors.primary} />
            <Text variant="bodyMedium" numberOfLines={1} style={styles.fileName}>
              {value.name}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.primary }}>Alterar arquivo</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text variant="bodyLarge" style={styles.addText}>Adicionar</Text>
            <Upload size={24} color="#666" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

export function Passo4Documentacao() {
  const { control, formState: { errors } } = useFormContext();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="comprovanteMatricula"
        render={({ field: { onChange, value } }) => (
          <FileUpload
            label="Comprovante de Matrícula"
            value={value}
            onSelect={onChange}
            error={!!errors.comprovanteMatricula}
          />
        )}
      />
      {errors.comprovanteMatricula && <Text style={styles.errorText}>{errors.comprovanteMatricula.message as string}</Text>}

      <Controller
        control={control}
        name="comprovanteResidencia"
        render={({ field: { onChange, value } }) => (
          <FileUpload
            label="Comprovante de Residência"
            value={value}
            onSelect={onChange}
            error={!!errors.comprovanteResidencia}
          />
        )}
      />
      {errors.comprovanteResidencia && <Text style={styles.errorText}>{errors.comprovanteResidencia.message as string}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  uploadBox: {
    gap: 8,
  },
  uploadLabel: {
    color: '#666',
  },
  dropzone: {
    height: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    gap: 8,
  },
  addText: {
    color: '#333',
  },
  fileInfo: {
    alignItems: 'center',
    padding: 16,
    gap: 4,
  },
  fileName: {
    color: '#333',
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: -16,
    marginLeft: 4,
  },
});
