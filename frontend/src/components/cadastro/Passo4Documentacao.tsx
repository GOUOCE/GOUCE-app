import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, CheckCircle2, Pencil } from 'lucide-react-native';

interface FileUploadProps {
  label: string;
  value: any;
  onSelect: (val: any) => void;
  error?: boolean;
  isRequired?: boolean;
  hintText?: string;
  testID?: string;
}

function FileUpload({ label, value, onSelect, error, isRequired = true, hintText, testID }: FileUploadProps) {
  const theme = useTheme();

  const selecionarDocumento = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
    });

    if (!result.canceled) {
      onSelect(result.assets[0]);
    }
  };

  const isDashed = !value;

  return (
    <View style={styles.uploadBox}>
      <Text variant="bodyLarge" style={styles.uploadLabel}>
        {label} {isRequired ? '*' : ''}
      </Text>

      <TouchableOpacity
        testID={testID}
        onPress={selecionarDocumento}
        style={[
          styles.dropzone,
          {
            borderColor: error ? 'red' : '#ccc',
            borderStyle: isDashed ? 'dashed' : 'solid',
            backgroundColor: '#FAFAFA',
          }
        ]}
      >
        {value ? (
          <View style={styles.fileCardRow}>
            <CheckCircle2 size={20} color={theme.colors.primary} />
            <Text variant="bodyMedium" numberOfLines={1} style={styles.fileName}>
              {value.name || 'Documento_Anexado.pdf'}
            </Text>
            <Pencil size={18} color="#666" />
          </View>
        ) : (
          <View style={styles.emptyCardRow}>
            <Text variant="bodyMedium" style={styles.addText}>Adicionar</Text>
            <Upload size={20} color="#666" />
          </View>
        )}
      </TouchableOpacity>

      {hintText ? (
        <Text variant="bodySmall" style={styles.hintText}>
          {hintText}
        </Text>
      ) : null}
    </View>
  );
}

export function Passo4Documentacao({ isRenovacao = false }: { isRenovacao?: boolean }) {
  const { control, formState: { errors } } = useFormContext();

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="comprovanteMatricula"
        render={({ field: { onChange, value } }) => (
          <FileUpload
            testID="cadastro-btn-comprovante-matricula"
            label="Comprovante de Matrícula"
            value={value}
            onSelect={onChange}
            error={!!errors.comprovanteMatricula}
            isRequired={true}
          />
        )}
      />
      {errors.comprovanteMatricula && <Text testID="cadastro-erro-comprovante-matricula" style={styles.errorText}>{errors.comprovanteMatricula.message as string}</Text>}

      <Controller
        control={control}
        name="comprovanteResidencia"
        render={({ field: { onChange, value } }) => (
          <FileUpload
            testID="cadastro-btn-comprovante-residencia"
            label="Comprovante de Residência"
            value={value}
            onSelect={onChange}
            error={!!errors.comprovanteResidencia}
            isRequired={!isRenovacao}
            hintText={isRenovacao ? "Envie um novo comprovante apenas se o seu endereço mudou" : undefined}
          />
        )}
      />
      {errors.comprovanteResidencia && <Text testID="cadastro-erro-comprovante-residencia" style={styles.errorText}>{errors.comprovanteResidencia.message as string}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  uploadBox: {
    gap: 6,
  },
  uploadLabel: {
    color: '#666',
  },
  dropzone: {
    height: 56,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addText: {
    color: '#333',
    fontWeight: '500',
  },
  fileCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileName: {
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 4,
  },
});
