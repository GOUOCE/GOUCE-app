import React, { createContext, useState, useContext, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/authService';
import { limparCacheAgendamentos } from '../services/agendamentoService';
import { calcularStatusAluno } from '../utils/statusAluno';

export type UserRole = 'ALUNO' | 'MOTORISTA' | 'ADMINISTRADOR';

interface AuthContextData {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  pendingCredentials: { email: string; senha: string } | null;
  setPendingCredentials: (cred: { email: string; senha: string } | null) => void;
  clearPendingCredentials: () => void;
  signIn: (email: string, senha: string, role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  setUserAndToken: (user: User, token: string, refreshToken?: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function getHomeByRole(role?: string) {
  if (role === 'ADMINISTRADOR') return '/(administrador)/home';
  if (role === 'MOTORISTA') return '/(representante)/home';
  return '/(aluno)/home';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; senha: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();
  const segments = useSegments();
  // Marca a saída em andamento: a navegação para '/' pode ser aplicada antes de o estado `user` zerar,
  // e o guard, vendo ainda um usuário logado numa rota pública, o mandava de volta ao painel (#452).
  const encerrandoSessao = useRef(false);
  // Usuário atual para quem responde depois (ex.: perfil carregado após o logout não pode "ressuscitar" a sessão).
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const clearPendingCredentials = () => {
    setPendingCredentials(null);
  };

  // Restaura a sessão salva
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storageUser = await AsyncStorage.getItem('@GOUOCE:user');
        const storageToken = await AsyncStorage.getItem('@GOUOCE:token');

        if (storageUser && storageToken) {
          setUser(JSON.parse(storageUser));
          setToken(storageToken);
        }
      } catch (err) {
        console.warn('Erro ao restaurar sessão do AsyncStorage:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStorageData();
  }, []);

  // ÚNICO responsável pelo redirecionamento (login, restauração de sessão e proteção de rotas)
  useEffect(() => {
    if (isLoading) return;

    if (encerrandoSessao.current) {
      if (!user) encerrandoSessao.current = false;
      return;
    }

    const firstSegment = segments[0] as string | undefined;
    const isProtected = ['(aluno)', '(representante)', '(administrador)'].includes(firstSegment ?? '');
    const isRootOrAuth = !firstSegment || firstSegment === '(autenticacao)' || firstSegment === 'index';

    console.log('[GUARD]', { segments, status: user?.status, role: user?.role });

    if (!user && isProtected) {
      router.replace('/(autenticacao)/login');
      return;
    }

    if (user) {
      const status = (user.status || '').toLowerCase();
      const isAtPendingScreen = segments.includes('cadastro-pendente' as never);
      const isAtRejeitadoScreen = segments.includes('cadastro-rejeitado' as never);
      const isAtReenviarScreen = segments.includes('reenviar-documentos' as never);

      if (status === 'pendente') {
        if (!isAtPendingScreen) {
          router.replace('/(autenticacao)/cadastro-pendente');
        }
        return;
      }

      if (status === 'rejeitado') {
        if (!isAtRejeitadoScreen && !isAtReenviarScreen) {
          router.replace('/(autenticacao)/cadastro-rejeitado');
        }
        return;
      }

      // Qualquer status diferente de "pendente" entra na home do perfil
      if (isRootOrAuth) {
        router.replace(getHomeByRole(user.role) as any);
      }
    }
  }, [user, segments, isLoading]);

  async function setUserAndToken(userData: User, userToken: string, refreshToken?: string) {
    await limparCacheAgendamentos();
    await AsyncStorage.setItem('@GOUOCE:token', userToken);
    if (refreshToken) {
      await AsyncStorage.setItem('@GOUOCE:refreshToken', refreshToken);
    }
    await AsyncStorage.setItem('@GOUOCE:user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  }

  async function signIn(email: string, senha: string, selectedRole?: UserRole) {
    console.log('[AUTH] Iniciando login para:', email, 'com perfil selecionado:', selectedRole);
    const response = await authService.login({ email, senha });
    console.log('[AUTH] Resposta do login recebida com sucesso');

    const rolesDisponiveis: string[] = response.usuario.roles && response.usuario.roles.length > 0
      ? response.usuario.roles
      : [response.usuario.role];

    const rolesMapeadas: UserRole[] = rolesDisponiveis.map((r) => authService.mapRole(r));

    // Determina a role final da sessão com base no perfil selecionado pelo usuário ou perfil principal
    const roleFinal: UserRole = selectedRole && rolesMapeadas.includes(selectedRole)
      ? selectedRole
      : authService.mapRole(response.usuario.role);

    // Validação do perfil selecionado x perfis disponíveis da conta (AC-08 / HU-002 / HU-030)
    if (selectedRole && !rolesMapeadas.includes(selectedRole)) {
      const nomePerfilReal =
        roleFinal === 'ALUNO' ? 'Aluno' :
        roleFinal === 'MOTORISTA' ? 'Representante' : 'Administrador';

      const error: any = new Error(
        `Perfil incompatível. Sua conta é do perfil ${nomePerfilReal}. Por favor, escolha "Sou ${nomePerfilReal.toLowerCase()}" para continuar.`
      );
      error.code = 'ROLE_MISMATCH';
      error.actualRole = roleFinal;
      error.selectedRole = selectedRole;
      throw error;
    }

    const userData: User = {
      id: String(response.usuario.id),
      name: response.usuario.nome || response.usuario.nome_completo || 'Usuário',
      email: response.usuario.email,
      role: roleFinal,
      status: calcularStatusAluno(response.usuario.status_cadastro, response.usuario.acesso_expirado),
      telefone: response.usuario.telefone,
      curso: response.usuario.curso,
      faculdade: response.usuario.faculdade,
      periodo_ingresso: response.usuario.periodo_ingresso,
      turno: response.usuario.turno,
      foto_perfil: response.usuario.foto_perfil,
    };

    // Ao atualizar o user, redireciona imediatamente com base no status para evitar flash de tela
    await setUserAndToken(userData, response.token_acesso, response.token_atualizacao);
    setPendingCredentials(null);

    const st = (userData.status || '').toLowerCase();
    if (st === 'pendente') {
      router.replace('/(autenticacao)/cadastro-pendente');
    } else if (st === 'rejeitado') {
      router.replace('/(autenticacao)/cadastro-rejeitado');
    } else {
      router.replace(getHomeByRole(userData.role) as any);
    }
  }

  async function signOut() {
    encerrandoSessao.current = true;
    await AsyncStorage.removeItem('@GOUOCE:token');
    await AsyncStorage.removeItem('@GOUOCE:refreshToken');
    await AsyncStorage.removeItem('@GOUOCE:user');
    await limparCacheAgendamentos();
    userRef.current = null;
    setPendingCredentials(null);
    setUser(null);
    setToken(null);
    router.replace('/');
  }

  // Estável (só usa refs): quem o põe em dependência de efeito não dispara a cada render.
  const updateUser = useCallback(async (data: Partial<User>) => {
    const atual = userRef.current;
    if (!atual) return;
    const updatedUser = { ...atual, ...data };
    await AsyncStorage.setItem('@GOUOCE:user', JSON.stringify(updatedUser));
    // Se saiu da conta enquanto gravava, não restaura a sessão.
    if (!userRef.current) {
      await AsyncStorage.removeItem('@GOUOCE:user');
      return;
    }
    setUser(updatedUser);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      pendingCredentials,
      setPendingCredentials,
      clearPendingCredentials,
      signIn,
      signOut,
      setUserAndToken,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
