import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput, TextInputProps, useTheme } from 'react-native-paper';

type CampoTextoRotuladoProps = Omit<TextInputProps, 'label' | 'mode'> & {
  rotulo: string;
};

// Campo de texto com o rótulo sempre na borda de cima, como no protótipo: o TextInput do Paper só sobe
// o rótulo com foco ou valor, e corta o rótulo flutuante quando há ícone num campo estreito
export function CampoTextoRotulado({ rotulo, error, onFocus, onBlur, style, ...props }: CampoTextoRotuladoProps) {
  const theme = useTheme();
  const [focado, setFocado] = useState(false);
  const cor = error ? theme.colors.error : focado ? theme.colors.primary : theme.colors.onSurfaceVariant;

  return (
    <View style={styles.caixa}>
      <TextInput
        {...props}
        mode="outlined"
        error={error}
        accessibilityLabel={rotulo}
        onFocus={(e) => {
          setFocado(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocado(false);
          onBlur?.(e);
        }}
        style={[styles.input, style]}
      />
      {/* Só uma faixa fina da cor do campo apaga a borda atrás do texto; o resto fica transparente */}
      <View pointerEvents="none" style={styles.rotuloCaixa}>
        <View style={styles.cobreBorda} />
        <Text numberOfLines={1} style={[styles.rotulo, { color: cor }]}>
          {rotulo}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Espaço acima da borda para o rótulo caber inteiro, sem ser cortado pelo que vem antes na tela
  caixa: {
    paddingTop: 8,
  },
  input: {
    backgroundColor: '#fff',
  },
  rotuloCaixa: {
    position: 'absolute',
    top: 0, // sem label, a borda do Paper fica no topo do campo (8 px abaixo da caixa); o rótulo fica centrado nela
    left: 12,
    paddingHorizontal: 4,
  },
  cobreBorda: {
    position: 'absolute',
    top: 7,
    height: 3,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
  },
  rotulo: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
});
