import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from '../services/authService';

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
  setUserAndToken: (user: User, token: string) => Promise<void>;
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

  const clearPendingCredentials = () => {
    setPendingCredentials(null);
  };

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storageUser = await AsyncStorage.getItem('@GOUOCE:user');
        const storageToken = await AsyncStorage.getItem('@GOUOCE:token');

        if (storageUser && storageToken) {
          const parsedUser = JSON.parse(storageUser);
          setUser(parsedUser);
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

    const firstSegment = segments[0];
    const isProtected = ['(aluno)', '(representante)', '(administrador)'].includes(firstSegment);
    const isRootOrAuth = !firstSegment || firstSegment === '(autenticacao)' || firstSegment === 'index';

    if (!user && isProtected) {
      router.replace('/(autenticacao)/login');
      return;
    }

    if (user) {
      const status = (user.status || '').toLowerCase();
      const isAtPendingScreen = segments.includes('cadastro-pendente' as never);

      if (status === 'pendente') {
        if (!isAtPendingScreen) {
          router.replace('/(autenticacao)/cadastro-pendente');
        }
        return;
      }

      // Restauração transparente da sessão ao abrir o app nas telas de boas-vindas / login (CT-HU002-UI-015)
      if (isRootOrAuth && user.status === 'ativado') {
        const root = user.role === 'ADMINISTRADOR' ? '/(administrador)/home' :
                     user.role === 'MOTORISTA' ? '/(representante)/home' : '/(aluno)/home';
        router.replace(root);
        return;
      }

      const roleMatches = (user.role === 'ADMINISTRADOR' && firstSegment === '(administrador)') ||
                          (user.role === 'MOTORISTA' && firstSegment === '(representante)') ||
                          (user.role === 'ALUNO' && firstSegment === '(aluno)');

      if (isProtected && !roleMatches && user.status === 'ativado') {
        router.replace('/acesso-negado');
      }
    }
  }, [user, segments, isLoading]);

  async function setUserAndToken(userData: User, userToken: string) {
    await AsyncStorage.setItem('@GOUOCE:token', userToken);
    await AsyncStorage.setItem('@GOUOCE:user', JSON.stringify(userData));
    setUser(userData);
    setToken(userToken);
  }

  async function signIn(email: string, senha: string, selectedRole?: UserRole) {
    setIsLoading(true);
    try {
      const response = await authService.login({ email, senha });
      const actualRole = authService.mapRole(response.usuario.role);

      // Validação do perfil selecionado x perfil real da conta (AC-08 / CT-HU002-UI-009)
      if (selectedRole && selectedRole !== actualRole) {
        const nomePerfilReal =
          actualRole === 'ALUNO' ? 'Aluno' :
          actualRole === 'MOTORISTA' ? 'Representante' : 'Administrador';

        const error: any = new Error(
          `Perfil incompatível. Sua conta é do perfil ${nomePerfilReal}. Por favor, escolha "Sou ${nomePerfilReal.toLowerCase()}" para continuar.`
        );
        error.code = 'ROLE_MISMATCH';
        error.actualRole = actualRole;
        error.selectedRole = selectedRole;
        throw error;
      }

      const userData: User = {
        id: String(response.usuario.id),
        name: response.usuario.nome || response.usuario.nome_completo || 'Usuário',
        email: response.usuario.email,
        role: actualRole,
        status: response.usuario.status_cadastro || 'ativado',
        telefone: response.usuario.telefone,
        curso: response.usuario.curso,
        faculdade: response.usuario.faculdade,
        periodo_ingresso: response.usuario.periodo_ingresso,
        turno: response.usuario.turno,
        foto_perfil: response.usuario.foto_perfil,
      };

      await setUserAndToken(userData, response.token_acesso);
      setPendingCredentials(null);

      const root = userData.role === 'ADMINISTRADOR' ? '/(administrador)/home' :
                   userData.role === 'MOTORISTA' ? '/(representante)/home' : '/(aluno)/home';
      router.replace(root);
    } catch (error) {
      throw error;
    }

    const userData: User = {
      id: String(response.usuario.id),
      name: response.usuario.nome || response.usuario.nome_completo || 'Usuário',
      email: response.usuario.email,
      role: actualRole,
      status: String(response.usuario.status_cadastro || 'ativado').toLowerCase() as User['status'],
      telefone: response.usuario.telefone,
      curso: response.usuario.curso,
      faculdade: response.usuario.faculdade,
      periodo_ingresso: response.usuario.periodo_ingresso,
      turno: response.usuario.turno,
      foto_perfil: response.usuario.foto_perfil,
    };

    // Ao atualizar o user, o useEffect acima faz o redirecionamento (home ou cadastro pendente)
    await setUserAndToken(userData, response.token_acesso);
    setPendingCredentials(null);
    console.log('[AUTH] Sessão salva. Redirecionamento delegado ao guard.');
  }

  async function signOut() {
    await AsyncStorage.removeItem('@GOUOCE:token');
    await AsyncStorage.removeItem('@GOUOCE:user');
    setPendingCredentials(null);
    setUser(null);
    setToken(null);
    router.replace('/');
  }

  async function updateUser(data: Partial<User>) {
    if (user) {
      const updatedUser = { ...user, ...data };
      await AsyncStorage.setItem('@GOUOCE:user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
  }

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
