import { View } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useAuth } from '@contexts/AuthContext';
export default function Page() {
  const { signOut } = useAuth();
  return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center', gap: 20}}>
      <Text>Mais Opções</Text>
      <Button mode="contained" onPress={signOut} buttonColor="#904a45">Sair</Button>
    </View>
  )
}
