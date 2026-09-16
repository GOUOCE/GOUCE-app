import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Modal } from 'react-native';
import { TextInput, Text, Avatar, useTheme, Button, Portal } from 'react-native-paper';
import { useFormContext, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User, Calendar, Mail, Eye, EyeOff, Trash2, Image as ImageIcon } from 'lucide-react-native';

export function Passo1DadosBasicos() {
  const theme = useTheme();
  const { control, formState: { errors }, setValue, watch } = useFormContext();
  const [verSenha, setVerSenha] = useState(false);
  const [verConfirmarSenha, setVerConfirmarSenha] = useState(false);
  const [menuFotoVisivel, setMenuFotoVisivel] = useState(false);

  const fotoPerfil = watch('fotoPerfil');

  const tirarFoto = async () => {
    setMenuFotoVisivel(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("Você recusou o acesso à câmera!");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setValue('fotoPerfil', result.assets[0].uri);
    }
  };

  const escolherDaGaleria = async () => {
    setMenuFotoVisivel(false);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setValue('fotoPerfil', result.assets[0].uri);
    }
  };

  const removerFoto = () => {
    setMenuFotoVisivel(false);
    setValue('fotoPerfil', undefined);
  };

  return (
    <View style={styles.container}>
      <Text variant="titleMedium" style={styles.labelFoto}>Imagem de Perfil *</Text>

      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={() => setMenuFotoVisivel(true)} style={styles.avatarWrapper}>
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={styles.avatarImage} />
          ) : (
            <Avatar.Icon size={120} icon={() => <User size={60} color={theme.colors.primary} />} style={{ backgroundColor: '#E3EFFF' }} />
          )}
          <View style={[styles.cameraIcon, { backgroundColor: theme.colors.primary }]}>
            <Camera size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Modal Simulado para Opções de Foto (Bottom Sheet Style) */}
      <Portal>
        <Modal
          visible={menuFotoVisivel}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setMenuFotoVisivel(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuFotoVisivel(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <TouchableOpacity style={styles.modalOption} onPress={tirarFoto}>
                <Camera size={24} color="#333" />
                <Text variant="bodyLarge" style={styles.modalOptionText}>Tirar nova foto</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalOption} onPress={escolherDaGaleria}>
                <ImageIcon size={24} color="#333" />
                <Text variant="bodyLarge" style={styles.modalOptionText}>Escolher da galeria</Text>
              </TouchableOpacity>

              {fotoPerfil && (
                <TouchableOpacity style={styles.modalOption} onPress={removerFoto}>
                  <Trash2 size={24} color="#B00020" />
                  <Text variant="bodyLarge" style={[styles.modalOptionText, { color: '#B00020' }]}>Remover foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      </Portal>

      <Controller
        control={control}
        name="nomeCompleto"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Nome Completo *"
            mode="outlined"
            value={value}
            onChangeText={onChange}
            error={!!errors.nomeCompleto}
            left={<TextInput.Icon icon={() => <User size={20} color="#666" />} />}
            style={styles.input}
          />
        )}
      />
      {errors.nomeCompleto && <Text style={styles.errorText}>{errors.nomeCompleto.message as string}</Text>}

      <Controller
        control={control}
        name="dataNascimento"
        render={({ field: { onChange, value } }) => {
          const formatarData = (texto: string) => {
            // Remove tudo que não é número
            let limpo = texto.replace(/\D/g, '');

            // Limita a 8 dígitos (DDMMYYYY)
            if (limpo.length > 8) limpo = limpo.slice(0, 8);

            // Aplica a máscara DD/MM/YYYY
            let formatado = limpo;
            if (limpo.length > 2) {
              formatado = `${limpo.slice(0, 2)}/${limpo.slice(2)}`;
            }
            if (limpo.length > 4) {
              formatado = `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4)}`;
            }

            return formatado;
          };

          return (
            <TextInput
              label="Data de Nascimento *"
              mode="outlined"
              placeholder="DD/MM/AAAA"
              keyboardType="numeric"
              maxLength={10}
              value={value}
              onChangeText={(text) => onChange(formatarData(text))}
              error={!!errors.dataNascimento}
              left={<TextInput.Icon icon={() => <Calendar size={20} color="#666" />} />}
              style={styles.input}
            />
          );
        }}
      />
      {errors.dataNascimento && <Text style={styles.errorText}>{errors.dataNascimento.message as string}</Text>}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="E-mail *"
            mode="outlined"
            autoCapitalize="none"
            keyboardType="email-address"
            value={value}
            onChangeText={onChange}
            error={!!errors.email}
            left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
            style={styles.input}
          />
        )}
      />
      {errors.email && <Text style={styles.errorText}>{errors.email.message as string}</Text>}

      <Controller
        control={control}
        name="senha"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Senha *"
            mode="outlined"
            secureTextEntry={!verSenha}
            value={value}
            onChangeText={onChange}
            error={!!errors.senha}
            right={<TextInput.Icon icon={() => verSenha ? <EyeOff size={20} /> : <Eye size={20} />} onPress={() => setVerSenha(!verSenha)} />}
            style={styles.input}
          />
        )}
      />
      <Text style={styles.hint}>Mín. 8 caracteres, com letra maiúscula, minúscula e número.</Text>
      {errors.senha && <Text style={styles.errorText}>{errors.senha.message as string}</Text>}

      <Controller
        control={control}
        name="confirmarSenha"
        render={({ field: { onChange, value } }) => (
          <TextInput
            label="Confirmar Senha *"
            mode="outlined"
            secureTextEntry={!verConfirmarSenha}
            value={value}
            onChangeText={onChange}
            error={!!errors.confirmarSenha}
            right={<TextInput.Icon icon={() => verConfirmarSenha ? <EyeOff size={20} /> : <Eye size={20} />} onPress={() => setVerConfirmarSenha(!verConfirmarSenha)} />}
            style={styles.input}
          />
        )}
      />
      {errors.confirmarSenha && <Text style={styles.errorText}>{errors.confirmarSenha.message as string}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labelFoto: {
    marginBottom: 16,
    color: '#666',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginLeft: 4,
  },
  hint: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 16,
  },
  modalOptionText: {
    color: '#333',
    fontWeight: '500',
  },
});
