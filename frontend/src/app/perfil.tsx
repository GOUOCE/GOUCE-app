import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootPerfilRedirect() {
  const [targetRoute, setTargetRoute] = useState<string | null>(null);

  useEffect(() => {
    async function resolveRoute() {
      try {
        const userJson = await AsyncStorage.getItem('@GOUOCE:user');
        if (userJson) {
          const user = JSON.parse(userJson);
          const role = (user.role || '').toUpperCase();
          if (role === 'ADMINISTRADOR') {
            setTargetRoute('/(administrador)/mais');
          } else if (role === 'MOTORISTA' || role === 'REPRESENTANTE') {
            setTargetRoute('/(representante)/perfil');
          } else {
            setTargetRoute('/(aluno)/perfil');
          }
        } else {
          setTargetRoute('/(autenticacao)/login');
        }
      } catch {
        setTargetRoute('/(autenticacao)/login');
      }
    }
    resolveRoute();
  }, []);

  if (!targetRoute) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3E5F90" />
      </View>
    );
  }

  return <Redirect href={targetRoute as any} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
  },
});
