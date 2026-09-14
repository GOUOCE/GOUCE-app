import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Checkbox, useTheme } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';

export function TermosDeUso() {
  const theme = useTheme();
  const { control, formState: { errors } } = useFormContext();

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.intro}>Leia os termos com atenção:</Text>

      <View style={styles.termsBox}>
        <ScrollView style={styles.termsScroll}>
          <Text style={styles.termsText}>
            Lorem ipsum dolor sit amet consectetur. Sed eget egestas egestas cursus sem nisl enim odio.
            Tincidunt id bibendum elit integer amet mauris augue cursus. Pharetra iaculis bibendum quis
            facilisi faucibus elementum enim. Diam malesuada odio nunc velit. Etiam aliquam amet consectetur
            consectetuer. Mattis interdum consectetur ut nibh ornare risus eu aenean. Eu tincidunt ipsum
            pellentesque urna. Ut dolor eget elementum ac vel egestas ut. Pharetra id viverra lacus pharetra
            habitasse dictum in tristique. Fermentum sed vitae dui congue fusce tellus sem vel mauris. Massa
            feugiat morbi fringilla id cursus ipsum facilisis amet.
            {"\n\n"}
            Nisl odio proin gravida nisi nunc pellentesque donec velit mi. Habitant commodo sed ornare
            tortor gravida turpis mauris morbi. Purus id nibh justo nunc. Enim metus vulputate sagittis justo
            lectus nunc. Pharetra suspendisse scelerisque posuere et.
            {"\n\n"}
            Tempor pulvinar eu quis ac. Odio nec quis massa nisi mauris commodo sit nunc auctor. Et eu
            condimentum morbi cursus. Consectetur purus fringilla non pulvinar. Est faucibus mauris
            ullamcorper sit ultricies adipiscing pretium odio. Tempus pellentesque adipiscing augue facilisis
            adipiscing eget egestas. Gravida mauris scelerisque nec lobortis est sit pulvinar. Quis...
          </Text>
        </ScrollView>
      </View>

      <View style={styles.checkboxContainer}>
        <Controller
          control={control}
          name="aceitouTermos"
          render={({ field: { onChange, value } }) => (
            <View style={styles.checkboxRow}>
              <Checkbox
                status={value ? 'checked' : 'unchecked'}
                onPress={() => onChange(!value)}
                color={theme.colors.primary}
              />
              <Text
                variant="bodyMedium"
                style={styles.checkboxLabel}
                onPress={() => onChange(!value)}
              >
                Li e aceito os termos de uso e a política de privacidade
              </Text>
            </View>
          )}
        />
        {errors.aceitouTermos && (
          <Text style={styles.errorText}>{errors.aceitouTermos.message as string}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  intro: {
    color: '#666',
  },
  termsBox: {
    height: 380,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
    padding: 16,
  },
  termsScroll: {
    flex: 1,
  },
  termsText: {
    lineHeight: 20,
    color: '#333',
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    flex: 1,
    color: '#333',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 40,
  },
});
