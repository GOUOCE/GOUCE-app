import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, SegmentedButtons, Avatar, Checkbox } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft, Search, User, Mail, X } from 'lucide-react-native';

import { criarAdminSchema, CriarAdminFormData } from '@/schemas/adminSchema';
import { adminService, AlunoAprovadoItem } from '@/services/adminService';
import { getErrorMessage } from '@/utils/errorUtils';
import { AppPopup, PopupType } from '@/components/ui/AppPopup';

export default function CadastrarAdministradorScreen() {
  const router = useRouter();

  const [aba, setAba] = useState<'promover' | 'novo'>('promover');
  const [buscaAluno, setBuscaAluno] = useState('');
  const [alunos, setAlunos] = useState<AlunoAprovadoItem[]>([]);
  const [alunoSelecionado, setAlunoSelecionado] = useState<AlunoAprovadoItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pop-up estilizado
  const [popup, setPopup] = useState<{
    visible: boolean;
    type?: PopupType;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  const showPopup = (config: Omit<typeof popup, 'visible'>) => {
    setPopup({ ...config, visible: true });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, visible: false }));
  };

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CriarAdminFormData>({
    resolver: zodResolver(criarAdminSchema),
    mode: 'onTouched',
    defaultValues: {
      nome: '',
      email: '',
    },
  });

  // Limpa o formulário e reseta seleções sempre que a tela ganha foco (BUG-HU006-UI-002)
  useFocusEffect(
    React.useCallback(() => {
      reset({ nome: '', email: '' });
      setAlunoSelecionado(null);
      setBuscaAluno('');
    }, [reset])
  );

  useEffect(() => {
    let isMounted = true;
    if (aba === 'promover') {
      adminService.listarAlunosAprovados(buscaAluno).then((lista) => {
        if (isMounted) setAlunos(lista);
      }).catch((err) => console.warn('Erro ao listar alunos aprovados:', err));
    }
    return () => { isMounted = false; };
  }, [aba, buscaAluno]);

  const getIniciais = (nome: string) => {
    if (!nome) return 'AL';
    const partes = nome.trim().split(/\s+/);
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const handlePromoverSubmit = () => {
    if (!alunoSelecionado) return;

    showPopup({
      type: 'info',
      title: 'Tornar administrador?',
      message: 'Essa ação não poderá ser desfeita.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        setIsLoading(true);
        try {
          await adminService.promoverAluno(alunoSelecionado.aluno_id || alunoSelecionado.id);
          setIsLoading(false);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: `${alunoSelecionado.nome} agora é administrador.`,
            confirmText: 'OK',
            onConfirm: () => {
              closePopup();
              reset({ nome: '', email: '' });
              router.replace('/(administrador)/administradores');
            },
          });
        } catch (error: any) {
          setIsLoading(false);
          const msg = getErrorMessage(error, 'Erro ao promover aluno a administrador.');
          showPopup({
            type: 'error',
            title: 'Erro',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  const handleNovoSubmit = (dados: CriarAdminFormData) => {
    showPopup({
      type: 'info',
      title: 'Finalizar cadastro?',
      message: 'Essa ação não poderá ser desfeita.',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm: async () => {
        closePopup();
        setIsLoading(true);
        try {
          await adminService.criarAdministrador(dados.nome, dados.email);
          setIsLoading(false);
          showPopup({
            type: 'success',
            title: 'Operação realizada com sucesso',
            message: 'O novo administrador foi cadastrado com sucesso.',
            confirmText: 'OK',
            onConfirm: () => {
              closePopup();
              reset({ nome: '', email: '' });
              router.replace('/(administrador)/administradores');
            },
          });
        } catch (error: any) {
          setIsLoading(false);
          const status = error.response?.status;
          const msg = status === 409
            ? 'Este e-mail já está em uso por outro usuário no sistema.'
            : getErrorMessage(error, 'Erro ao cadastrar administrador.');

          showPopup({
            type: 'error',
            title: 'Aviso',
            message: msg,
            confirmText: 'Entendido',
          });
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: '#F8F9FF' }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={32} color="#333" />
        </TouchableOpacity>
        <Text variant="headlineSmall" style={styles.headerTitle}>Cadastrar Administrador</Text>
      </View>

      {/* Pop-up Estilizado (Confirmação AC-07 / Erro) */}
      <AppPopup
        visible={popup.visible}
        type={popup.type}
        title={popup.title}
        message={popup.message}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        confirmColor={popup.confirmColor}
        onConfirm={popup.onConfirm}
        onDismiss={closePopup}
      />

      {/* Abas */}
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={aba}
          onValueChange={(val) => setAba(val as any)}
          buttons={[
            { value: 'promover', label: 'Promover Aluno' },
            { value: 'novo', label: 'Novo Cadastro' },
          ]}
          style={styles.segmented}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ABA PROMOVER ALUNO */}
        {aba === 'promover' && (
          <View style={styles.tabContent}>
            <TextInput
              placeholder="Buscar aluno por e-mail"
              value={buscaAluno}
              onChangeText={setBuscaAluno}
              mode="outlined"
              dense
              outlineStyle={styles.searchOutline}
              left={<TextInput.Icon icon={() => <Search size={20} color="#666" />} />}
              right={buscaAluno ? <TextInput.Icon icon={() => <X size={18} color="#666" />} onPress={() => setBuscaAluno('')} /> : undefined}
              style={styles.searchInput}
            />

            <View style={styles.alunoList}>
              {alunos.map((aluno) => {
                const isSelected = alunoSelecionado?.id === aluno.id;
                const instCampus = aluno.faculdade_id
                  ? `${aluno.faculdade_id}${aluno.campus ? ` - Campus ${aluno.campus}` : ''}`
                  : 'UFC - Campus Quixadá';

                return (
                  <TouchableOpacity
                    key={aluno.id}
                    style={styles.alunoRow}
                    onPress={() => setAlunoSelecionado(aluno)}
                  >
                    <Avatar.Text
                      size={44}
                      label={getIniciais(aluno.nome)}
                      style={styles.alunoAvatar}
                      labelStyle={styles.alunoAvatarLabel}
                    />
                    <View style={styles.alunoInfo}>
                      <Text variant="bodyLarge" style={styles.alunoName}>{aluno.nome}</Text>
                      <Text variant="bodySmall" style={styles.alunoSubText} numberOfLines={1}>
                        {aluno.email} | {instCampus}
                      </Text>
                    </View>
                    <Checkbox
                      status={isSelected ? 'checked' : 'unchecked'}
                      color="#3e5f90"
                      onPress={() => setAlunoSelecionado(aluno)}
                    />
                  </TouchableOpacity>
                );
              })}

              {alunos.length === 0 && (
                <Text style={styles.emptyText}>Nenhum aluno aprovado encontrado.</Text>
              )}
            </View>
          </View>
        )}

        {/* ABA NOVO CADASTRO */}
        {aba === 'novo' && (
          <View style={styles.tabContent}>
            <View style={styles.inputBox}>
              <Controller
                control={control}
                name="nome"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="Nome Completo *"
                    mode="outlined"
                    value={value}
                    onChangeText={onChange}
                    maxLength={150}
                    error={!!errors.nome}
                    left={<TextInput.Icon icon={() => <User size={20} color="#666" />} />}
                    style={styles.input}
                  />
                )}
              />
              {errors.nome && <Text style={styles.errorText}>{errors.nome.message}</Text>}
            </View>

            <View style={styles.inputBox}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    label="E-mail *"
                    mode="outlined"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    maxLength={150}
                    value={value}
                    onChangeText={onChange}
                    error={!!errors.email}
                    left={<TextInput.Icon icon={() => <Mail size={20} color="#666" />} />}
                    style={styles.input}
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer com Botão */}
      <View style={styles.footer}>
        {aba === 'promover' ? (
          <Button
            mode="contained"
            onPress={handlePromoverSubmit}
            disabled={!alunoSelecionado || isLoading}
            loading={isLoading}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            Tornar administrador
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleSubmit(handleNovoSubmit)}
            disabled={isLoading}
            loading={isLoading}
            style={styles.actionButton}
            contentStyle={styles.buttonContent}
          >
            Finalizar cadastro
          </Button>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  segmented: {
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 16,
  },
  searchInput: {
    backgroundColor: '#EAECEF',
    borderRadius: 28,
  },
  searchOutline: {
    borderRadius: 28,
    borderWidth: 0,
  },
  alunoList: {
    marginTop: 8,
  },
  alunoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  alunoAvatar: {
    backgroundColor: '#3E5F90',
  },
  alunoAvatarLabel: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  alunoInfo: {
    flex: 1,
  },
  alunoName: {
    fontWeight: '500',
    color: '#333',
  },
  alunoSubText: {
    color: '#666',
  },
  inputBox: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#fff',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    marginVertical: 24,
  },
  footer: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionButton: {
    borderRadius: 8,
    backgroundColor: '#3e5f90',
  },
  buttonContent: {
    height: 55,
  },
});
